const WebSocket = require('ws');
const net = require('net');
const http = require('http');
const fs = require('fs');
const path = require('path');

class VncProxyService {
    constructor() {
        this.proxies = new Map(); // serverId -> { server, port }
        this.startPort = 6080;
        this.currentPort = this.startPort;
    }

    async startProxy(serverInfo) {
        // Verifica se já existe proxy para este servidor
        if (this.proxies.has(serverInfo.id)) {
            console.log(`🔄 Proxy já existente para ${serverInfo.name} na porta ${this.proxies.get(serverInfo.id).port}`);
            return this.proxies.get(serverInfo.id).port;
        }

        const port = await this.findAvailablePort();
        const targetHost = serverInfo.ipAddress;
        const targetPort = serverInfo.port || 5900;

        console.log(`🔌 Iniciando proxy VNC: :${port} -> ${targetHost}:${targetPort}`);

        // Cria servidor WebSocket (semelhante ao websockify)
        const server = http.createServer();
        const wss = new WebSocket.Server({ server });

        wss.on('connection', (ws) => {
            console.log(`🔗 Cliente conectado ao proxy :${port}`);

            const target = net.createConnection(targetPort, targetHost, () => {
                console.log(`✅ Conectado ao servidor VNC remoto ${targetHost}:${targetPort}`);
            });

            target.on('data', (data) => {
                try {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(data);
                    }
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

            ws.on('close', () => {
                console.log('🔌 Cliente desconectou');
                target.end();
            });

            target.on('close', () => {
                console.log('🔌 Servidor remoto desconectou');
                ws.close();
            });

            target.on('error', (err) => {
                console.error('❌ Erro na conexão com servidor remoto:', err);
                ws.close();
            });
        });

        return new Promise((resolve, reject) => {
            server.listen(port, () => {
                console.log(`🚀 Proxy VNC ouvindo na porta ${port}`);
                this.proxies.set(serverInfo.id, { server, port });
                resolve(port);
            });

            server.on('error', (err) => {
                reject(err);
            });
        });
    }

    stopProxy(serverId) {
        if (this.proxies.has(serverId)) {
            const { server, port } = this.proxies.get(serverId);
            server.close();
            this.proxies.delete(serverId);
            console.log(`🛑 Proxy na porta ${port} parado.`);
            return true;
        }
        return false;
    }

    stopAll() {
        for (const [id, proxy] of this.proxies) {
            this.stopProxy(id);
        }
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
}

module.exports = new VncProxyService();
