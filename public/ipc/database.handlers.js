// public/ipc/database.handlers.js
// Handlers IPC para operações CRUD do SQLite (alta performance)

const { ipcMain, safeStorage } = require('electron');

/**
 * Verifica se uma string já está criptografada com safeStorage
 * Senhas criptografadas são base64 com comprimento > 50 chars
 * @param {string} str - String a verificar
 * @returns {boolean}
 */
function isAlreadyEncrypted(str) {
    if (!str || typeof str !== 'string') return false;

    // Senhas normais geralmente têm < 30 caracteres
    // Senhas criptografadas com safeStorage têm > 50 caracteres em base64
    if (str.length < 40) return false;

    // Verifica se é base64 válido
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    return base64Regex.test(str);
}

/**
 * Registra handlers IPC para operações de banco de dados SQLite
 * @param {Object} deps - Dependências injetadas
 * @param {Object} deps.databaseManager - Gerenciador do banco SQLite
 * @param {Object} deps.fileSystemManager - Gerenciador de arquivos
 */
function registerDatabaseHandlers({ databaseManager, fileSystemManager }) {
    // ==========================
    // GRUPOS
    // ==========================

    // Obtém todos os grupos de um tipo
    ipcMain.handle('db-get-groups', async (event, type) => {
        try {
            return databaseManager.getAllGroups(type);
        } catch (error) {
            console.error('❌ Erro ao obter grupos:', error);
            return [];
        }
    });

    // Adiciona um grupo
    ipcMain.handle('db-add-group', async (event, { name, type }) => {
        try {
            const groupId = databaseManager.addGroup(name, type);
            console.log(`✅ Grupo adicionado: ${name} (ID: ${groupId})`);
            return { success: true, id: groupId };
        } catch (error) {
            console.error('❌ Erro ao adicionar grupo:', error);
            return { success: false, error: error.message };
        }
    });

    // Atualiza um grupo
    ipcMain.handle('db-update-group', async (event, { groupId, name }) => {
        try {
            databaseManager.updateGroup(groupId, name);
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao atualizar grupo:', error);
            return { success: false, error: error.message };
        }
    });

    // Remove um grupo
    ipcMain.handle('db-delete-group', async (event, groupId) => {
        try {
            databaseManager.deleteGroup(groupId);
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao remover grupo:', error);
            return { success: false, error: error.message };
        }
    });

    // ==========================
    // CONEXÕES
    // ==========================

    // Adiciona uma conexão (PONTUAL!)
    ipcMain.handle('db-add-connection', async (event, { groupId, connectionData }) => {
        try {
            // Criptografa senha antes de salvar (evita dupla criptografia)
            if (connectionData.password && typeof connectionData.password === 'string') {
                if (!isAlreadyEncrypted(connectionData.password)) {
                    try {
                        const encryptedPassword = safeStorage.encryptString(connectionData.password);
                        connectionData.password = encryptedPassword.toString('base64');
                        console.log('🔐 Senha criptografada para nova conexão');
                    } catch (e) {
                        console.error('Falha ao criptografar senha:', e);
                    }
                } else {
                    console.log('🔓 Senha já criptografada, mantendo original');
                }
            }

            const connectionId = databaseManager.addConnection(groupId, connectionData);

            // Busca o nome do grupo para salvar no arquivo físico
            const group = databaseManager.getGroupById(groupId);
            const groupName = group ? group.name : 'Sem Grupo';

            // Salva arquivo físico com groupName correto
            fileSystemManager.saveConnectionFile({
                ...connectionData,
                id: connectionId,
                groupName: groupName
            });

            return { success: true, id: connectionId };
        } catch (error) {
            console.error('❌ Erro ao adicionar conexão:', error);
            return { success: false, error: error.message };
        }
    });

    // Atualiza uma conexão (PONTUAL - SUPER RÁPIDO!)
    ipcMain.handle('db-update-connection', async (event, { connectionId, updatedData }) => {
        try {
            const startTime = Date.now();

            // Criptografa senha se foi alterada (evita dupla criptografia)
            if (updatedData.password && typeof updatedData.password === 'string') {
                if (!isAlreadyEncrypted(updatedData.password)) {
                    try {
                        const encryptedPassword = safeStorage.encryptString(updatedData.password);
                        updatedData.password = encryptedPassword.toString('base64');
                        console.log('🔐 Senha criptografada para atualização');
                    } catch (e) {
                        console.error('Falha ao criptografar senha:', e);
                    }
                } else {
                    console.log('🔓 Senha já criptografada, mantendo original');
                }
            }

            databaseManager.updateConnection(connectionId, updatedData);

            // Obtém a conexão atualizada (com senha criptografada)
            const connection = databaseManager.getConnectionById(connectionId);
            if (connection) {
                // Usa groupDisplayName (nome real do grupo) ao invés de groupName (campo antigo)
                fileSystemManager.saveConnectionFile({
                    ...connection,
                    groupName: connection.groupDisplayName || connection.groupName || 'Sem Grupo'
                });
            }

            console.log(`⚡ Conexão ${connectionId} atualizada em ${Date.now() - startTime}ms`);
            // Retorna a conexão atualizada para sincronizar com o frontend
            return { success: true, connection: connection };
        } catch (error) {
            console.error('❌ Erro ao atualizar conexão:', error);
            return { success: false, error: error.message };
        }
    });

    // Remove uma conexão (PONTUAL!)
    ipcMain.handle('db-delete-connection', async (event, connectionId) => {
        try {
            // Obtém conexão antes de deletar (para remover arquivo)
            const connection = databaseManager.getConnectionById(connectionId);

            databaseManager.deleteConnection(connectionId);

            // Remove arquivo físico
            if (connection) {
                fileSystemManager.deleteConnectionFile(connection);
            }

            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao remover conexão:', error);
            return { success: false, error: error.message };
        }
    });

    // ==========================
    // BUSCA E ESTATÍSTICAS
    // ==========================

    // Busca conexões
    ipcMain.handle('db-search-connections', async (event, { term, protocol }) => {
        try {
            return databaseManager.searchConnections(term, protocol);
        } catch (error) {
            console.error('❌ Erro na busca:', error);
            return [];
        }
    });

    // Estatísticas do banco
    ipcMain.handle('db-get-stats', async () => {
        try {
            return databaseManager.getStats();
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return { totalGroups: 0, totalConnections: 0, byProtocol: {} };
        }
    });

    // ==========================
    // IMPORTAÇÃO EM MASSA (AD)
    // ==========================

    // Importa múltiplas conexões do AD com verificação de duplicatas
    ipcMain.handle('db-import-bulk', async (event, { groupId, connections, type }) => {
        const results = {
            success: true,
            imported: 0,
            skipped: 0,
            failed: 0,
            skippedNames: [],
            errors: []
        };

        try {
            // Busca o nome do grupo para salvar arquivos
            const group = databaseManager.getGroupById(groupId);
            const groupName = group ? group.name : 'Sem Grupo';
            const protocol = type === 'vnc' ? 'vnc' : connections[0]?.protocol || 'rdp';

            for (const conn of connections) {
                try {
                    // Verifica se já existe uma conexão com mesmo nome ou IP no grupo
                    const existsByName = databaseManager.connectionExists(conn.name, groupId);
                    const existsByIp = databaseManager.findConnectionByNameAndIp(conn.name, conn.ipAddress, type);

                    if (existsByName || existsByIp) {
                        results.skipped++;
                        results.skippedNames.push(conn.name);
                        console.log(`⏭️ Conexão "${conn.name}" já existe, pulando...`);
                        continue;
                    }

                    // Criptografa senha se existir
                    let encryptedPassword = '';
                    if (conn.password && typeof conn.password === 'string' && conn.password.trim()) {
                        try {
                            const encrypted = safeStorage.encryptString(conn.password);
                            encryptedPassword = encrypted.toString('base64');
                        } catch (e) {
                            console.warn('⚠️ Falha ao criptografar senha:', e.message);
                            encryptedPassword = conn.password;
                        }
                    }

                    // Adiciona a conexão
                    const connectionData = {
                        name: conn.name,
                        ipAddress: conn.ipAddress,
                        port: conn.port || (type === 'vnc' ? '5900' : ''),
                        protocol: conn.protocol || protocol,
                        username: conn.username || '',
                        password: encryptedPassword,
                        domain: conn.domain || '',
                        description: conn.description || ''
                    };

                    const connectionId = databaseManager.addConnection(groupId, connectionData);

                    // Salva arquivo físico
                    fileSystemManager.saveConnectionFile({
                        ...connectionData,
                        id: connectionId,
                        groupName: groupName
                    });

                    results.imported++;
                    console.log(`✅ Conexão "${conn.name}" importada com sucesso`);
                } catch (error) {
                    results.failed++;
                    results.errors.push({ name: conn.name, error: error.message });
                    console.error(`❌ Erro ao importar "${conn.name}":`, error.message);
                }
            }

            console.log(`📥 Importação concluída: ${results.imported} importados, ${results.skipped} duplicados, ${results.failed} erros`);
            return results;
        } catch (error) {
            console.error('❌ Erro na importação em massa:', error);
            return { success: false, error: error.message, imported: 0, skipped: 0, failed: 0 };
        }
    });

    console.log('✅ Database handlers registrados (10 handlers)');
}

module.exports = { registerDatabaseHandlers };
