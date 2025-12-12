// electron.js - VERSÃO 5.0 (MODULAR)
// IPC handlers movidos para public/ipc/*.handlers.js

const { app, BrowserWindow, Menu, dialog, Notification, Tray, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');
const url = require('url');
const fs = require('fs');

// Serviços locais
const fileSystemManager = require('./FileSystemManager');
const databaseManager = require('./DatabaseManager');
const vncProxyService = require('../src/main/services/VncProxyService');
const { sanitizeLog } = require('./sanitizeLog');
const GuacamoleServer = require('./GuacamoleServer');
const ConnectivityTester = require('./ConnectivityTester');

// Sistema modular de IPC handlers
const { registerAllHandlers } = require('./ipc');

// ==========================
// VARIÁVEIS GLOBAIS
// ==========================
let store;
let mainWindow;
let guacamoleServer = null;
const isDev = !app.isPackaged;
const connectivityTester = new ConnectivityTester();
const connectivityMonitors = new Map();

// Tray e controle de fechamento
let tray = null;
let isQuitting = false;

// ==========================
// FUNÇÕES GETTER (para módulos IPC)
// ==========================
const getMainWindow = () => mainWindow;
const getGuacamoleServer = () => guacamoleServer;

// ==========================
// INICIALIZAÇÃO DO STORE
// ==========================
async function initializeStore() {
    console.log('📦 Inicializando sistemas de armazenamento...');

    store = new Store();
    console.log('✅ Electron-store inicializado (configurações)');

    try {
        databaseManager.initialize();
        console.log('✅ SQLite inicializado para conexões');
    } catch (error) {
        console.error('❌ Erro ao inicializar SQLite:', error);
    }

    fileSystemManager.ensureDirectories();

    // Migração inicial se necessário (banco vazio)
    if (!databaseManager.isMigrated()) {
        console.log('🔄 Primeira execução com SQLite - iniciando migração...');
        try {
            let existingGroups = store.get('groups') || [];
            let existingVncGroups = store.get('vncGroups') || [];

            if (existingGroups.length === 0 && existingVncGroups.length === 0) {
                console.log('📂 Store vazio, escaneando disco...');
                const diskServers = fileSystemManager.scanServers();

                diskServers.forEach(server => {
                    const isVnc = server.protocol === 'vnc';
                    const targetArray = isVnc ? existingVncGroups : existingGroups;
                    const listKey = isVnc ? 'connections' : 'servers';

                    let group = targetArray.find(g => (g.name || g.groupName) === server.groupName);
                    if (!group) {
                        group = {
                            id: Date.now() + Math.random(),
                            name: server.groupName,
                            groupName: server.groupName,
                            [listKey]: []
                        };
                        targetArray.push(group);
                    }

                    if (!group[listKey]) group[listKey] = [];
                    group[listKey].push(server);
                });
            }

            const totalMigrated = databaseManager.migrateFromStore(existingGroups, existingVncGroups);
            console.log(`✅ Migração concluída: ${totalMigrated} conexões movidas para SQLite`);
        } catch (error) {
            console.error('❌ Erro na migração:', error);
        }
    }

    // ✨ NOVO: Sempre sincronizar arquivos do disco (importa backups copiados)
    try {
        console.log('📂 Sincronizando arquivos do disco com SQLite...');
        const diskServers = fileSystemManager.scanServers();
        if (diskServers.length > 0) {
            const syncResult = databaseManager.syncFromDisk(diskServers);
            if (syncResult.imported > 0) {
                console.log(`✅ Importados ${syncResult.imported} novos arquivos do disco!`);
            }
        }
        // Registrar timestamp da sincronização
        databaseManager.setLastSyncTime();
    } catch (error) {
        console.error('❌ Erro na sincronização do disco:', error);
    }

    const startTime = Date.now();
    const groups = databaseManager.getAllGroups('rdp');
    const vncGroups = databaseManager.getAllGroups('vnc');

    const stats = databaseManager.getStats();
    console.log(`⚡ Dados carregados em ${Date.now() - startTime}ms`);
    console.log(`📊 SQLite: ${stats.totalGroups} grupos, ${stats.totalConnections} conexões`);

    return { groups, vncGroups };
}

// ==========================
// CRIAÇÃO DA JANELA
// ==========================
let initialData = null; // Dados iniciais para enviar ao frontend

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow = win;
    win.maximize();
    win.show();

    const startUrl = isDev
        ? 'http://localhost:3000'
        : url.format({
            pathname: path.join(__dirname, '../build/index.html'),
            protocol: 'file:',
            slashes: true,
        });

    win.loadURL(startUrl);

    // ✅ CORREÇÃO: Envia dados quando a página terminar de carregar completamente
    win.webContents.on('did-finish-load', () => {
        if (initialData) {
            console.log(`📤 [did-finish-load] Enviando dados: ${initialData.groups.length} grupos RDP/SSH, ${initialData.vncGroups.length} grupos VNC`);
            win.webContents.send('initial-data-loaded', initialData);
        }
    });

    // ✅ Minimizar para bandeja ao fechar (não encerra a aplicação)
    win.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            win.hide();
            console.log('🔽 Janela minimizada para bandeja');
        }
    });

    // Menu - DESABILITADO v4.4.1 (barra de menu removida)
    // const menu = Menu.buildFromTemplate(createMenuTemplate());
    // Menu.setApplicationMenu(menu);
    Menu.setApplicationMenu(null);
}

// ==========================
// SYSTEM TRAY (Bandeja do Sistema)
// ==========================
function createTray() {
    // Usa o favicon.ico existente na pasta public
    const iconPath = path.join(__dirname, 'favicon.ico');

    // Cria ícone nativo (suporta Windows, macOS, Linux)
    let trayIcon;
    try {
        trayIcon = nativeImage.createFromPath(iconPath);
        // Redimensiona para tamanho adequado de tray (16x16 ou 32x32)
        trayIcon = trayIcon.resize({ width: 16, height: 16 });
    } catch (err) {
        console.warn('⚠️ Erro ao carregar ícone da bandeja:', err);
        trayIcon = nativeImage.createEmpty();
    }

    tray = new Tray(trayIcon);

    // Menu de contexto (clique direito)
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Mostrar Gerenciador',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Sair',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Gerenciador RDP - Conexões Remotas');
    tray.setContextMenu(contextMenu);

    // Clique simples no ícone restaura a janela
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.focus();
            } else {
                mainWindow.show();
            }
        }
    });

    console.log('✅ Bandeja do sistema criada');
}

// ==========================
// TEMPLATE DO MENU
// ==========================
function createMenuTemplate() {
    return [
        {
            label: 'Arquivo',
            submenu: [
                {
                    label: 'Importar Configurações...',
                    click: handleImportConfig
                },
                {
                    label: 'Exportar Configurações...',
                    click: handleExportConfig
                },
                { type: 'separator' },
                {
                    label: 'Limpar Cache de Conectividade',
                    click: () => {
                        connectivityTester.clearCache();
                        dialog.showMessageBoxSync({
                            type: 'info',
                            title: 'Cache Limpo',
                            message: 'Cache de conectividade foi limpo com sucesso!'
                        });
                    }
                },
                {
                    label: 'Parar Todo Monitoramento',
                    click: () => {
                        connectivityMonitors.forEach((interval) => clearInterval(interval));
                        connectivityMonitors.clear();
                        dialog.showMessageBoxSync({
                            type: 'info',
                            title: 'Monitoramento Parado',
                            message: 'Todo o monitoramento de conectividade foi interrompido.'
                        });
                    }
                },
                { type: 'separator' },
                {
                    label: 'Limpar Dados e Reiniciar',
                    click: () => {
                        store.clear();
                        app.relaunch();
                        app.quit();
                    }
                },
                { type: 'separator' },
                { role: 'quit', label: 'Sair' }
            ]
        },
        {
            label: 'Ver',
            submenu: [
                { role: 'reload', label: 'Recarregar' },
                { role: 'forceReload', label: 'Forçar Recarregamento' },
                { role: 'toggleDevTools', label: 'Alternar Ferramentas de Desenvolvedor' }
            ]
        },
        {
            label: 'Conectividade',
            submenu: [
                {
                    label: 'Testar Todos os Servidores',
                    click: async () => {
                        const groups = store.get('groups') || [];
                        const allServers = [];
                        groups.forEach(group => {
                            if (group.servers) allServers.push(...group.servers);
                        });

                        if (allServers.length === 0) {
                            dialog.showMessageBoxSync({
                                type: 'info',
                                title: 'Nenhum Servidor',
                                message: 'Não há servidores cadastrados para testar.'
                            });
                            return;
                        }

                        dialog.showMessageBox({
                            type: 'info',
                            title: 'Teste Iniciado',
                            message: `Iniciando teste de conectividade para ${allServers.length} servidor(es)...`
                        });

                        try {
                            await connectivityTester.testMultipleServers(allServers);
                        } catch (error) {
                            console.error('Erro no teste em lote:', error);
                        }
                    }
                },
                {
                    label: 'Estatísticas de Conectividade',
                    click: async () => {
                        const stats = connectivityTester.getCacheStats();
                        stats.activeMonitors = connectivityMonitors.size;
                        dialog.showMessageBoxSync({
                            type: 'info',
                            title: 'Estatísticas de Conectividade',
                            message: `Cache: ${stats.size} resultados\nTestes ativos: ${stats.activeTests}\nMonitoramentos ativos: ${stats.activeMonitors}`
                        });
                    }
                }
            ]
        }
    ];
}

// ==========================
// HANDLERS DE MENU
// ==========================
function handleImportConfig() {
    dialog.showOpenDialog({
        title: 'Importar Configurações',
        buttonLabel: 'Importar',
        filters: [{ name: 'JSON', extensions: ['json'] }]
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            fs.readFile(filePath, 'utf-8', (err, data) => {
                if (err) {
                    dialog.showErrorBox('Erro de Importação', `Não foi possível ler o arquivo: ${err.message}`);
                    return;
                }

                try {
                    const importedData = JSON.parse(data);
                    if (importedData && Array.isArray(importedData.groups) && Array.isArray(importedData.vncGroups)) {
                        store.set('groups', importedData.groups);
                        store.set('vncGroups', importedData.vncGroups);
                        dialog.showMessageBoxSync({
                            type: 'info',
                            title: 'Importação Concluída',
                            message: 'As configurações foram importadas com sucesso! A aplicação será reiniciada.'
                        });
                        app.relaunch();
                        app.quit();
                    } else {
                        throw new Error('Formato inválido');
                    }
                } catch (e) {
                    dialog.showErrorBox('Erro de Importação', `Arquivo inválido: ${e.message}`);
                }
            });
        }
    });
}

function handleExportConfig() {
    const groups = store.get('groups', []);
    const vncGroups = store.get('vncGroups', []);

    if (groups.length === 0 && vncGroups.length === 0) {
        dialog.showMessageBoxSync({ type: 'info', title: 'Exportar', message: 'Não há dados para exportar.' });
        return;
    }

    const dataToSave = {
        groups,
        vncGroups,
        exportDate: new Date().toISOString()
    };

    dialog.showSaveDialog({
        title: 'Exportar Configurações',
        buttonLabel: 'Exportar',
        defaultPath: `backup-conexoes-${new Date().toISOString().split('T')[0]}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }]
    }).then(result => {
        if (!result.canceled && result.filePath) {
            fs.writeFile(result.filePath, JSON.stringify(dataToSave, null, 2), 'utf-8', (err) => {
                if (err) {
                    dialog.showErrorBox('Erro de Exportação', `Não foi possível salvar: ${err.message}`);
                } else {
                    dialog.showMessageBoxSync({ type: 'info', title: 'Exportação Concluída', message: 'Exportação realizada com sucesso!' });
                }
            });
        }
    });
}

// ==========================
// SINGLE INSTANCE LOCK
// ==========================
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    // Segunda instância: fecha imediatamente
    console.log('❌ Aplicação já está em execução. Focando janela existente...');
    app.quit();
} else {
    // Primeira instância: configura listener para segunda instância
    app.on('second-instance', () => {
        console.log('📢 Segunda instância detectada. Focando janela existente...');
        try {
            // Verifica se mainWindow existe e não foi destruída
            if (mainWindow && !mainWindow.isDestroyed()) {
                // Se está escondida (na tray), mostra primeiro
                if (!mainWindow.isVisible()) {
                    mainWindow.show();
                }
                // Se está minimizada, restaura
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                // Foca a janela
                mainWindow.focus();
                console.log('✅ Janela restaurada e focada');
            } else {
                // Não criamos nova janela aqui porque causaria conflito com GuacamoleServer
                console.warn('⚠️ mainWindow não disponível - app pode estar em estado inconsistente');
            }
        } catch (error) {
            console.error('❌ Erro ao restaurar janela:', error);
        }
    });
}

// ==========================
// EVENTOS DO APP
// ==========================
app.whenReady().then(async () => {
    console.log('🚀 Electron App v5.1 (Single Instance + Tray) iniciando...');

    // ⚠️ GuacamoleServer DESABILITADO - não está sendo usado
    // Se precisar reativar, descomente o bloco abaixo:
    /*
    try {
        guacamoleServer = new GuacamoleServer(8080);
        await guacamoleServer.start();
        console.log('✅ GuacamoleServer pronto');
    } catch (error) {
        console.error('❌ Falha ao iniciar GuacamoleServer:', error);
    }
    */

    // Inicializar store
    const syncedData = await initializeStore();

    // Registrar todos os IPC handlers (MODULAR!)
    registerAllHandlers({
        store,
        databaseManager,
        fileSystemManager,
        connectivityTester,
        connectivityMonitors,
        vncProxyService,
        sanitizeLog,
        isDev,
        getMainWindow,
        getGuacamoleServer
    });

    // Criar janela
    createWindow();

    // ✅ Criar ícone na bandeja do sistema
    createTray();

    // ✅ CORREÇÃO: Armazenar dados para envio via did-finish-load
    // O evento did-finish-load no createWindow() enviará os dados quando o React estiver pronto
    if (syncedData) {
        initialData = syncedData;
        console.log(`📦 Dados preparados para envio: ${syncedData.groups.length} grupos RDP/SSH, ${syncedData.vncGroups.length} grupos VNC`);
    }
});

app.on('window-all-closed', () => {
    // Não fechar quando todas as janelas são fechadas (tray mode)
    // O app só fecha via menu da bandeja ou isQuitting = true
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('before-quit', () => {
    isQuitting = true; // Permite fechar a janela de verdade
    console.log('🧹 Limpando recursos...');
    if (tray) {
        tray.destroy();
        tray = null;
    }
    if (guacamoleServer) guacamoleServer.stop();
    connectivityMonitors.forEach((interval) => clearInterval(interval));
    connectivityMonitors.clear();
    console.log('✅ Cleanup concluído');
});

console.log('📡 Electron v5.1 (Single Instance + Tray) carregado');
