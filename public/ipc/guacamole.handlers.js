// public/ipc/guacamole.handlers.js
// Handlers IPC para conexões via Guacamole (RDP/SSH/VNC no navegador)

const { ipcMain, safeStorage } = require('electron');

/**
 * Registra handlers IPC para Guacamole
 * @param {Object} deps - Dependências injetadas
 * @param {Function} deps.getGuacamoleServer - Função para obter instância do GuacamoleServer
 */
function registerGuacamoleHandlers({ getGuacamoleServer }) {

    // ==========================
    // GERAÇÃO DE TOKEN GUACAMOLE
    // ==========================
    ipcMain.handle('generate-guacamole-token', async (event, connectionInfo) => {
        const guacamoleServer = getGuacamoleServer();

        if (!guacamoleServer) {
            throw new Error('Servidor Guacamole não está rodando');
        }

        try {
            // Descriptografar senha antes de gerar o token
            let decryptedConnectionInfo = { ...connectionInfo };

            if (connectionInfo.password && connectionInfo.password.length > 0) {
                // Verifica se a senha parece estar criptografada (mesmo critério do database.handlers.js)
                const isLikelyEncrypted = connectionInfo.password.length >= 40 &&
                    /^[A-Za-z0-9+/]+=*$/.test(connectionInfo.password);

                if (isLikelyEncrypted) {
                    try {
                        const encryptedBuffer = Buffer.from(connectionInfo.password, 'base64');
                        decryptedConnectionInfo.password = safeStorage.decryptString(encryptedBuffer);
                        console.log('✅ Senha descriptografada para Guacamole');
                    } catch (decryptError) {
                        console.warn('⚠️ Erro ao descriptografar senha:', decryptError.message);
                        // Fallback: usa a senha como está
                    }
                } else {
                    console.log('🔓 Senha em texto plano (não criptografada)');
                    // Mantém a senha como está (texto plano)
                }
            }

            const token = guacamoleServer.generateConnectionToken(decryptedConnectionInfo);
            console.log('🔐 Token Guacamole gerado para:', decryptedConnectionInfo.protocol);
            return token;
        } catch (error) {
            console.error('Erro ao gerar token Guacamole:', error);
            throw error;
        }
    });

    console.log('✅ Guacamole handlers registrados (1 handler)');
}

module.exports = { registerGuacamoleHandlers };
