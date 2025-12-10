// public/ipc/config.handlers.js
// Handlers IPC para configuração do servidor Guacamole

const { ipcMain } = require('electron');

/**
 * Registra handlers IPC para gerenciar configuração do Guacamole
 * @param {Object} deps - Dependências injetadas
 * @param {Object} deps.store - Instância do electron-store
 */
function registerConfigHandlers({ store }) {
    const CONFIG_KEY = 'guacamoleServerConfig';

    // ==========================
    // OBTER CONFIGURAÇÃO
    // ==========================
    ipcMain.handle('get-guacamole-config', async () => {
        try {
            const config = store.get(CONFIG_KEY);

            // Retorna configuração padrão se não existir
            if (!config) {
                return {
                    mode: 'local',
                    host: 'localhost',
                    port: '8080',
                    guacdHost: '127.0.0.1',
                    guacdPort: '4822',
                    secretKey: 'GerenciadorRDPv2SecretKey123456!',
                    wsUrl: 'ws://localhost:8080',
                    isConfigured: false
                };
            }

            return { ...config, isConfigured: true };
        } catch (error) {
            console.error('❌ Erro ao obter configuração Guacamole:', error);
            return null;
        }
    });

    // ==========================
    // SALVAR CONFIGURAÇÃO
    // ==========================
    ipcMain.handle('set-guacamole-config', async (event, config) => {
        try {
            store.set(CONFIG_KEY, config);
            console.log('✅ Configuração Guacamole salva:', {
                mode: config.mode,
                host: config.host,
                port: config.port
            });
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao salvar configuração Guacamole:', error);
            return { success: false, error: error.message };
        }
    });

    // ==========================
    // VERIFICAR SE CONFIGURADO
    // ==========================
    ipcMain.handle('is-guacamole-configured', async () => {
        try {
            const config = store.get(CONFIG_KEY);
            return !!config;
        } catch (error) {
            return false;
        }
    });

    console.log('✅ Config handlers registrados (3 handlers)');
}

module.exports = { registerConfigHandlers };
