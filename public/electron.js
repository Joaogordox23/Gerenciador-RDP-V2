// electron.js - VERSÃO 3.1 com RealVNC externo

const { app, BrowserWindow, ipcMain, Notification, Menu, safeStorage, dialog, nativeTheme } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { execFile } = require('child_process');
const Store = require('electron-store');
const url = require('url');
const fs = require('fs');
const ActiveDirectory = require('activedirectory2');
const fileSystemManager = require('./FileSystemManager');
const vncProxyService = require('../src/main/services/VncProxyService');

// ==========================
// IMPORTS DO SISTEMA DE CONECTIVIDADE (MANTIDOS)
// ==========================
const ConnectivityTester = require('./ConnectivityTester');
const net = require('net');
const dns = require('dns').promises;
const os = require('os');

let store; // Será inicializado em initializeStore()
let mainWindow;
const isDev = !app.isPackaged;

// ==========================
// INICIALIZAÇÃO DO SISTEMA DE CONECTIVIDADE
// ==========================
const connectivityTester = new ConnectivityTester();
const connectivityMonitors = new Map(); // Armazena intervalos de monitoramento ativo

// FUNÇÃO DE INICIALIZAÇÃO DO STORE E SINCRONIZAÇÃO
// ==========================
async function initializeStore() {
    console.log('📦 Inicializando electron-store...');
    store = new Store();
    console.log('✅ Electron-store inicializado');

    // Sincronização Bidirecional: O Disco é a Fonte da Verdade
    try {
        // 1. Garante que diretórios existam (mas não recria arquivos ainda)
        fileSystemManager.ensureDirectories();

        // 0. IMPORTAÇÃO MANUAL VIA JSON (PRIORIDADE MÁXIMA)
        // Verifica se existe arquivo vnc_import.json na raiz do projeto
        const jsonImportPath = path.join(__dirname, '..', 'vnc_import.json');
        if (fs.existsSync(jsonImportPath)) {
            try {
                console.log('📂 Encontrado arquivo de importação manual vnc_import.json');
                fileSystemManager.logToFile('📂 Encontrado arquivo de importação manual vnc_import.json');

                const importContent = fs.readFileSync(jsonImportPath, 'utf8');
                const importData = JSON.parse(importContent);

                if (importData.vncGroups && Array.isArray(importData.vncGroups)) {
                    console.log(`📥 Importando ${importData.vncGroups.length} grupos VNC do JSON...`);
                    fileSystemManager.logToFile(`📥 Importando ${importData.vncGroups.length} grupos VNC do JSON...`);

                    store.set('vncGroups', importData.vncGroups);

                    console.log('✅ Importação via JSON concluída com sucesso!');
                    fileSystemManager.logToFile('✅ Importação via JSON concluída com sucesso!');

                    // Renomeia para não importar novamente
                    fs.renameSync(jsonImportPath, jsonImportPath + '.imported');
                    console.log('📝 Arquivo renomeado para vnc_import.json.imported');
                }
            } catch (err) {
                console.error('❌ Erro ao importar JSON manual:', err);
                fileSystemManager.logToFile(`❌ Erro ao importar JSON manual: ${err.message}`);
            }
        }

        const diskServers = fileSystemManager.scanServers();
        let currentGroups = store.get('groups') || [];
        let currentVncGroups = store.get('vncGroups') || [];
        let dataChanged = false;

        // A. IMPORTAÇÃO: Adiciona ao store o que está no disco e não no store
        diskServers.forEach(server => {
            const isVnc = server.protocol === 'vnc';

            // Seleciona o array correto (VNC ou RDP/SSH)
            const targetArray = isVnc ? currentVncGroups : currentGroups;
            const listKey = isVnc ? 'connections' : 'servers';

            // Busca ou cria o grupo
            let group = targetArray.find(g => (g.name || g.groupName) === server.groupName);
            if (!group) {
                group = {
                    id: Date.now() + Math.random(),
                    name: server.groupName,
                    groupName: server.groupName,
                    [listKey]: []
                };
                targetArray.push(group);
                dataChanged = true;
                console.log(`📂 Criando grupo: ${server.groupName} (VNC: ${isVnc})`);
            }

            // Adiciona o servidor ao grupo se não existir
            const existingServer = group[listKey].find(s =>
                s.name.toLowerCase() === server.name.toLowerCase()
            );

            if (!existingServer) {
                console.log(`📥 Importando novo servidor do disco: ${server.name} (Protocolo: ${server.protocol})`);
                group[listKey].push(server);
                dataChanged = true;
            }
        });

        // B. LIMPEZA: Remove do store o que NÃO está no disco
        // Função auxiliar para limpar listas
        const cleanList = (groupsList, isVnc) => {
            const listKey = isVnc ? 'connections' : 'servers';
            return groupsList.map(group => {
                if (!group[listKey]) return group;

                const originalLength = group[listKey].length;
                group[listKey] = group[listKey].filter(server => {
                    // Verifica se o arquivo existe no disco
                    const filePath = fileSystemManager.getFilePath(server);
                    const exists = require('fs').existsSync(filePath);

                    // Log detalhado para debug
                    const logMsg = `   Verificando ${isVnc ? 'VNC' : 'RDP/SSH'} "${server.name}" (grupo: ${server.groupName}): ${filePath} -> ${exists ? 'EXISTE' : 'NÃO EXISTE'}`;
                    console.log(logMsg);
                    fileSystemManager.logToFile(logMsg);

                    if (!exists) {
                        console.log(`🗑️ Removendo servidor órfão do store (arquivo não encontrado): ${server.name}`);
                        dataChanged = true;
                    }
                    return exists;
                });

                return group;
            }).filter(group => group[listKey] && group[listKey].length > 0); // Remove grupos vazios
        };

        console.log(`🔍 ANTES da limpeza - VNC: ${currentVncGroups.length} grupos`);
        currentVncGroups.forEach(g => console.log(`   - Grupo "${g.name}": ${g.connections?.length || 0} conexões`));

        currentGroups = cleanList(currentGroups, false);
        currentVncGroups = cleanList(currentVncGroups, true);

        console.log(`🔍 DEPOIS da limpeza - VNC: ${currentVncGroups.length} grupos`);
        currentVncGroups.forEach(g => console.log(`   - Grupo "${g.name}": ${g.connections?.length || 0} conexões`));

        // SEMPRE salva no store após sincronização, mesmo que não tenha mudado
        // Isso garante que os dados estejam sempre sincronizados
        console.log(`💾 Salvando no store: ${currentGroups.length} grupos RDP/SSH, ${currentVncGroups.length} grupos VNC`);
        fileSystemManager.logToFile(`💾 Salvando no store: ${currentGroups.length} grupos RDP/SSH, ${currentVncGroups.length} grupos VNC`);

        store.set('groups', currentGroups);
        store.set('vncGroups', currentVncGroups);

        console.log('✅ Store sincronizado com o disco.');
        fileSystemManager.logToFile('✅ Store sincronizado com o disco.');

        // Log resumo da importação VNC
        const totalVncServers = currentVncGroups.reduce((sum, g) => sum + (g.connections?.length || 0), 0);
        console.log(`📊 Importação VNC: ${currentVncGroups.length} grupo(s), ${totalVncServers} servidor(es)`);
        fileSystemManager.logToFile(`📊 Importação VNC: ${currentVncGroups.length} grupo(s), ${totalVncServers} servidor(es)`);

        const totalRdpSshServers = currentGroups.reduce((sum, g) => sum + (g.servers?.length || 0), 0);
        console.log(`📊 Importação RDP/SSH: ${currentGroups.length} grupo(s), ${totalRdpSshServers} servidor(es)`);
        fileSystemManager.logToFile(`📊 Importação RDP/SSH: ${currentGroups.length} grupo(s), ${totalRdpSshServers} servidor(es)`);

    } catch (error) {
        console.error('Erro na sincronização com disco:', error);
    }

    console.log('🔄 Sincronização de arquivos de conexão concluída.');

    // 🎯 SOLUÇÃO DEFINITIVA: Retorna os dados para serem enviados ao frontend
    return {
        groups: store.get('groups') || [],
        vncGroups: store.get('vncGroups') || []
    };
}

console.log('🔌 Sistema de conectividade inicializado no Electron v3.1');
console.log('📂 Sistema de arquivos local inicializado');
console.log('🎯 VNC agora usa RealVNC externo');

// ==========================
// FUNÇÃO CREATEWINDOW (MANTIDA)
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
    // MENU ATUALIZADO
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
                                        const importedData = JSON.parse(data);
                                        // VERIFICAÇÃO ROBUSTA: Checa se o objeto e as chaves existem
                                        if (importedData && Array.isArray(importedData.groups) && Array.isArray(importedData.vncGroups)) {
                                            // SALVA AMBAS AS CHAVES
                                            store.set('groups', importedData.groups);
                                            store.set('vncGroups', importedData.vncGroups);

                                            dialog.showMessageBoxSync({
                                                type: 'info',
                                                title: 'Importação Concluída',
                                                message: 'As configurações foram importadas com sucesso! A aplicação será reiniciada para aplicar as mudanças.'
                                            });
                                            app.relaunch();
                                            app.quit();
                                        } else {
                                            throw new Error('O arquivo não contém o formato de dados esperado (groups e vncGroups).');
                                        }
                                    } catch (e) {
                                        dialog.showErrorBox('Erro de Importação', `O arquivo selecionado não é um JSON válido ou está mal formatado: ${e.message}`);
                                    }
                                });
                            }
                        });
                    }
                },
                {
                    label: 'Exportar Configurações...',
                    click: () => {
                        // PEGA AMBOS OS TIPOS DE GRUPO
                        const groups = store.get('groups', []);
                        const vncGroups = store.get('vncGroups', []);

                        if (groups.length === 0 && vncGroups.length === 0) {
                            dialog.showMessageBoxSync({ type: 'info', title: 'Exportar', message: 'Não há dados para exportar.' });
                            return;
                        }

                        // CRIA UM OBJETO UNIFICADO PARA SALVAR
                        const dataToSave = {
                            groups: groups,
                            vncGroups: vncGroups,
                            exportDate: new Date().toISOString()
                        };

                        dialog.showSaveDialog({
                            title: 'Exportar Configurações',
                            buttonLabel: 'Exportar',
                            defaultPath: `backup-conexoes-${new Date().toISOString().split('T')[0]}.json`,
                            filters: [{ name: 'JSON', extensions: ['json'] }]
                        }).then(result => {
                            if (!result.canceled && result.filePath) {
                                const jsonContent = JSON.stringify(dataToSave, null, 2); // Formata o JSON para ser legível
                                fs.writeFile(result.filePath, jsonContent, 'utf-8', (err) => {
                                    if (err) {
                                        dialog.showErrorBox('Erro de Exportação', `Não foi possível salvar o arquivo: ${err.message}`);
                                    } else {
                                        dialog.showMessageBoxSync({ type: 'info', title: 'Exportação Concluída', message: 'As configurações foram exportadas com sucesso!' });
                                    }
                                });
                            }
                        });
                    }
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
                    }
                },
                { type: 'separator' },
                {
                    label: 'Limpar Dados e Reiniciar',
                    click: () => {
                        ipcMain.emit('clear-data-request');
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
                            message: `Cache: ${stats.size} resultados\nTestes ativos: ${stats.activeTests}\nMonitoramentos ativos: ${stats.activeMonitors}\nTimeout do cache: ${stats.cacheTimeout}ms`
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

// ==========================
// EVENTOS ELECTRON (MANTIDOS)
// ==========================
app.whenReady().then(async () => {
    console.log('🚀 Electron App pronto, iniciando sincronização...');
    const syncedData = await initializeStore(); // Aguarda sincronização completar e recebe dados
    console.log('🪟 Criando janela principal...');
    createWindow();

    // 🎯 SOLUÇÃO DEFINITIVA: Envia dados diretamente ao frontend após janela estar pronta
    if (mainWindow && syncedData) {
        console.log(`📤 Enviando dados sincronizados ao frontend: ${syncedData.groups.length} grupos RDP/SSH, ${syncedData.vncGroups.length} grupos VNC`);

        // Aguarda um pouco para garantir que o renderer está pronto
        setTimeout(() => {
            mainWindow.webContents.send('initial-data-loaded', syncedData);
        }, 1000);
    }
});

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
// HANDLERS IPC BÁSICOS (MANTIDOS)
// ==========================
ipcMain.on('clear-data-request', () => {
    store.clear();
    app.relaunch();
    app.quit();
});

ipcMain.handle('get-data', (event, key) => {
    return store.get(key);
});

// Tratamento especial para criptografia de senhas e persistência de arquivos
ipcMain.on('set-data', (event, key, value) => {
    if (key === 'groups' || key === 'vncGroups') {
        const oldGroups = store.get(key) || [];
        const newGroups = JSON.parse(JSON.stringify(value));
        const isVnc = key === 'vncGroups';
        const serversKey = isVnc ? 'connections' : 'servers';

        // 1. Detectar Grupos Excluídos (DESATIVADO TEMPORARIAMENTE PARA EVITAR PERDA DE DADOS)
        /* 
        oldGroups.forEach(oldGroup => {
            const groupStillExists = newGroups.find(ng => (ng.id && ng.id === oldGroup.id) || (ng.name === oldGroup.name));
            
            if (!groupStillExists) {
                const groupName = oldGroup.name || oldGroup.groupName;
                if (isVnc) {
                     fileSystemManager.deleteGroup(groupName, 'vnc');
                } else {
                     // Para RDP/SSH, removemos de ambos pois o grupo na UI é unificado
                     fileSystemManager.deleteGroup(groupName, 'rdp');
                     fileSystemManager.deleteGroup(groupName, 'ssh');
                }
            } else {
                // 2. Detectar Servidores Excluídos dentro de grupos mantidos
                if (oldGroup[serversKey]) {
                    oldGroup[serversKey].forEach(oldServer => {
                        const newGroup = newGroups.find(ng => (ng.id && ng.id === oldGroup.id) || (ng.name === oldGroup.name));
                        if (newGroup && newGroup[serversKey]) {
                             const serverStillExists = newGroup[serversKey].find(ns => ns.id === oldServer.id || ns.name === oldServer.name);
                             if (!serverStillExists) {
                                 // Garante que tem groupName e protocol
                                 if (!oldServer.groupName) oldServer.groupName = oldGroup.name || oldGroup.groupName;
                                 if (!oldServer.protocol) oldServer.protocol = isVnc ? 'vnc' : 'rdp'; 
                                 
                                 fileSystemManager.deleteConnectionFile(oldServer);
                             }
                        }
                    });
                }
            }
        });
        */

        newGroups.forEach(group => {
            const groupName = group.name || group.groupName;

            if (group[serversKey]) {
                group[serversKey].forEach(server => {
                    // Injeta o nome do grupo no servidor se não existir, para o FileSystemManager usar
                    if (!server.groupName) server.groupName = groupName;

                    // Garante protocolo VNC se for vncGroups
                    if (isVnc && !server.protocol) server.protocol = 'vnc';

                    // Salva o arquivo físico (.rdp, .bat, .vnc)
                    fileSystemManager.saveConnectionFile(server);

                    if (server.password && typeof server.password === 'string') {
                        try {
                            const encryptedPassword = safeStorage.encryptString(server.password);
                            server.password = encryptedPassword.toString('base64');
                        } catch (e) {
                            console.error('Falha ao criptografar a senha.', e);
                        }
                    }
                });
            }
        });

        store.set(key, newGroups);
    } else {
        store.set(key, value);
    }
});

// ==========================
// HANDLER DE CONEXÃO VNC com RealVNC
// ==========================
ipcMain.handle('connect-vnc', async (event, connectionInfo) => {
    console.log(`🖥️ Pedido de conexão VNC (TightVNC) recebido para: ${connectionInfo.name}`);

    // O caminho deve apontar para o tvnviewer.exe na sua pasta assets
    const vncViewerPath = isDev
        ? path.join(__dirname, '..', 'assets', 'tvnviewer.exe')
        : path.join(process.resourcesPath, 'assets', 'tvnviewer.exe');

    // Construindo o comando com a sintaxe correta para o TightVNC (-param=valor)
    let command = `"${vncViewerPath}" -host=${connectionInfo.ipAddress} -port=${connectionInfo.port}`;

    //🔧 CORREÇÃO BUG #5: Descriptografar senha antes de passar para TightVNC
    if (connectionInfo.password) {
        try {
            // A senha vem criptografada do store, precisa descriptografar
            const encryptedBuffer = Buffer.from(connectionInfo.password, 'base64');
            const decryptedPassword = safeStorage.decryptString(encryptedBuffer);
            command += ` -password=${decryptedPassword}`;
            console.log('✅ Senha VNC descriptografada com sucesso');
        } catch (error) {
            console.error('⚠️ Erro ao descriptografar senha VNC:', error.message);
            // Fallback: tenta usar a senha como está (pode ser texto plano em casos antigos)
            command += ` -password=${connectionInfo.password}`;
        }
    }

    if (connectionInfo.viewOnly) {
        command += ` -viewonly`;
    }

    console.log(`⚡ Executando comando TightVNC (senha omitida para segurança)`);

    // Usando exec, que é ideal para strings de comando completas
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Erro ao executar o TightVNC: ${error.message}`);
            dialog.showErrorBox(
                'Erro de Conexão VNC',
                `Não foi possível iniciar o cliente TightVNC.\n\nVerifique se o arquivo 'tvnviewer.exe' está no caminho correto e se não está sendo bloqueado.\n\nErro: ${error.message}`
            );
            return; // Retorna aqui para evitar log de sucesso
        }

        if (stderr) {
            // stderr pode conter avisos, então apenas registramos
            console.warn(`Stderr do TightVNC: ${stderr}`);
        }

        console.log('✅ TightVNC iniciado com sucesso.');
    });

    return { success: true, message: 'Comando para iniciar o TightVNC enviado.' };
});

// ==========================
// HANDLER DE ALTERAÇÃO DE SENHA EM MASSA
// ==========================
ipcMain.handle('bulk-update-password', async (event, { type, servers, credentials }) => {
    console.log(`🔑 Pedido de alteração de senha em massa: ${servers.length} servidor(es) ${type}`);

    const results = [];
    const storeKey = type === 'vnc' ? 'vncGroups' : 'groups';
    const itemsKey = type === 'vnc' ? 'connections' : 'servers';

    try {
        const allGroups = store.get(storeKey) || [];
        let totalUpdated = 0;

        // Atualiza cada servidor selecionado
        const updatedGroups = allGroups.map(group => {
            const items = group[itemsKey] || [];

            const updatedItems = items.map(item => {
                if (servers.includes(item.id)) {
                    totalUpdated++;

                    if (type === 'vnc') {
                        // VNC: apenas senha
                        return { ...item, password: credentials.password };
                    } else {
                        // RDP/SSH: usuário, senha e domínio
                        return {
                            ...item,
                            username: credentials.username || item.username,
                            password: credentials.password,
                            domain: credentials.domain !== undefined ? credentials.domain : item.domain
                        };
                    }
                }
                return item;
            });

            return { ...group, [itemsKey]: updatedItems };
        });

        // Salva no store (criptografia automática via set-data)
        store.set(storeKey, updatedGroups);

        // Atualiza arquivos físicos também
        updatedGroups.forEach(group => {
            const groupName = group.name || group.groupName;

            if (group[itemsKey]) {
                group[itemsKey].forEach(item => {
                    if (servers.includes(item.id)) {
                        // Injeta nome do grupo se necessário
                        if (!item.groupName) item.groupName = groupName;

                        // Garante protocolo VNC
                        if (type === 'vnc' && !item.protocol) item.protocol = 'vnc';

                        // Criptografa senha antes de salvar arquivo
                        const itemToSave = { ...item };
                        if (itemToSave.password && typeof itemToSave.password === 'string') {
                            try {
                                const encryptedPassword = safeStorage.encryptString(itemToSave.password);
                                itemToSave.password = encryptedPassword.toString('base64');
                            } catch (e) {
                                console.error('Falha ao criptografar senha ao salvar arquivo:', e);
                            }
                        }

                        // Salva arquivo físico (.rdp, .bat, .vnc)
                        fileSystemManager.saveConnectionFile(itemToSave);

                        results.push({ id: item.id, success: true });
                    }
                });
            }
        });

        console.log(`✅ ${totalUpdated} servidor(es) atualizado(s) com sucesso`);

        return {
            success: true,
            updated: totalUpdated,
            failed: 0,
            details: results
        };

    } catch (error) {
        console.error('❌ Erro ao atualizar senhas em massa:', error);
        return {
            success: false,
            updated: 0,
            failed: servers.length,
            error: error.message
        };
    }
});

// ==========================
// HANDLER DE CONEXÃO RDP/SSH (MANTIDO COM TESTE PRÉVIO)
// ==========================
ipcMain.on('start-connection', async (event, serverInfo) => {
    const protocol = serverInfo.protocol || 'rdp';
    console.log(`🔗 Pedido de conexão [${protocol.toUpperCase()}] recebido para: ${serverInfo.name}`);

    // Teste prévio de conectividade (mantido)
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

    // Lógica de conexão baseada no protocolo
    if (protocol === 'ssh') {
        // ===== SSH CONNECTION =====
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
                dialog.showErrorBox('Erro de Conexão',
                    `PuTTY não encontrado ou falhou ao executar.\n\nVerifique se o putty.exe está na pasta 'assets'.\n\nErro: ${error.message}`);
            }
        });

    } else if (protocol === 'rdp') {
        // ===== RDP CONNECTION =====
        let plainTextPassword = '';
        if (serverInfo.password) {
            try {
                const encryptedBuffer = Buffer.from(serverInfo.password, 'base64');
                plainTextPassword = safeStorage.decryptString(encryptedBuffer);
                console.log('🔓 Senha RDP descriptografada com sucesso.');
            } catch (error) {
                console.warn('⚠️ Falha ao descriptografar senha RDP (pode ser texto plano legado ou erro de chave):', error.message);
                plainTextPassword = serverInfo.password;
            }
        } else {
            console.log('ℹ️ Nenhuma senha fornecida para conexão RDP.');
        }

        // Conexão RDP sem credenciais
        if (!serverInfo.ipAddress || !serverInfo.username || !plainTextPassword) {
            console.log(`🖥️ Iniciando RDP básico para ${serverInfo.ipAddress}`);
            exec(`mstsc.exe /v:${serverInfo.ipAddress}`);
            return;
        }

        // Conexão RDP com credenciais
        // Conexão RDP com credenciais
        const fullUsername = serverInfo.domain ? `${serverInfo.domain}\\${serverInfo.username}` : serverInfo.username;
        const target = `TERMSRV/${serverInfo.ipAddress}`;

        console.log(`🔐 Preparando conexão RDP:`);
        console.log(`   - Target: ${target}`);
        console.log(`   - Usuário: ${fullUsername}`);
        console.log(`   - IP: ${serverInfo.ipAddress}`);

        if (!fullUsername) {
            console.warn('⚠️ Usuário não fornecido. O MSTSC provavelmente solicitará credenciais.');
        }

        // Usando spawn para cmdkey para evitar problemas com caracteres especiais na senha
        const { spawn } = require('child_process');

        // CORREÇÃO: Usar /add para Domain credentials (quando há domínio) e /generic para Legacy (sem domínio)
        // Isso garante que o Windows armazene como "Senha do domínio" ao invés de "Genérico"
        const cmdkeyArgs = serverInfo.domain
            ? ['/add:' + target, '/user:' + fullUsername, '/pass:' + plainTextPassword]
            : ['/generic:' + target, '/user:' + fullUsername, '/pass:' + plainTextPassword];

        console.log(`🔧 Tipo de cmdkey: ${serverInfo.domain ? 'Domain (/add)' : 'Generic (/generic)'}`);

        const addKey = spawn('cmdkey', cmdkeyArgs);

        let cmdkeyError = '';
        addKey.stderr.on('data', (data) => {
            cmdkeyError += data.toString();
        });

        addKey.on('close', (code) => {
            if (code !== 0) {
                console.error(`❌ cmdkey falhou com código ${code}`);
                console.error(`   Erro: ${cmdkeyError}`);
                dialog.showErrorBox('Erro de Credencial', 'Não foi possível salvar a credencial temporária.');
                return;
            }

            console.log(`✅ Credencial RDP adicionada com sucesso (cmdkey).`);
            console.log(`🔑 Tamanho da senha: ${plainTextPassword.length} caracteres`);

            // VERIFICAÇÃO: Listar credenciais para confirmar
            const listKey = spawn('cmdkey', ['/list']);
            let listOutput = '';

            listKey.stdout.on('data', (data) => {
                listOutput += data.toString();
            });

            listKey.on('close', () => {
                console.log('📋 Credenciais atuais (cmdkey /list):');
                console.log(listOutput);

                // Verifica se a credencial foi realmente salva
                const targetSaved = listOutput.includes(target) || listOutput.includes(`LegacyGeneric:target=${target}`);
                if (!targetSaved) {
                    console.warn(`⚠️ ATENÇÃO: Target "${target}" NÃO encontrado na lista de credenciais!`);
                    console.warn(`   Isso pode causar solicitação de senha durante a conexão.`);
                } else {
                    console.log(`✅ Credencial confirmada na lista do Windows.`);
                }

                if (mainWindow) {
                    mainWindow.webContents.send('connection-status-update', serverInfo.id, 'active');
                }

                // Obtém o caminho do arquivo RDP persistente
                const rdpFilePath = fileSystemManager.getFilePath(serverInfo);

                // Garante que o arquivo existe (caso tenha sido deletado manualmente)
                if (!fs.existsSync(rdpFilePath)) {
                    console.log(`⚠️ Arquivo RDP não encontrado em ${rdpFilePath}. Recriando...`);
                    fileSystemManager.saveConnectionFile(serverInfo);
                }

                console.log(`📄 Usando arquivo RDP: ${rdpFilePath}`);

                // Inicia MSTSC com o arquivo RDP
                const mstsc = spawn('mstsc.exe', [rdpFilePath, '/admin']);

                mstsc.on('close', (mstscCode) => {
                    console.log(`🏁 Sessão RDP finalizada (código ${mstscCode}).`);

                    // NÃO removemos mais o arquivo, pois ele é persistente

                    if (mainWindow) {
                        mainWindow.webContents.send('connection-status-update', serverInfo.id, 'inactive');
                    }

                    // Limpa credenciais
                    const deleteKey = spawn('cmdkey', ['/delete:' + target]);
                    deleteKey.on('close', () => {
                        console.log('🧹 Credencial RDP limpa com sucesso.');
                    });
                });
            });
        });
    }
});

// ==========================
// HANDLERS DE CONECTIVIDADE (MANTIDOS)
// ==========================

ipcMain.handle('connectivity-test-server', async (event, serverInfo) => {
    try {
        console.log(`🧪 Teste de conectividade solicitado para: ${serverInfo.name}`);
        const result = await connectivityTester.testServerConnectivity(serverInfo);
        const serverKey = `${serverInfo.ipAddress}:${serverInfo.port || (serverInfo.protocol === 'rdp' ? 3389 : 22)}`;
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

ipcMain.on('connectivity-start-monitoring', (event, serverInfo, interval = 30000) => {
    const serverKey = `${serverInfo.ipAddress}:${serverInfo.port || (serverInfo.protocol === 'rdp' ? 3389 : 22)}`;
    if (connectivityMonitors.has(serverKey)) {
        clearInterval(connectivityMonitors.get(serverKey));
    }
    console.log(`📡 Iniciando monitoramento de ${serverInfo.name} (${serverKey}) a cada ${interval}ms`);
    const monitorInterval = setInterval(async () => {
        try {
            const result = await connectivityTester.testServerConnectivity(serverInfo);
            if (mainWindow) {
                mainWindow.webContents.send('connectivity-status-update', serverKey, result);
            }
        } catch (error) {
            console.error(`❌ Erro no monitoramento de ${serverKey}:`, error);
            if (mainWindow) {
                mainWindow.webContents.send('connectivity-error', serverKey, { message: error.message });
            }
        }
    }, interval);
    connectivityMonitors.set(serverKey, monitorInterval);
    if (mainWindow) {
        mainWindow.webContents.send('connectivity-monitoring-change', 'started', serverKey, { interval });
    }
});

ipcMain.on('connectivity-stop-monitoring', (event, serverKey) => {
    if (connectivityMonitors.has(serverKey)) {
        clearInterval(connectivityMonitors.get(serverKey));
        connectivityMonitors.delete(serverKey);
        console.log(`⏹️ Monitoramento parado para ${serverKey}`);
        if (mainWindow) {
            mainWindow.webContents.send('connectivity-monitoring-change', 'stopped', serverKey);
        }
    }
});

ipcMain.on('connectivity-stop-all-monitoring', () => {
    console.log('⏹️ Parando todo monitoramento de conectividade');
    connectivityMonitors.forEach((interval, serverKey) => {
        clearInterval(interval);
        if (mainWindow) {
            mainWindow.webContents.send('connectivity-monitoring-change', 'stopped', serverKey);
        }
    });
    connectivityMonitors.clear();
});

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

ipcMain.handle('theme:get-os-theme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

// ==========================
// HANDLER DE IMPORTAÇÃO DO AD
// ==========================
ipcMain.handle('ad-search', async (event, { url, baseDN, username, password }) => {
    console.log(`🔍 Iniciando busca no AD: ${url} (${baseDN})`);

    const config = {
        url,
        baseDN,
        username,
        password
        // Removido attributes daqui para evitar conflitos ou restrições indesejadas
    };

    return new Promise((resolve, reject) => {
        try {
            const ad = new ActiveDirectory(config);

            // Configuração da busca com filtro e atributos explícitos
            const searchOptions = {
                filter: 'objectCategory=computer',
                attributes: ['cn', 'name', 'sAMAccountName', 'dNSHostName', 'operatingSystem', 'description']
            };

            console.log('🔍 Executando busca no AD com opções:', JSON.stringify(searchOptions));

            ad.find(searchOptions, (err, results) => {
                if (err) {
                    console.error('❌ Erro na busca do AD:', err);
                    reject(new Error(`Erro ao buscar no AD: ${err.message}`));
                    return;
                }

                if (!results) {
                    console.log('⚠️ Nenhum resultado retornado do AD.');
                    resolve([]);
                    return;
                }

                console.log('🔍 TIPO DO RETORNO ORIGINAL:', typeof results);
                console.log('🔍 É ARRAY?', Array.isArray(results));
                if (results && typeof results === 'object') {
                    console.log('🔍 CHAVES DO RETORNO:', Object.keys(results));
                }

                // Função auxiliar para normalizar o resultado
                const normalizeResults = (data) => {
                    if (!data) return [];

                    // 1. Converte para array
                    let arr = Array.isArray(data) ? data : (data.length !== undefined ? Array.from(data) : [data]);

                    // 2. Flatten recursivo para arrays aninhados
                    while (arr.length > 0 && Array.isArray(arr[0])) {
                        console.log('🔄 Flattening array aninhado...');
                        arr = arr.flat();
                    }

                    // 3. Inspeção de Wrapper Object (Caso o AD retorne [{ computers: [...] }] ou similar)
                    if (arr.length === 1 && typeof arr[0] === 'object' && arr[0] !== null) {
                        const item = arr[0];
                        // Verifica se alguma chave do objeto contém um array grande
                        const potentialArrays = Object.values(item).filter(val => Array.isArray(val) && val.length > 0);

                        if (potentialArrays.length === 1) {
                            console.log('📦 Detectado objeto wrapper contendo array. Extraindo...');
                            return potentialArrays[0]; // Retorna o array interno
                        }
                    }

                    return arr;
                };

                const resultsArray = normalizeResults(results);

                console.log(`✅ Encontrados ${resultsArray.length} itens após normalização.`);

                if (resultsArray.length === 0) {
                    console.log('⚠️ Nenhum computador encontrado no AD.');
                    resolve([]);
                    return;
                }

                // Log do primeiro resultado para debug
                if (resultsArray.length > 0) {
                    console.log('🔍 PRIMEIRO ITEM (Processado):', JSON.stringify(resultsArray[0], null, 2));
                }

                // Mapeia os resultados
                const computers = resultsArray.map(comp => {
                    // Proteção contra itens nulos/indefinidos
                    if (!comp || typeof comp !== 'object') return null;

                    // Normaliza chaves
                    const normalized = {};
                    Object.keys(comp).forEach(key => {
                        normalized[key.toLowerCase()] = comp[key];
                    });

                    // Tenta obter o sAMAccountName
                    let netbiosName = normalized.samaccountname || '';
                    if (netbiosName && typeof netbiosName === 'string' && netbiosName.endsWith('$')) {
                        netbiosName = netbiosName.slice(0, -1);
                    }

                    // Prioridade de nomes
                    const displayName = netbiosName || normalized.cn || normalized.name || normalized.dnshostname || 'Computador Sem Nome';
                    const address = normalized.dnshostname || displayName;

                    return {
                        name: displayName,
                        dnsName: address,
                        description: normalized.description || '',
                        os: normalized.operatingsystem || 'Windows'
                    };
                }).filter(item => item !== null);

                if (computers.length > 0) {
                    console.log('✅ EXEMPLO FINAL:', JSON.stringify(computers[0], null, 2));
                }

                resolve(computers);
            });
        } catch (error) {
            console.error('❌ Erro crítico ao inicializar AD:', error);
            reject(error);
        }
    });
});

// ==========================
// CLEANUP AO FECHAR
// ==========================
// ==========================
// HANDLERS VNC PROXY (VNC WALL)
// ==========================
ipcMain.handle('vnc-proxy-start', async (event, serverInfo) => {
    try {
        console.log(`🔌 Solicitando proxy VNC para: ${serverInfo.name}`);
        const port = await vncProxyService.startProxy(serverInfo);
        return { success: true, port: port };
    } catch (error) {
        console.error('❌ Erro ao iniciar proxy VNC:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('vnc-proxy-stop', async (event, serverId) => {
    try {
        const stopped = vncProxyService.stopProxy(serverId);
        return { success: stopped };
    } catch (error) {
        console.error('❌ Erro ao parar proxy VNC:', error);
        return { success: false, error: error.message };
    }
});

app.on('before-quit', () => {
    console.log('🧹 Limpando recursos antes de fechar...');
    connectivityMonitors.forEach((interval) => {
        clearInterval(interval);
    });
    connectivityMonitors.clear();
    console.log('✅ Cleanup concluído');
});