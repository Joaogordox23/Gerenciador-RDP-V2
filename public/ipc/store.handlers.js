// public/ipc/store.handlers.js
// Handlers IPC para operações básicas do electron-store

const { ipcMain, safeStorage, app } = require('electron');

/**
 * Registra handlers IPC para operações básicas do store
 * @param {Object} deps - Dependências injetadas
 * @param {Object} deps.store - Instância do electron-store
 * @param {Object} deps.fileSystemManager - Gerenciador de arquivos
 * @param {Object} deps.databaseManager - Gerenciador do SQLite
 */
function registerStoreHandlers({ store, fileSystemManager, databaseManager }) {
    // ==========================
    // CLEAR DATA - Limpa todos os dados
    // ==========================
    ipcMain.on('clear-data-request', () => {
        console.log('🧹 Limpando todos os dados...');
        store.clear();
        app.relaunch();
        app.quit();
    });

    // ==========================
    // GET DATA - Obtém dados do store
    // ==========================
    ipcMain.handle('get-data', (event, key) => {
        return store.get(key);
    });

    // ==========================
    // SET DATA - Salva dados no store com criptografia e persistência
    // ==========================
    ipcMain.on('set-data', (event, key, value) => {
        if (key === 'groups' || key === 'vncGroups') {
            processGroupsData(key, value, store, fileSystemManager);
        } else {
            store.set(key, value);
        }
    });

    // ==========================
    // SYNC FROM DISK - Sincronização manual
    // ==========================
    ipcMain.handle('force-sync-from-disk', async () => {
        console.log('🔄 Sincronização manual solicitada...');
        console.log('📂 Diretório de scan:', fileSystemManager.rootDir);

        try {
            const diskServers = fileSystemManager.scanServers();
            console.log(`📊 Arquivos encontrados no disco: ${diskServers.length}`);

            // Log detalhado dos arquivos encontrados
            if (diskServers.length > 0) {
                console.log('📋 Lista de servidores encontrados:');
                diskServers.forEach((s, i) => {
                    console.log(`   ${i + 1}. ${s.name} (${s.protocol}) - Grupo: ${s.groupName}`);
                });
            } else {
                console.log('⚠️ Nenhum arquivo encontrado no disco!');
                console.log('   Verifique se os arquivos estão em:');
                console.log(`   - ${fileSystemManager.protocolDirs.vnc}`);
                console.log(`   - ${fileSystemManager.protocolDirs.rdp}`);
            }

            let syncResult = { imported: 0, skipped: 0 };

            if (diskServers.length > 0) {
                syncResult = databaseManager.syncFromDisk(diskServers);
            }

            // Registrar timestamp da sincronização
            databaseManager.setLastSyncTime();

            // Recarregar dados atualizados
            const groups = databaseManager.getAllGroups('rdp');
            const vncGroups = databaseManager.getAllGroups('vnc');
            const lastSyncTime = databaseManager.getLastSyncTime();

            console.log(`✅ Sincronização manual concluída: ${syncResult.imported} importados, ${syncResult.skipped} já existentes`);
            console.log(`📊 Total no banco: ${groups.length} grupos RDP, ${vncGroups.length} grupos VNC`);

            return {
                success: true,
                imported: syncResult.imported,
                skipped: syncResult.skipped,
                lastSyncTime,
                groups,
                vncGroups
            };
        } catch (error) {
            console.error('❌ Erro na sincronização manual:', error);
            return {
                success: false,
                error: error.message
            };
        }
    });

    // ==========================
    // GET LAST SYNC TIME - Obtém timestamp da última sincronização
    // ==========================
    ipcMain.handle('get-last-sync-time', async () => {
        try {
            return databaseManager.getLastSyncTime();
        } catch (error) {
            console.error('Erro ao obter última sincronização:', error);
            return null;
        }
    });

    console.log('✅ Store handlers registrados (inclui sync)');
}

/**
 * Processa dados de grupos com salvamento diferencial e criptografia
 */
function processGroupsData(key, value, store, fileSystemManager) {
    const oldGroups = store.get(key) || [];
    const newGroups = JSON.parse(JSON.stringify(value));
    const isVnc = key === 'vncGroups';
    const serversKey = isVnc ? 'connections' : 'servers';

    // Cria mapa de servidores antigos para comparação rápida
    const oldServersMap = new Map();
    oldGroups.forEach(group => {
        const groupName = group.name || group.groupName;
        if (group[serversKey]) {
            group[serversKey].forEach(server => {
                const serverKey = `${groupName}::${server.id || server.name}`;
                oldServersMap.set(serverKey, {
                    ...server,
                    groupName: groupName
                });
            });
        }
    });

    let savedCount = 0;
    let skippedCount = 0;

    newGroups.forEach(group => {
        const groupName = group.name || group.groupName;

        if (group[serversKey]) {
            group[serversKey].forEach(server => {
                // Injeta o nome do grupo no servidor se não existir
                if (!server.groupName) server.groupName = groupName;

                // Garante protocolo VNC se for vncGroups
                if (isVnc && !server.protocol) server.protocol = 'vnc';

                // Salvamento diferencial
                const serverKey = `${groupName}::${server.id || server.name}`;
                const oldServer = oldServersMap.get(serverKey);

                const hasChanged = !oldServer ||
                    oldServer.name !== server.name ||
                    oldServer.ipAddress !== server.ipAddress ||
                    oldServer.port !== server.port ||
                    oldServer.username !== server.username ||
                    oldServer.domain !== server.domain ||
                    oldServer.protocol !== server.protocol ||
                    oldServer.connectionType !== server.connectionType;

                const passwordChanged = server.password &&
                    typeof server.password === 'string' &&
                    server.password.length < 100 &&
                    server.password !== oldServer?.password;

                if (hasChanged || passwordChanged) {
                    fileSystemManager.saveConnectionFile(server);
                    savedCount++;
                } else {
                    skippedCount++;
                }

                // Criptografia de senhas
                if (server.password && typeof server.password === 'string') {
                    // Critério consistente com database.handlers.js:
                    // - Senhas normais têm < 40 caracteres
                    // - Senhas criptografadas têm >= 40 caracteres e são base64 válido
                    const isLikelyEncrypted = server.password.length >= 40 &&
                        /^[A-Za-z0-9+/]+=*$/.test(server.password);

                    if (!isLikelyEncrypted) {
                        try {
                            const encryptedPassword = safeStorage.encryptString(server.password);
                            server.password = encryptedPassword.toString('base64');
                        } catch (e) {
                            console.error('Falha ao criptografar a senha.', e);
                        }
                    }
                }
            });
        }
    });

    if (savedCount > 0 || skippedCount > 0) {
        console.log(`📊 Salvamento diferencial (${key}): ${savedCount} alterados, ${skippedCount} inalterados`);
    }

    store.set(key, newGroups);
}

module.exports = { registerStoreHandlers };
