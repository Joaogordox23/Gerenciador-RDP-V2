// public/ipc/bulk.handlers.js
// Handlers IPC para operações em massa (bulk operations)

const { ipcMain, safeStorage } = require('electron');

/**
 * Registra handlers IPC para operações em massa
 * @param {Object} deps - Dependências injetadas
 * @param {Object} deps.store - Instância do electron-store
 * @param {Object} deps.fileSystemManager - Gerenciador de arquivos
 */
function registerBulkHandlers({ store, fileSystemManager }) {

    // ==========================
    // ALTERAÇÃO DE SENHA EM MASSA
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
                            return { ...item, password: credentials.password };
                        } else {
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

            // Salva no store
            store.set(storeKey, updatedGroups);

            // Atualiza arquivos físicos
            updatedGroups.forEach(group => {
                const groupName = group.name || group.groupName;

                if (group[itemsKey]) {
                    group[itemsKey].forEach(item => {
                        if (servers.includes(item.id)) {
                            if (!item.groupName) item.groupName = groupName;
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

    console.log('✅ Bulk handlers registrados (1 handler)');
}

module.exports = { registerBulkHandlers };
