// public/ipc/connectivity.handlers.js
// Handlers IPC para testes de conectividade e monitoramento

const { ipcMain, nativeTheme } = require('electron');

/**
 * Registra handlers IPC para conectividade
 * @param {Object} deps - Dependências injetadas
 * @param {Object} deps.connectivityTester - Instância do ConnectivityTester
 * @param {Map} deps.connectivityMonitors - Map de intervalos de monitoramento
 * @param {Function} deps.getMainWindow - Função para obter a janela principal
 */
function registerConnectivityHandlers({ connectivityTester, connectivityMonitors, getMainWindow }) {

    // ==========================
    // TESTES INDIVIDUAIS E BATCH
    // ==========================

    ipcMain.handle('connectivity-test-server', async (event, serverInfo) => {
        try {
            console.log(`🧪 Teste de conectividade solicitado para: ${serverInfo.name}`);
            const result = await connectivityTester.testServerConnectivity(serverInfo);
            const serverKey = `${serverInfo.ipAddress}:${serverInfo.port || (serverInfo.protocol === 'rdp' ? 3389 : 22)}`;

            const mainWindow = getMainWindow();
            if (mainWindow) {
                mainWindow.webContents.send('connectivity-status-update', serverKey, result);
            }
            return result;
        } catch (error) {
            console.error('❌ Erro no teste de conectividade:', error);
            return { status: 'error', error: error.message, timestamp: Date.now() };
        }
    });

    ipcMain.handle('connectivity-test-multiple', async (event, servers) => {
        try {
            console.log(`🔄 Teste batch de ${servers.length} servidores solicitado`);
            const results = await connectivityTester.testMultipleServers(servers);

            const mainWindow = getMainWindow();
            if (mainWindow) {
                results.forEach(({ server, result }) => {
                    const serverKey = `${server.ipAddress}:${server.port || (server.protocol === 'rdp' ? 3389 : 22)}`;
                    mainWindow.webContents.send('connectivity-status-update', serverKey, result);
                });
            }
            return results;
        } catch (error) {
            console.error('❌ Erro no teste batch:', error);
            throw error;
        }
    });

    // ==========================
    // MONITORAMENTO CONTÍNUO
    // ==========================

    ipcMain.on('connectivity-start-monitoring', (event, serverInfo, interval = 30000) => {
        const serverKey = `${serverInfo.ipAddress}:${serverInfo.port || (serverInfo.protocol === 'rdp' ? 3389 : 22)}`;

        // Para monitoramento existente se houver
        if (connectivityMonitors.has(serverKey)) {
            clearInterval(connectivityMonitors.get(serverKey));
        }

        console.log(`📡 Iniciando monitoramento de ${serverInfo.name} (${serverKey}) a cada ${interval}ms`);

        const monitorInterval = setInterval(async () => {
            try {
                const result = await connectivityTester.testServerConnectivity(serverInfo);
                const mainWindow = getMainWindow();
                if (mainWindow) {
                    mainWindow.webContents.send('connectivity-status-update', serverKey, result);
                }
            } catch (error) {
                console.error(`❌ Erro no monitoramento de ${serverKey}:`, error);
                const mainWindow = getMainWindow();
                if (mainWindow) {
                    mainWindow.webContents.send('connectivity-error', serverKey, { message: error.message });
                }
            }
        }, interval);

        connectivityMonitors.set(serverKey, monitorInterval);

        const mainWindow = getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.send('connectivity-monitoring-change', 'started', serverKey, { interval });
        }
    });

    ipcMain.on('connectivity-stop-monitoring', (event, serverKey) => {
        if (connectivityMonitors.has(serverKey)) {
            clearInterval(connectivityMonitors.get(serverKey));
            connectivityMonitors.delete(serverKey);
            console.log(`⏹️ Monitoramento parado para ${serverKey}`);

            const mainWindow = getMainWindow();
            if (mainWindow) {
                mainWindow.webContents.send('connectivity-monitoring-change', 'stopped', serverKey);
            }
        }
    });

    ipcMain.on('connectivity-stop-all-monitoring', () => {
        console.log('⏹️ Parando todo monitoramento de conectividade');
        connectivityMonitors.forEach((interval, serverKey) => {
            clearInterval(interval);
            const mainWindow = getMainWindow();
            if (mainWindow) {
                mainWindow.webContents.send('connectivity-monitoring-change', 'stopped', serverKey);
            }
        });
        connectivityMonitors.clear();
    });

    // ==========================
    // CACHE E ESTATÍSTICAS
    // ==========================

    ipcMain.on('connectivity-clear-cache', () => {
        connectivityTester.clearCache();
        console.log('🧹 Cache de conectividade limpo via IPC');
    });

    ipcMain.handle('connectivity-get-stats', async () => {
        const stats = connectivityTester.getCacheStats();
        stats.activeMonitors = connectivityMonitors.size;
        stats.monitoredServers = Array.from(connectivityMonitors.keys());
        return stats;
    });

    // ==========================
    // TEMA DO SISTEMA
    // ==========================

    ipcMain.handle('theme:get-os-theme', () => {
        return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    });

    console.log('✅ Connectivity handlers registrados (7 handlers)');
}

module.exports = { registerConnectivityHandlers };
