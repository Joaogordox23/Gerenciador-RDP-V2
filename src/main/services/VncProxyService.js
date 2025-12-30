const WebSocket = require('ws');
const net = require('net');
const http = require('http');
const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;

// ✅ Aumenta threadpool para evitar bloqueio em resoluções DNS (Windows issue)
process.env.UV_THREADPOOL_SIZE = 128;

class VncProxyService {
    constructor() {
        this.proxies = new Map(); // serverId -> { server, port }
        this.dnsCache = new Map(); // hostname -> { ip, timestamp }
        this.startPort = 6080;
        this.currentPort = this.startPort;
        this.startGc(); // Inicia o garbage collector
    }

    async resolveHost(hostname) {
        // Se já é IP, retorna direto
        if (net.isIP(hostname)) return hostname;

        // Verifica cache (validade 5 minutos)
        const now = Date.now();
        if (this.dnsCache.has(hostname)) {
            const cached = this.dnsCache.get(hostname);
            if (now - cached.timestamp < 5 * 60 * 1000) {
                return cached.ip;
            }
        }

        try {
            const { address } = await dns.lookup(hostname, { family: 4 });
            this.dnsCache.set(hostname, { ip: address, timestamp: now });
            console.log(`🔍 [DNS] Resolvido: ${hostname} -> ${address}`);
            return address;
        } catch (e) {
            console.warn(`⚠️ [DNS] Falha ao resolver ${hostname}: ${e.message}`);
            return hostname; // Tenta conectar com hostname mesmo assim
        }
    }

    async startProxy(serverInfo) {
        // Verifica se já existe proxy para este servidor
        if (this.proxies.has(serverInfo.id)) {
            const existing = this.proxies.get(serverInfo.id);
            // Verifica se a porta ainda está ouvindo (básico)
            if (existing && existing.server && existing.server.listening) {
                console.log(`♻️ [Smart-Reuse] Reutilizando proxy existente para ${serverInfo.name} na porta ${existing.port}`);
                existing.lastUsed = Date.now(); // ✅ Refresh timestamp
                return existing.port;
            }
            // Se algo estiver errado com o existente, limpa
            console.warn(`⚠️ [Self-Healing] Proxy existente para ${serverInfo.name} parece inválido. Reiniciando...`);
            await this.stopProxy(serverInfo.id);
        }

        const port = await this.findAvailablePort();
        // ✅ Resolve DNS antes de criar conexão para evitar bloqueio da threadpool
        const targetHost = await this.resolveHost(serverInfo.ipAddress);
        const targetPort = serverInfo.port || 5900;

        // ... resta do código igual
        console.log(`🔌 Iniciando proxy VNC: :${port} -> ${targetHost}:${targetPort}`);

        const server = http.createServer();
        const wss = new WebSocket.Server({ server });

        // ✅ v5.9: Error handlers para prevenir crashes silenciosos
        wss.on('error', (err) => {
            console.error(`❌ [WSS] Erro no WebSocket Server porta ${port}:`, err.message);
        });

        wss.on('connection', (ws) => {
            // ... handlers
            console.log(`🔗 Cliente conectado ao proxy :${port}`);

            const target = net.createConnection(targetPort, targetHost, () => {
                console.log(`✅ Conectado ao servidor VNC remoto ${targetHost}:${targetPort}`);
            });

            target.on('data', (data) => {
                try {
                    if (ws.readyState === WebSocket.OPEN) ws.send(data);
                } catch (e) {
                    console.error('Erro ao enviar dados para cliente:', e);
                }
            });

            ws.on('message', (msg) => {
                try {
                    target.write(msg);
                } catch (e) {
                    console.error('Erro ao enviar dados para servidor remoto:', e);
                }
            });

            // ✅ v5.10: Handler de erro para conexão individual WebSocket
            ws.on('error', (err) => {
                console.warn(`⚠️ [WS Client :${port}] Erro na conexão: ${err.message}`);
                target.destroy();
            });

            ws.on('close', () => {
                console.log(`🔌 Cliente desconectou do proxy :${port}`);
                // ✅ VITAL: Destruir a conexão TCP imediatamente para evitar TIME_WAIT ou sockets zumbis
                target.destroy();
            });

            target.on('close', () => {
                // console.log('🔌 Servidor remoto desconectou');
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            });

            target.on('error', (err) => {
                console.error('❌ Erro na conexão com servidor remoto:', err.message);
                target.destroy();
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            });
        });

        // Atualiza timestamp de uso
        if (this.proxies.has(serverInfo.id)) {
            const p = this.proxies.get(serverInfo.id);
            p.lastUsed = Date.now();
        }

        return new Promise((resolve, reject) => {
            server.listen(port, () => {
                console.log(`🚀 Proxy VNC ouvindo na porta ${port}`);
                this.proxies.set(serverInfo.id, { server, port, wss, lastUsed: Date.now() });
                resolve(port);
            });

            server.on('error', (err) => {
                reject(err);
            });
        });
    }

    async stopProxy(serverId) {
        if (this.proxies.has(serverId)) {
            const proxyData = this.proxies.get(serverId);
            if (!proxyData) return true; // Já foi removido

            const { server, port, wss } = proxyData;

            // ✅ FORÇA FECHAMENTO DE TODOS OS CLIENTES CONECTADOS
            if (wss) {
                // console.log(`✂️ Encerrando ${wss.clients.size} conexões ativas no proxy :${port}`);
                for (const ws of wss.clients) {
                    try {
                        ws.terminate();
                    } catch (e) { }
                }
                wss.close();
            }

            return new Promise((resolve) => {
                try {
                    server.close(() => {
                        console.log(`🛑 Proxy na porta ${port} parado completamente.`);
                        this.proxies.delete(serverId);
                        resolve(true);
                    });
                } catch (e) {
                    // Se falhar ao fechar, remove do mapa mesmo assim
                    this.proxies.delete(serverId);
                    resolve(true);
                }
            });
        }
        return false;
    }

    stopAll() {
        console.log(`🛑 Parando todos os ${this.proxies.size} proxies VNC...`);
        if (this.gcInterval) clearInterval(this.gcInterval);
        for (const [id] of this.proxies) {
            this.stopProxy(id);
        }
    }

    /**
     * ✅ v5.9: Shutdown graceful para hot-reload e encerramento do app
     */
    shutdown() {
        console.log('🛑 [VncProxyService] Iniciando shutdown graceful...');
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
            this.gcInterval = null;
        }
        this.stopAll();
        this.dnsCache.clear();
        console.log('✅ [VncProxyService] Shutdown completo.');
    }

    // ✅ v5.7: Garbage Collector para evitar vazamento de portas
    startGc() {
        if (this.gcInterval) clearInterval(this.gcInterval);
        this.gcInterval = setInterval(() => {
            this.cleanupIdleProxies();
        }, 60 * 1000); // Roda a cada 1 minuto
    }

    async cleanupIdleProxies() {
        const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutos sem uso
        const now = Date.now();
        let cleaned = 0;

        for (const [id, data] of this.proxies) {
            // Se tem clientes conectados, não mexe
            if (data.wss && data.wss.clients.size > 0) {
                data.lastUsed = now;
                continue;
            }

            if (now - data.lastUsed > IDLE_TIMEOUT) {
                console.log(`🧹 [GC] Removendo proxy inativo ${id} (Porta ${data.port})`);
                await this.stopProxy(id);
                cleaned++;
            }
        }

        if (cleaned > 0) console.log(`🧹 [GC] Limpeza concluída: ${cleaned} proxies removidos.`);

        // ✅ v5.10: Limpa cache DNS antigo (> 30 min)
        const DNS_CACHE_TTL = 30 * 60 * 1000;
        let dnsCleared = 0;
        for (const [hostname, data] of this.dnsCache) {
            if (now - data.timestamp > DNS_CACHE_TTL) {
                this.dnsCache.delete(hostname);
                dnsCleared++;
            }
        }
        if (dnsCleared > 0) console.log(`🧹 [GC] Limpeza DNS: ${dnsCleared} entradas expiradas removidas.`);
    }

    async findAvailablePort() {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.listen(0, () => {
                const port = server.address().port;
                server.close(() => {
                    resolve(port);
                });
            });
        });
    }

    /**
     * Verifica se conexão VNC está acessível (teste TCP rápido)
     * Muito mais rápido e confiável que handshake VNC completo
     */
    async captureSnapshot(serverInfo, timeout = 3000) {
        const targetHost = await this.resolveHost(serverInfo.ipAddress);
        const targetPort = parseInt(serverInfo.port) || 5900;

        return new Promise((resolve) => {
            const socket = net.createConnection({
                host: targetHost,
                port: targetPort,
                timeout: timeout
            });

            const timeoutId = setTimeout(() => {
                socket.destroy();
                resolve(null);
            }, timeout);

            socket.on('connect', () => {
                clearTimeout(timeoutId);
                socket.destroy();
                resolve({
                    connected: true,
                    timestamp: Date.now(),
                    host: targetHost,
                    port: targetPort
                });
            });

            socket.on('timeout', () => {
                clearTimeout(timeoutId);
                socket.destroy();
                resolve(null);
            });

            socket.on('error', () => {
                clearTimeout(timeoutId);
                socket.destroy();
                resolve(null);
            });
        });
    }
}

module.exports = new VncProxyService();
