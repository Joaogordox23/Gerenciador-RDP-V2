// public/ipc/ssh.handlers.js
// Handlers IPC para conexões SSH nativas com ssh2

const { ipcMain, safeStorage } = require('electron');
const { Client } = require('ssh2');

// Armazena sessões SSH ativas
const activeSshSessions = new Map();

/**
 * Registra handlers IPC para conexões SSH nativas
 */
function registerSshHandlers() {

    // === INICIAR SESSÃO SSH ===
    ipcMain.handle('ssh-connect', async (event, connectionInfo) => {
        const sessionId = connectionInfo.id || `ssh-${Date.now()}`;

        console.log(`🔌 SSH: Iniciando conexão para ${connectionInfo.name} (${connectionInfo.ipAddress})`);

        // Decripta senha
        let password = '';
        if (connectionInfo.password) {
            try {
                const buffer = Buffer.from(connectionInfo.password, 'base64');
                password = safeStorage.decryptString(buffer);
            } catch (e) {
                console.warn('SSH: Senha não criptografada, usando como texto plano');
                password = connectionInfo.password;
            }
        }

        const config = {
            host: connectionInfo.ipAddress,
            port: parseInt(connectionInfo.port) || 22,
            username: connectionInfo.username || 'root',
            password: password,
            readyTimeout: 10000,
            keepaliveInterval: 10000,
        };

        return new Promise((resolve, reject) => {
            const conn = new Client();

            conn.on('ready', () => {
                console.log(`✅ SSH: Conexão estabelecida com ${connectionInfo.name}`);

                conn.shell({ term: 'xterm-256color' }, (err, stream) => {
                    if (err) {
                        console.error('SSH: Erro ao abrir shell:', err);
                        reject({ success: false, error: err.message });
                        return;
                    }

                    // Armazena sessão
                    activeSshSessions.set(sessionId, { conn, stream, info: connectionInfo });

                    // Configura eventos do stream
                    stream.on('close', () => {
                        console.log(`🔌 SSH: Sessão ${sessionId} encerrada`);
                        activeSshSessions.delete(sessionId);
                        // Notifica frontend
                        event.sender.send('ssh-closed', sessionId);
                    });

                    stream.on('data', (data) => {
                        // Envia dados para o frontend
                        event.sender.send('ssh-data', sessionId, data.toString('utf-8'));
                    });

                    stream.stderr.on('data', (data) => {
                        event.sender.send('ssh-data', sessionId, data.toString('utf-8'));
                    });

                    resolve({ success: true, sessionId });
                });
            });

            conn.on('error', (err) => {
                console.error(`❌ SSH: Erro de conexão:`, err.message);
                reject({ success: false, error: err.message });
            });

            conn.on('close', () => {
                activeSshSessions.delete(sessionId);
            });

            conn.connect(config);
        });
    });

    // === ENVIAR DADOS PARA SSH ===
    ipcMain.on('ssh-write', (event, sessionId, data) => {
        const session = activeSshSessions.get(sessionId);
        if (session && session.stream) {
            session.stream.write(data);
        }
    });

    // === REDIMENSIONAR TERMINAL ===
    ipcMain.on('ssh-resize', (event, sessionId, cols, rows) => {
        const session = activeSshSessions.get(sessionId);
        if (session && session.stream) {
            session.stream.setWindow(rows, cols, 0, 0);
        }
    });

    // === ENCERRAR SESSÃO SSH ===
    ipcMain.on('ssh-disconnect', (event, sessionId) => {
        const session = activeSshSessions.get(sessionId);
        if (session) {
            console.log(`🔌 SSH: Encerrando sessão ${sessionId}`);
            session.stream?.end();
            session.conn?.end();
            activeSshSessions.delete(sessionId);
        }
    });

    // === LISTAR SESSÕES ATIVAS ===
    ipcMain.handle('ssh-list-sessions', () => {
        return Array.from(activeSshSessions.keys());
    });

    console.log('✅ SSH handlers registrados (5 handlers)');
}

module.exports = { registerSshHandlers };
