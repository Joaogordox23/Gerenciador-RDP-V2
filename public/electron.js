// electron.js - VERSÃO INTEGRADA COM SISTEMA DE CONECTIVIDADE
// Baseado no arquivo original, com adições do sistema de conectividade

const { app, BrowserWindow, ipcMain, Notification, Menu, safeStorage, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const Store = require('electron-store');
const url = require('url');
const fs = require('fs');

// ==========================
// IMPORTS DO SISTEMA DE CONECTIVIDADE
// ==========================
const ConnectivityTester = require('./ConnectivityTester');
const net = require('net');
const dns = require('dns').promises;
const os = require('os');

const store = new Store();
let mainWindow;
const isDev = !app.isPackaged;

// ==========================
// INICIALIZAÇÃO DO SISTEMA DE CONECTIVIDADE
// ==========================
const connectivityTester = new ConnectivityTester();
const connectivityMonitors = new Map(); // Armazena intervalos de monitoramento ativo

console.log('🔌 Sistema de conectividade inicializado no Electron');

// ==========================
// FUNÇÃO CREATEWINDOW ORIGINAL
// ==========================
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

    if (isDev) {
        // win.webContents.openDevTools();
    }

    // ==========================
    // MENU ORIGINAL EXPANDIDO
    // ==========================
    const menuTemplate = [
        {
            label: 'Arquivo',
            submenu: [
                {
                    label: 'Importar Configurações...',
                    click: () => {
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
                                        const importedGroups = JSON.parse(data);
                                        if (Array.isArray(importedGroups)) {
                                            store.set('groups', importedGroups);
                                            dialog.showMessageBoxSync({
                                                type: 'info',
                                                title: 'Importação Concluída',
                                                message: 'As configurações foram importadas com sucesso! A aplicação será reiniciada para aplicar as mudanças.'
                                            });
                                            app.relaunch();
                                            app.quit();
                                        } else {
                                            throw new Error('O arquivo não contém um formato de dados válido.');
                                        }
                                    } catch (e) {
                                        dialog.showErrorBox('Erro de Importação', `O arquivo selecionado não é um JSON válido: ${e.message}`);
                                    }
                                });
                            }
                        });
                    },
                },
                {
                    label: 'Exportar Configurações...',
                    click: () => {
                        const groups = store.get('groups');
                        if (!groups || groups.length === 0) {
                            dialog.showMessageBoxSync({ type: 'info', title: 'Exportar', message: 'Não há dados para exportar.' });
                            return;
                        }

                        dialog.showSaveDialog({
                            title: 'Exportar Configurações',
                            buttonLabel: 'Exportar',
                            defaultPath: `backup-conexoes-${new Date().toISOString().split('T')[0]}.json`,
                            filters: [{ name: 'JSON', extensions: ['json'] }]
                        }).then(result => {
                            if (!result.canceled && result.filePath) {
                                const dataToSave = JSON.stringify(groups, null, 2);
                                fs.writeFile(result.filePath, dataToSave, 'utf-8', (err) => {
                                    if (err) {
                                        dialog.showErrorBox('Erro de Exportação', `Não foi possível salvar o arquivo: ${err.message}`);
                                    } else {
                                        dialog.showMessageBoxSync({ type: 'info', title: 'Exportação Concluída', message: 'As configurações foram exportadas com sucesso!' });
                                    }
                                });
                            }
                        });
                    },
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
                    },
                },
                {
                    label: 'Parar Todo Monitoramento',
                    click: () => {
                        connectivityMonitors.forEach((interval) => {
                            clearInterval(interval);
                        });
                        connectivityMonitors.clear();
                        
                        if (mainWindow) {
                            connectivityMonitors.forEach((_, serverKey) => {
                                mainWindow.webContents.send('connectivity-monitoring-change', 'stopped', serverKey);
                            });
                        }
                        
                        dialog.showMessageBoxSync({ 
                            type: 'info', 
                            title: 'Monitoramento Parado', 
                            message: 'Todo o monitoramento de conectividade foi interrompido.' 
                        });
                    },
                },
                { type: 'separator' },
                {
                    label: 'Limpar Dados e Reiniciar',
                    click: () => {
                        ipcMain.emit('clear-data-request');
                    },
                },
                { type: 'separator' },
                { role: 'quit', label: 'Sair' }
            ],
        },
        {
            label: 'Ver',
            submenu: [
                { role: 'reload', label: 'Recarregar' },
                { role: 'forceReload', label: 'Forçar Recarregamento' },
                { role: 'toggleDevTools', label: 'Alternar Ferramentas de Desenvolvedor' },
            ],
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
                            if (group.servers) {
                                allServers.push(...group.servers);
                            }
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
                            message: `Iniciando teste de conectividade para ${allServers.length} servidor(es)...`,
                            buttons: ['OK']
                        });
                        
                        try {
                            await connectivityTester.testMultipleServers(allServers);
                        } catch (error) {
                            console.error('Erro no teste em lote:', error);
                        }
                    },
                },
                {
                    label: 'Estatísticas de Conectividade',
                    click: async () => {
                        const stats = connectivityTester.getCacheStats();
                        stats.activeMonitors = connectivityMonitors.size;
                        
                        dialog.showMessageBoxSync({
                            type: 'info',
                            title: 'Estatísticas de Conectividade',
                            message: `Cache: ${stats.size} resultados\nTestes ativos: ${stats.activeTests}\nMonitoramentos ativos: ${stats.activeMonitors}\nTimeout do cache: ${stats.cacheTimeout}ms`
                        });
                    },
                }
            ],
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

// ==========================
// EVENTOS ELECTRON ORIGINAIS
// ==========================
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// ==========================
// HANDLERS IPC ORIGINAIS
// ==========================
ipcMain.on('clear-data-request', () => {
    store.clear();
    app.relaunch();
    app.quit();
});

ipcMain.handle('get-data', (event, key) => {
    return store.get(key);
});

ipcMain.on('set-data', (event, key, value) => {
    if (key === 'groups') {
        const groupsToStore = JSON.parse(JSON.stringify(value));
        groupsToStore.forEach(group => {
            group.servers.forEach(server => {
                if (server.password && typeof server.password === 'string') {
                    try {
                        const encryptedPassword = safeStorage.encryptString(server.password);
                        server.password = encryptedPassword.toString('base64');
                    } catch (e) {
                        console.error('Falha ao criptografar a senha.', e);
                    }
                }
            });
        });
        store.set(key, groupsToStore);
    } else {
        store.set(key, value);
    }
});

// ==========================
// HANDLER DE CONEXÃO MELHORADO COM TESTE PRÉVIO
// ==========================
ipcMain.on('start-connection', async (event, serverInfo) => {
    const protocol = serverInfo.protocol || 'rdp';
    console.log(`🔗 Pedido de conexão [${protocol.toUpperCase()}] recebido para: ${serverInfo.name}`);

    // NOVO: Teste rápido de conectividade antes de conectar
    try {
        console.log('🧪 Executando teste prévio de conectividade...');
        const quickTest = await connectivityTester.testServerConnectivity(serverInfo);
        
        if (quickTest.status === 'offline') {
            dialog.showErrorBox(
                'Servidor Inacessível', 
                `O servidor ${serverInfo.name} não está acessível no momento.\n\nDetalhes: ${quickTest.message}\n\nVerifique a conectividade antes de tentar conectar.`
            );
            return;
        }
        
        if (quickTest.status === 'partial') {
            const response = dialog.showMessageBoxSync(mainWindow, {
                type: 'warning',
                title: 'Conectividade Limitada',
                message: `Detectada conectividade limitada com ${serverInfo.name}.\n\nDetalhes: ${quickTest.message}\n\nDeseja tentar conectar mesmo assim?`,
                buttons: ['Cancelar', 'Conectar Mesmo Assim'],
                defaultId: 0,
                cancelId: 0
            });
            
            if (response === 0) {
                console.log('🚫 Conexão cancelada pelo usuário devido à conectividade limitada');
                return;
            }
        }
        
        if (quickTest.status === 'online' && quickTest.tests?.tcpLatency?.average) {
            console.log(`✅ Conectividade confirmada. Latência: ${quickTest.tests.tcpLatency.average}ms`);
        }
        
    } catch (error) {
        console.warn('⚠️ Teste prévio de conectividade falhou:', error);
        
        const response = dialog.showMessageBoxSync(mainWindow, {
            type: 'question',
            title: 'Teste de Conectividade Falhou',
            message: `Não foi possível verificar a conectividade com ${serverInfo.name}.\n\nErro: ${error.message}\n\nDeseja tentar conectar mesmo assim?`,
            buttons: ['Cancelar', 'Conectar Mesmo Assim'],
            defaultId: 0,
            cancelId: 0
        });
        
        if (response === 0) {
            console.log('🚫 Conexão cancelada devido à falha no teste prévio');
            return;
        }
    }

    // Notificação de início de conexão
    if (Notification.isSupported()) {
        const notification = new Notification({
            title: 'Gerenciador de Conexões',
            body: `Iniciando conexão ${protocol.toUpperCase()} com o servidor: ${serverInfo.name}`,
        });
        notification.show();
    }

    // Lógica de conexão original baseada no protocolo
    if (protocol === 'ssh') {
        // Validações SSH
        if (!serverInfo.ipAddress || !serverInfo.username) {
            dialog.showErrorBox('Erro de Conexão', 'Endereço de IP e Usuário são obrigatórios para SSH.');
            return;
        }

        const puttyPath = isDev
            ? path.join(__dirname, '..', 'assets', 'putty.exe')
            : path.join(process.resourcesPath, 'assets', 'putty.exe');

        const port = serverInfo.port || '22';
        const sshCommand = `"${puttyPath}" -ssh ${serverInfo.username}@${serverInfo.ipAddress} -P ${port}`;

        let plainTextPassword = '';
        if (serverInfo.password) {
            try {
                const buffer = Buffer.from(serverInfo.password, 'base64');
                plainTextPassword = safeStorage.decryptString(buffer);
            } catch (e) {
                console.warn('Não foi possível descriptografar senha SSH, tratando como texto plano.');
                plainTextPassword = serverInfo.password;
            }
        }

        const finalCommand = plainTextPassword ? `${sshCommand} -pw "${plainTextPassword}"` : sshCommand;
        
        console.log(`🖥️ Executando comando PuTTY SSH`);
        exec(finalCommand, (error) => {
            if (error) {
                console.error(`❌ Erro ao iniciar PuTTY: ${error.message}`);
                dialog.showErrorBox('Erro de Conexão', `PuTTY não encontrado ou falhou ao executar.\n\nVerifique se o putty.exe está na pasta 'assets'.\n\nErro: ${error.message}`);
            }
        });

    } else { // Lógica RDP
        let plainTextPassword = '';
        if (serverInfo.password) {
            try {
                const encryptedBuffer = Buffer.from(serverInfo.password, 'base64');
                plainTextPassword = safeStorage.decryptString(encryptedBuffer);
            } catch (error) {
                console.warn('Não foi possível descriptografar a senha, tratando como texto plano. (Isso é esperado para dados recém-criados).');
                plainTextPassword = serverInfo.password;
            }
        }

        // Conexão RDP sem credenciais
        if (!serverInfo.ipAddress || !serverInfo.username || !plainTextPassword) {
            console.log(`🖥️ Iniciando RDP básico para ${serverInfo.ipAddress}`);
            exec(`mstsc.exe /v:${serverInfo.ipAddress}`);
            return;
        }

        // Conexão RDP com credenciais
        const fullUsername = serverInfo.domain ? `${serverInfo.domain}\\${serverInfo.username}` : serverInfo.username;
        const target = `TERMSRV/${serverInfo.ipAddress}`;
        const addKeyCommand = `cmdkey /generic:${target} /user:${fullUsername} /pass:"${plainTextPassword}"`;
        const rdpCommand = `mstsc.exe /v:${serverInfo.ipAddress}`;
        const deleteKeyCommand = `cmdkey /delete:${target}`;

        console.log(`🔐 Configurando credenciais RDP para ${serverInfo.name}`);

        // 1. Limpa credenciais antigas
        exec(deleteKeyCommand, () => {
            console.log('🧹 Limpeza de credencial antiga concluída.');

            // 2. Adiciona nova credencial
            exec(addKeyCommand, (addError) => {
                if (addError) {
                    console.error(`❌ Erro cmdkey: ${addError.message}`);
                    dialog.showErrorBox('Erro de Credencial', 'Não foi possível salvar a credencial temporária. Verifique se a senha não contém caracteres inválidos.');
                    return;
                }

                console.log('✅ Credencial RDP adicionada com sucesso.');
                if (mainWindow) { 
                    mainWindow.webContents.send('connection-status-update', serverInfo.id, 'active'); 
                }

                // 3. Inicia conexão RDP
                exec(rdpCommand, () => {
                    console.log('🏁 Sessão RDP finalizada.');
                    if (mainWindow) { 
                        mainWindow.webContents.send('connection-status-update', serverInfo.id, 'inactive'); 
                    }

                    // 4. Limpa credenciais após uso
                    exec(deleteKeyCommand, (deleteError) => {
                        if (deleteError) {
                            console.warn('⚠️ Erro ao limpar credencial:', deleteError.message);
                        } else {
                            console.log('🧹 Credencial RDP limpa com sucesso.');
                        }
                    });
                });
            });
        });
    }
});

// ==========================
// NOVOS HANDLERS IPC PARA CONECTIVIDADE
// ==========================

/**
 * Handler para teste de conectividade de servidor único
 */
ipcMain.handle('connectivity-test-server', async (event, serverInfo) => {
    try {
        console.log(`🧪 Teste de conectividade solicitado para: ${serverInfo.name}`);
        
        const result = await connectivityTester.testServerConnectivity(serverInfo);
        
        // Emite evento de atualização para o frontend
        const serverKey = `${serverInfo.ipAddress}:${serverInfo.port || (serverInfo.protocol === 'rdp' ? 3389 : 22)}`;
        if (mainWindow) {
            mainWindow.webContents.send('connectivity-status-update', serverKey, result);
        }
        
        return result;
    } catch (error) {
        console.error('❌ Erro no teste de conectividade:', error);
        return {
            status: 'error',
            error: error.message,
            timestamp: Date.now()
        };
    }
});

/**
 * Handler para teste de múltiplos servidores
 */
ipcMain.handle('connectivity-test-multiple', async (event, servers) => {
    try {
        console.log(`🔄 Teste batch de ${servers.length} servidores solicitado`);
        
        const results = await connectivityTester.testMultipleServers(servers);
        
        // Emite eventos de atualização para cada resultado
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

/**
 * Handler para iniciar monitoramento contínuo
 */
ipcMain.on('connectivity-start-monitoring', (event, serverInfo, interval = 30000) => {
    try {
        const serverKey = `${serverInfo.ipAddress}:${serverInfo.port || (serverInfo.protocol === 'rdp' ? 3389 : 22)}`;
        
        // Para monitoramento existente se houver
        if (connectivityMonitors.has(serverKey)) {
            clearInterval(connectivityMonitors.get(serverKey));
        }
        
        console.log(`🔄 Iniciando monitoramento contínuo para ${serverInfo.name} (${interval}ms)`);
        
        // Primeira execução imediata
        performMonitoringTest(serverInfo, serverKey);
        
        // Configura execução periódica
        const monitorInterval = setInterval(() => {
            performMonitoringTest(serverInfo, serverKey);
        }, interval);
        
        connectivityMonitors.set(serverKey, monitorInterval);
        
        // Notifica frontend
        if (mainWindow) {
            mainWindow.webContents.send('connectivity-monitoring-change', 'started', serverKey, {
                interval,
                serverInfo
            });
        }
        
    } catch (error) {
        console.error('❌ Erro ao iniciar monitoramento:', error);
        if (mainWindow) {
            mainWindow.webContents.send('connectivity-error', serverKey, error.message);
        }
    }
});

/**
 * Handler para parar monitoramento específico
 */
ipcMain.on('connectivity-stop-monitoring', (event, serverKey) => {
    try {
        if (connectivityMonitors.has(serverKey)) {
            clearInterval(connectivityMonitors.get(serverKey));
            connectivityMonitors.delete(serverKey);
            
            console.log(`⏹️ Monitoramento parado para ${serverKey}`);
            
            if (mainWindow) {
                mainWindow.webContents.send('connectivity-monitoring-change', 'stopped', serverKey);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao parar monitoramento:', error);
    }
});

/**
 * Handler para parar todo monitoramento
 */
ipcMain.on('connectivity-stop-all-monitoring', () => {
    try {
        console.log(`⏹️ Parando todos os ${connectivityMonitors.size} monitoramentos ativos`);
        
        connectivityMonitors.forEach((interval, serverKey) => {
            clearInterval(interval);
            if (mainWindow) {
                mainWindow.webContents.send('connectivity-monitoring-change', 'stopped', serverKey);
            }
        });
        
        connectivityMonitors.clear();
    } catch (error) {
        console.error('❌ Erro ao parar todos os monitoramentos:', error);
    }
});

/**
 * Handler para limpar cache
 */
ipcMain.on('connectivity-clear-cache', () => {
    try {
        connectivityTester.clearCache();
        console.log('🧹 Cache de conectividade limpo via IPC');
    } catch (error) {
        console.error('❌ Erro ao limpar cache:', error);
    }
});

/**
 * Handler para obter estatísticas
 */
ipcMain.handle('connectivity-get-stats', () => {
    try {
        const stats = connectivityTester.getCacheStats();
        stats.activeMonitors = connectivityMonitors.size;
        return stats;
    } catch (error) {
        console.error('❌ Erro ao obter estatísticas:', error);
        return {
            size: 0,
            activeTests: 0,
            activeMonitors: 0,
            cacheTimeout: 30000
        };
    }
});

// ==========================
// FUNÇÕES AUXILIARES DE CONECTIVIDADE
// ==========================

/**
 * Executa teste de monitoramento para um servidor
 */
async function performMonitoringTest(serverInfo, serverKey) {
    try {
        if (mainWindow) {
            mainWindow.webContents.send('connectivity-test-start', serverKey, serverInfo);
        }
        
        const result = await connectivityTester.testServerConnectivity(serverInfo);
        
        if (mainWindow) {
            mainWindow.webContents.send('connectivity-test-complete', serverKey, result);
            mainWindow.webContents.send('connectivity-status-update', serverKey, result);
        }
        
    } catch (error) {
        console.error(`❌ Erro no monitoramento de ${serverKey}:`, error);
        
        if (mainWindow) {
            mainWindow.webContents.send('connectivity-error', serverKey, error.message);
        }
    }
}

/**
 * Testa conectividade automaticamente quando servidor é adicionado
 */
function autoTestNewServer(serverInfo) {
    // Dispara teste automático quando servidor é adicionado
    setTimeout(async () => {
        try {
            const result = await connectivityTester.testServerConnectivity(serverInfo);
            const serverKey = `${serverInfo.ipAddress}:${serverInfo.port || (serverInfo.protocol === 'rdp' ? 3389 : 22)}`;
            
            if (mainWindow) {
                mainWindow.webContents.send('connectivity-status-update', serverKey, result);
            }
        } catch (error) {
            console.warn('⚠️ Teste automático de novo servidor falhou:', error);
        }
    }, 1000); // 1 segundo de delay
}

// ==========================
// LIMPEZA DE RECURSOS AO FECHAR
// ==========================
app.on('before-quit', () => {
    console.log('🧹 Limpando recursos de conectividade...');
    
    // Para todos os monitoramentos
    connectivityMonitors.forEach((interval) => {
        clearInterval(interval);
    });
    connectivityMonitors.clear();
    
    // Limpa cache
    connectivityTester.clearCache();
    
    console.log('✅ Recursos de conectividade limpos com sucesso');
});

// ==========================
// LOGS DE INICIALIZAÇÃO
// ==========================
console.log('🚀 Gerenciador de Conexões RDP/SSH iniciado');
console.log(`   📁 Modo: ${isDev ? 'Desenvolvimento' : 'Produção'}`);
console.log(`   🔌 Sistema de conectividade: Ativo`);
console.log(`   📊 Handlers IPC: ${Object.keys(ipcMain.listenerCount).length || 'Registrados'}`);
console.log(`   🎯 Pronto para conexões!`);

// Exporta funções para possível uso em módulos externos
module.exports = {
    connectivityTester,
    autoTestNewServer,
    performMonitoringTest
};