/**
 * GuacamoleServer.js
 * Backend guacamole-lite para integração com Electron
 * Usa formato correto de token: {iv, value} em Base64
 */

const GuacamoleLite = require('guacamole-lite');
const crypto = require('crypto');

class GuacamoleServer {
    constructor(port = 8080) {
        this.port = port;
        this.server = null;

        // Chave de 32 bytes para AES-256-CBC (DEVE ter exatamente 32 chars)
        this.secretKey = 'GerenciadorRDPv2SecretKey123456!';
        this.cypher = 'AES-256-CBC';

        this.guacdOptions = {
            host: '127.0.0.1',
            port: 4822
        };

        this.clientOptions = {
            log: {
                level: 'VERBOSE'
            },
            crypt: {
                cypher: this.cypher,
                key: this.secretKey
            }
        };
    }

    /**
     * Inicia o servidor WebSocket para conexões Guacamole
     */
    start() {
        return new Promise((resolve, reject) => {
            try {
                console.log('🚀 Iniciando GuacamoleServer na porta', this.port);
                console.log('🔐 Cypher:', this.cypher);
                console.log('🔑 Key length:', this.secretKey.length);

                const websocketOptions = {
                    port: this.port
                };

                this.server = new GuacamoleLite(
                    websocketOptions,
                    this.guacdOptions,
                    this.clientOptions
                );

                console.log('✅ GuacamoleServer iniciado com sucesso!');
                console.log(`   WebSocket: ws://localhost:${this.port}`);
                console.log(`   guacd: ${this.guacdOptions.host}:${this.guacdOptions.port}`);

                resolve(this.server);
            } catch (error) {
                console.error('❌ Erro ao iniciar GuacamoleServer:', error);
                reject(error);
            }
        });
    }

    /**
     * Para o servidor WebSocket
     */
    stop() {
        if (this.server) {
            console.log('🛑 Parando GuacamoleServer...');
            if (this.server.server) {
                this.server.server.close();
            }
            this.server = null;
            console.log('✅ GuacamoleServer parado.');
        }
    }

    /**
     * Gera token de conexão no formato correto para guacamole-lite
     * Formato: Base64({ iv: base64, value: base64(AES(JSON)) })
     */
    generateConnectionToken(connectionSettings) {
        // 🔍 DIAGNÓSTICO: Verificar tamanho de cada campo
        console.log('🔍 Diagnóstico de tamanho dos campos:');
        Object.keys(connectionSettings).forEach(key => {
            const value = connectionSettings[key];
            const size = typeof value === 'string' ? value.length : JSON.stringify(value).length;
            if (size > 100) {
                console.warn(`⚠️ Campo "${key}" tem tamanho anormal: ${size} caracteres`);
            }
        });

        const connectionData = {
            connection: {
                type: connectionSettings.protocol || 'rdp',
                settings: this.buildConnectionSettings(connectionSettings)
            }
        };

        console.log('🔐 Gerando token para:', connectionData.connection.type);

        // 1. Gerar IV aleatório de 16 bytes
        const iv = crypto.randomBytes(16);

        // 2. Criar cipher AES-256-CBC
        const cipher = crypto.createCipheriv(
            this.cypher,
            Buffer.from(this.secretKey, 'utf8'),
            iv
        );

        // 3. Criptografar o JSON
        const jsonStr = JSON.stringify(connectionData);
        let encrypted = cipher.update(jsonStr, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        // 4. Criar objeto token no formato esperado
        const tokenObject = {
            iv: iv.toString('base64'),
            value: encrypted.toString('base64')
        };

        // 5. Converter todo o objeto para Base64
        const token = Buffer.from(JSON.stringify(tokenObject)).toString('base64');

        console.log('✅ Token gerado com sucesso!');
        console.log('📦 Token length:', token.length);

        return token;
    }

    /**
     * Constrói configurações específicas por protocolo
     * Documentação: https://guacamole.apache.org/doc/gug/configuring-guacamole.html
     */
    buildConnectionSettings(settings) {
        const base = {
            hostname: settings.hostname || settings.ipAddress,
            port: String(settings.port || '')
        };

        switch (settings.protocol) {
            case 'rdp':
                // Extrai domínio do username se estiver no formato "domínio\\usuário"
                let username = settings.username || '';
                let domain = settings.domain || '';
                const hostnameRaw = settings.hostname || settings.ipAddress || '';

                console.log('🔑 RDP Settings recebidos:', {
                    username: username,
                    domain: domain,
                    hostname: hostnameRaw
                });

                // Extrai domínio do username se no formato "domínio\usuário"
                if (username.includes('\\')) {
                    const parts = username.split('\\');
                    domain = parts[0];
                    username = parts[1];
                    console.log(`📝 Domínio extraído do username: ${domain}, Usuário: ${username}`);
                }

                // Se não temos domínio e o hostname é FQDN, extrai o domínio AD dele
                if (!domain && hostnameRaw.includes('.')) {
                    const parts = hostnameRaw.split('.');
                    if (parts.length >= 2) {
                        domain = parts[1];
                        console.log(`📝 Domínio extraído do hostname: ${domain}`);
                    }
                }

                console.log('🥑 RDP Final:', { username, domain, hostname: hostnameRaw });

                return {
                    ...base,
                    port: String(settings.port || 3389),
                    username: username,
                    password: settings.password || '',
                    domain: domain,

                    // === SEGURANÇA ===
                    security: 'any',
                    'ignore-cert': 'true',

                    // === REDIMENSIONAMENTO AUTOMÁTICO ===
                    // display-update: usa RDP 8.1+ para redimensionar dinamicamente
                    'resize-method': 'display-update',

                    // Dimensões iniciais (serão atualizadas pelo cliente)
                    width: String(settings.width || 1920),
                    height: String(settings.height || 1080),
                    dpi: String(settings.dpi || 96),

                    // === QUALIDADE E PERFORMANCE ===
                    'color-depth': String(settings.colorDepth || 16),

                    // Desabilita efeitos visuais para melhor performance
                    'enable-wallpaper': 'false',
                    'enable-theming': 'false',
                    'enable-font-smoothing': 'true',
                    'enable-full-window-drag': 'false',
                    'enable-desktop-composition': 'false',
                    'enable-menu-animations': 'false',

                    // === CLIPBOARD ===
                    'disable-copy': 'false',
                    'disable-paste': 'false'
                };

            case 'ssh':
                console.log('🐚 SSH Settings:', {
                    hostname: settings.hostname || settings.ipAddress,
                    username: settings.username,
                    port: settings.port || 22
                });

                return {
                    ...base,
                    port: String(settings.port || 22),
                    username: settings.username || '',
                    password: settings.password || '',

                    // === TERMINAL ===
                    'font-size': String(settings.fontSize || 14),
                    'font-name': settings.fontName || 'monospace',
                    'color-scheme': settings.colorScheme || 'gray-black',

                    // === HISTÓRICO ===
                    scrollback: String(settings.scrollback || 1000),

                    // === TERMINAL SIZE ===
                    // Dimensões em caracteres (não pixels)
                    // Serão calculados baseado no tamanho do container

                    // === LOCALE ===
                    locale: settings.locale || 'pt_BR.UTF-8',
                    timezone: settings.timezone || 'America/Sao_Paulo'
                };

            case 'vnc':
                // VNC via Guacamole (fallback, preferimos noVNC direto)
                return {
                    ...base,
                    port: String(settings.port || 5900),
                    password: settings.password || '',
                    'color-depth': String(settings.colorDepth || 16)
                };

            default:
                return base;
        }
    }
}

module.exports = GuacamoleServer;
