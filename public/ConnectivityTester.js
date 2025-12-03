// ConnectivityTester.js - MOTOR DE TESTES DE CONECTIVIDADE ENTERPRISE
// Sistema completo de testes de conectividade para servidores RDP/SSH

const { exec } = require('child_process');
const net = require('net');
const dns = require('dns').promises;
const os = require('os');

class ConnectivityTester {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 30000;

        // Inicializa estatísticas
        this.stats = {
            testsExecuted: 0,
            cacheHits: 0,
            errors: 0
        };

        // Configurações padrão
        this.config = {
            ping: {
                packets: 4,
                timeout: 4000
            },
            port: {
                timeout: 2000
            }
        };

        // ✅ NOVO: Iniciar cleanup automático
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredCache();
        }, 300000); // 5 minutos

        console.log('✅ ConnectivityTester: Cleanup automático inicializado');
    }

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            console.log('✅ ConnectivityTester: Cleanup interval destruído');
        }

        this.cache.clear();
        console.log('✅ ConnectivityTester: Cache limpo');
    }
    /**
     * Testa conectividade completa de um servidor
     * @param {Object} serverInfo - Informações do servidor
     * @returns {Promise<Object>} - Resultado detalhado do teste
     */
    async testServerConnectivity(serverInfo) {
        const startTime = Date.now();

        try {
            // Validação básica
            if (!serverInfo || !serverInfo.ipAddress) {
                throw new Error('Informações do servidor inválidas');
            }

            // Gera chave única para cache
            const port = serverInfo.port || (serverInfo.protocol === 'rdp' ? 3389 : 22);
            const cacheKey = `${serverInfo.ipAddress}:${port}`;

            // Verifica cache primeiro
            const cachedResult = this.getCachedResult(cacheKey);
            if (cachedResult) {
                this.stats.cacheHits++;
                console.log(`📋 Cache hit para ${cacheKey}`);
                return cachedResult;
            }

            console.log(`🧪 Testando conectividade: ${serverInfo.name || serverInfo.ipAddress}:${port}`);

            // Executa todos os testes em paralelo
            const [dnsResult, pingResult, portResult] = await Promise.allSettled([
                this.testDNS(serverInfo.ipAddress),
                this.testPing(serverInfo.ipAddress),
                this.testPortConnectivity(serverInfo.ipAddress, port)
            ]);

            // Mede latência TCP adicional se a porta estiver aberta
            let tcpLatencyResult = null;
            if (portResult.status === 'fulfilled' && portResult.value.isOpen) {
                try {
                    tcpLatencyResult = await this.measureTCPLatency(serverInfo.ipAddress, port);
                } catch (error) {
                    console.warn(`⚠️ Falha ao medir latência TCP: ${error.message}`);
                }
            }

            // Compila resultados
            const result = this.analyzeResults({
                dns: dnsResult.status === 'fulfilled' ? dnsResult.value : { error: dnsResult.reason?.message },
                ping: pingResult.status === 'fulfilled' ? pingResult.value : { error: pingResult.reason?.message },
                port: portResult.status === 'fulfilled' ? portResult.value : { error: portResult.reason?.message },
                tcpLatency: tcpLatencyResult
            }, serverInfo, Date.now() - startTime);

            // Salva no cache
            this.setCachedResult(cacheKey, result);
            this.stats.testsExecuted++;

            console.log(`✅ Teste concluído para ${cacheKey}: ${result.status} (${result.totalTime}ms)`);
            return result;

        } catch (error) {
            this.stats.errors++;
            console.error(`❌ Erro no teste de conectividade: ${error.message}`);

            const errorResult = {
                status: 'error',
                message: `Erro no teste: ${error.message}`,
                error: error.message,
                timestamp: Date.now(),
                totalTime: Date.now() - startTime,
                server: serverInfo
            };

            return errorResult;
        }
    }

    /**
     * Testa conectividade de múltiplos servidores simultaneamente
     * @param {Array} servers - Array de informações de servidores
     * @returns {Promise<Array>} - Array de resultados
     */
    async testMultipleServers(servers) {
        if (!Array.isArray(servers) || servers.length === 0) {
            throw new Error('Lista de servidores inválida');
        }

        console.log(`🔄 Iniciando teste batch de ${servers.length} servidor(es)`);
        const startTime = Date.now();

        try {
            // Executa testes em paralelo (máximo 5 simultâneos para não sobrecarregar)
            const batchSize = 5;
            const results = [];

            for (let i = 0; i < servers.length; i += batchSize) {
                const batch = servers.slice(i, i + batchSize);
                const batchPromises = batch.map(async (server) => {
                    try {
                        const result = await this.testServerConnectivity(server);
                        return { server, result, success: true };
                    } catch (error) {
                        console.error(`❌ Erro no teste de ${server.name}:`, error);
                        return {
                            server,
                            result: {
                                status: 'error',
                                error: error.message,
                                timestamp: Date.now()
                            },
                            success: false
                        };
                    }
                });

                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : r.reason));
            }

            const totalTime = Date.now() - startTime;
            console.log(`✅ Teste batch concluído: ${results.length} servidor(es) em ${totalTime}ms`);

            return results;

        } catch (error) {
            console.error(`❌ Erro no teste batch:`, error);
            throw error;
        }
    }

    /**
     * Testa resolução DNS
     * @private
     */
    async testDNS(hostname) {
        try {
            const addresses = await dns.resolve4(hostname);
            return {
                success: true,
                addresses,
                resolvedTo: addresses[0],
                time: Date.now()
            };
        } catch (error) {
            // Tenta como IPv6
            try {
                const addresses = await dns.resolve6(hostname);
                return {
                    success: true,
                    addresses,
                    resolvedTo: addresses[0],
                    type: 'IPv6',
                    time: Date.now()
                };
            } catch (ipv6Error) {
                return {
                    success: false,
                    error: error.message,
                    time: Date.now()
                };
            }
        }
    }

    /**
     * Executa teste de ping
     * @private
     */
    async testPing(ipAddress) {
        return new Promise((resolve) => {
            const isWindows = os.platform() === 'win32';
            const pingCommand = isWindows
                ? `ping -n ${this.config.ping.packets} -w ${this.config.ping.timeout} ${ipAddress}`
                : `ping -c ${this.config.ping.packets} -W ${Math.floor(this.config.ping.timeout / 1000)} ${ipAddress}`;

            const startTime = Date.now();

            exec(pingCommand, { timeout: this.config.ping.timeout + 1000 }, (error, stdout, stderr) => {
                const endTime = Date.now();

                if (error) {
                    resolve({
                        success: false,
                        error: error.message,
                        time: endTime - startTime
                    });
                    return;
                }

                try {
                    const result = this.parsePingOutput(stdout, isWindows);
                    result.time = endTime - startTime;
                    resolve(result);
                } catch (parseError) {
                    resolve({
                        success: false,
                        error: `Erro ao analisar ping: ${parseError.message}`,
                        time: endTime - startTime,
                        rawOutput: stdout
                    });
                }
            });
        });
    }

    /**
     * Analisa saída do comando ping
     * @private
     */
    parsePingOutput(output, isWindows) {
        if (isWindows) {
            // Análise para Windows
            const packetLossMatch = output.match(/\((\d+)% loss\)|perdidos = \d+ \((\d+)%\)/);
            const timeMatch = output.match(/Average = (\d+)ms|Média = (\d+)ms/);

            let packetLoss = 100;
            if (packetLossMatch) {
                packetLoss = parseInt(packetLossMatch[1] || packetLossMatch[2], 10);
            }

            let averageLatency = null;
            if (timeMatch) {
                averageLatency = parseInt(timeMatch[1] || timeMatch[2], 10);
            }

            return {
                success: packetLoss < 100,
                packetLoss: packetLoss + '%',
                averageLatency,
                rawOutput: output
            };
        } else {
            // Análise para Linux/Mac
            const packetLossMatch = output.match(/(\d+)% packet loss/);
            const timeMatch = output.match(/min\/avg\/max\/stddev = ([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+) ms/);

            let packetLoss = 100;
            if (packetLossMatch) {
                packetLoss = parseInt(packetLossMatch[1], 10);
            }

            let averageLatency = null;
            if (timeMatch) {
                averageLatency = Math.round(parseFloat(timeMatch[2]));
            }

            return {
                success: packetLoss < 100,
                packetLoss: packetLoss + '%',
                averageLatency,
                rawOutput: output
            };
        }
    }

    /**
     * Testa conectividade de porta TCP
     * @private
     */
    async testPortConnectivity(ipAddress, port) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const socket = new net.Socket();

            // Timeout do teste
            const timeout = setTimeout(() => {
                socket.destroy();
                resolve({
                    isOpen: false,
                    status: 'timeout',
                    time: Date.now() - startTime,
                    port
                });
            }, this.config.port.timeout);

            socket.connect(port, ipAddress, () => {
                clearTimeout(timeout);
                socket.end();
                resolve({
                    isOpen: true,
                    status: 'open',
                    time: Date.now() - startTime,
                    port
                });
            });

            socket.on('error', (error) => {
                clearTimeout(timeout);
                socket.destroy();
                resolve({
                    isOpen: false,
                    status: 'closed',
                    error: error.message,
                    time: Date.now() - startTime,
                    port
                });
            });
        });
    }

    /**
     * Mede latência TCP específica
     * @private
     */
    async measureTCPLatency(ipAddress, port, samples = 3) {
        const results = [];

        for (let i = 0; i < samples; i++) {
            try {
                const result = await this.singleTCPLatencyTest(ipAddress, port);
                results.push(result.time);
            } catch (error) {
                // Ignora falhas individuais
            }

            // Pequeno delay entre testes
            if (i < samples - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        if (results.length === 0) {
            throw new Error('Nenhum teste de latência TCP foi bem-sucedido');
        }

        const min = Math.min(...results);
        const max = Math.max(...results);
        const average = Math.round(results.reduce((a, b) => a + b, 0) / results.length);

        return {
            success: true,
            samples: results.length,
            min,
            max,
            average,
            results
        };
    }

    /**
     * Executa um único teste de latência TCP
     * @private
     */
    async singleTCPLatencyTest(ipAddress, port) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const socket = new net.Socket();

            const timeout = setTimeout(() => {
                socket.destroy();
                reject(new Error('Timeout'));
            }, 2000);

            socket.connect(port, ipAddress, () => {
                clearTimeout(timeout);
                const time = Date.now() - startTime;
                socket.end();
                resolve({ time });
            });

            socket.on('error', (error) => {
                clearTimeout(timeout);
                socket.destroy();
                reject(error);
            });
        });
    }

    /**
     * Analisa todos os resultados dos testes e determina status final
     * @private
     */
    analyzeResults(tests, serverInfo, totalTime) {
        let status = 'unknown';
        let message = 'Status desconhecido';

        // Verifica se há erros críticos
        if (tests.dns.error && tests.ping.error && tests.port.error) {
            status = 'error';
            message = 'Falha em todos os testes de conectividade';
        }
        // Se ping falha mas porta está aberta (firewall bloqueando ICMP)
        else if (tests.port.isOpen) {
            status = 'online';
            message = tests.ping.success
                ? `Servidor online e porta ${tests.port.port} acessível`
                : `Servidor online (porta ${tests.port.port} aberta, ping bloqueado)`;
        }
        // Se ping funciona mas porta está fechada
        else if (tests.ping.success && !tests.port.isOpen) {
            status = 'partial';
            message = `Servidor responde mas porta ${tests.port.port} inacessível`;
        }
        // Se ping funciona e porta não foi testada adequadamente
        else if (tests.ping.success) {
            status = 'partial';
            message = 'Servidor responde ao ping';
        }
        // Se nada funciona
        else {
            status = 'offline';
            message = 'Servidor não está acessível';
        }

        return {
            status,
            message,
            timestamp: Date.now(),
            totalTime,
            server: {
                name: serverInfo.name,
                ipAddress: serverInfo.ipAddress,
                port: serverInfo.port || (serverInfo.protocol === 'rdp' ? 3389 : 22)
            },
            tests
        };
    }

    /**
     * Gerenciamento de cache
     */
    getCachedResult(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.result;
        }
        // Remove cache expirado
        if (cached) {
            this.cache.delete(key);
        }
        return null;
    }

    setCachedResult(key, result) {
        this.cache.set(key, {
            result,
            timestamp: Date.now()
        });
    }

    clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        console.log(`🧹 Cache limpo: ${size} entrada(s) removida(s)`);
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            activeTests: this.stats.testsExecuted,
            cacheHits: this.stats.cacheHits,
            errors: this.stats.errors,
            cacheTimeout: this.cacheTimeout
        };
    }

    /**
     * Cleanup automático (chamado periodicamente)
     */
    cleanupExpiredCache() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 Limpeza automática: ${cleaned} entrada(s) expirada(s) removida(s)`);
        }
    }
}

// Cleanup automático a cada 5 minutos
setInterval(() => {
    if (global.connectivityTester) {
        global.connectivityTester.cleanupExpiredCache();
    }
}, 300000);

module.exports = ConnectivityTester;