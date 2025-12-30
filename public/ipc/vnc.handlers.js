// public/ipc/vnc.handlers.js
// Handlers IPC para conexões VNC (TightVNC nativo e noVNC proxy)

const { ipcMain, safeStorage, dialog } = require('electron');
const { exec } = require('child_process');
const path = require('path');

/**
 * Registra handlers IPC para conexões VNC
 * @param {Object} deps - Dependências injetadas
 * @param {Object} deps.vncProxyService - Serviço de proxy VNC
 * @param {Object} deps.sanitizeLog - Função para sanitizar logs
 * @param {boolean} deps.isDev - Se está em modo desenvolvimento
 */
function registerVncHandlers({ vncProxyService, sanitizeLog, isDev }) {

    // ==========================
    // VNC NATIVO (TightVNC)
    // ==========================
    ipcMain.handle('connect-vnc', async (event, connectionInfo) => {
        console.log(`🖥️ Pedido de conexão VNC (TightVNC) recebido:`, sanitizeLog(connectionInfo));

        const vncViewerPath = isDev
            ? path.join(__dirname, '..', 'assets', 'tvnviewer.exe')
            : path.join(process.resourcesPath, 'assets', 'tvnviewer.exe');

        let command = `"${vncViewerPath}" -host=${connectionInfo.ipAddress} -port=${connectionInfo.port}`;

        // Descriptografar senha
        if (connectionInfo.password) {
            try {
                const encryptedBuffer = Buffer.from(connectionInfo.password, 'base64');
                const decryptedPassword = safeStorage.decryptString(encryptedBuffer);
                command += ` -password=${decryptedPassword}`;
                console.log('✅ Senha VNC descriptografada com sucesso');
            } catch (error) {
                console.error('⚠️ Erro ao descriptografar senha VNC:', error.message);
                command += ` -password=${connectionInfo.password}`;
            }
        }

        if (connectionInfo.viewOnly) {
            command += ` -viewonly`;
        }

        command += ` -scale=auto`;

        console.log(`⚡ Executando comando TightVNC (senha omitida para segurança)`);

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Erro ao executar o TightVNC: ${error.message}`);
                dialog.showErrorBox(
                    'Erro de Conexão VNC',
                    `Não foi possível iniciar o cliente TightVNC.\n\nVerifique se o arquivo 'tvnviewer.exe' está no caminho correto e se não está sendo bloqueado.\n\nErro: ${error.message}`
                );
                return;
            }

            if (stderr) {
                console.warn(`Stderr do TightVNC: ${stderr}`);
            }

            console.log('✅ TightVNC iniciado com sucesso.');
        });

        return { success: true, message: 'Comando para iniciar o TightVNC enviado.' };
    });

    // ==========================
    // VNC PROXY (noVNC/VNC Wall)
    // ==========================
    ipcMain.handle('vnc-proxy-start', async (event, serverInfo) => {
        try {
            console.log(`🔌 Solicitando proxy VNC para: ${serverInfo.name}`);
            const port = await vncProxyService.startProxy(serverInfo);

            // Descriptografa a senha para enviar ao noVNC
            let decryptedPassword = null;
            if (serverInfo.password) {
                // Heurística simples: se já vier plain text (do frontend re-enviando), safeStorage falha.
                // Tenta descriptografar, se falhar, assume que é a senha real.
                try {
                    const encryptedBuffer = Buffer.from(serverInfo.password, 'base64');
                    decryptedPassword = safeStorage.decryptString(encryptedBuffer);
                } catch (e) {
                    // console.log('ℹ️ Senha parece já estar descriptografada ou formato inválido, usando original.');
                    decryptedPassword = serverInfo.password;
                }
            }

            return {
                success: true,
                port: port,
                decryptedPassword: decryptedPassword
            };
        } catch (error) {
            console.error('❌ Erro ao iniciar proxy VNC:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('vnc-proxy-stop', async (event, serverId) => {
        try {
            const stopped = await vncProxyService.stopProxy(serverId);
            return { success: stopped };
        } catch (error) {
            console.error('❌ Erro ao parar proxy VNC:', error);
            return { success: false, error: error.message };
        }
    });

    // ==========================
    // VNC SNAPSHOT (Modo economia de memória)
    // ==========================
    ipcMain.handle('vnc-snapshot', async (event, serverInfo) => {
        try {
            console.log(`📸 Capturando snapshot de: ${serverInfo.name}`);
            const result = await vncProxyService.captureSnapshot(serverInfo);
            return {
                success: result !== null,
                data: result,
                serverId: serverInfo.id
            };
        } catch (error) {
            console.error('❌ Erro ao capturar snapshot VNC:', error);
            return { success: false, error: error.message, serverId: serverInfo.id };
        }
    });

    // ==========================
    // VNC CHECK AVAILABILITY (Para reconexão automática)
    // ==========================
    ipcMain.handle('vnc-check-availability', async (event, serverInfo) => {
        try {
            // Usa o captureSnapshot que faz teste TCP rápido (3s timeout)
            const result = await vncProxyService.captureSnapshot(serverInfo, 3000);
            return result !== null && result.connected === true;
        } catch (error) {
            return false;
        }
    });

    console.log('✅ VNC handlers registrados (5 handlers)');
}

module.exports = { registerVncHandlers };
