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

    // ==========================
    // VNC CSV IMPORT (FEATURE v5.11)
    // ==========================

    /**
     * Helper: Executa a limpeza de VNC (reutilizável)
     * @returns {Object} Resultado da limpeza
     */
    async function executeVncClean() {
        console.log('🗑️ [VNC CLEAN] Iniciando limpeza completa de VNC...');

        // 1. Busca todas conexões VNC antes de deletar
        const vncConnections = databaseManager.db.prepare(`
            SELECT c.*, g.name as group_name 
            FROM connections c 
            JOIN groups g ON c.group_id = g.id 
            WHERE c.protocol = 'vnc'
        `).all();

        console.log(`📊 [VNC CLEAN] Encontradas ${vncConnections.length} conexões VNC para remover`);

        // 2. Remove arquivos .vnc do disco
        let filesDeleted = 0;
        for (const conn of vncConnections) {
            try {
                fileSystemManager.deleteConnectionFile({
                    ...conn,
                    ipAddress: conn.ip_address,
                    groupName: conn.group_name
                });
                filesDeleted++;
            } catch (fileErr) {
                console.warn(`⚠️ [VNC CLEAN] Não foi possível remover arquivo para: ${conn.name}`);
            }
        }

        // 3. Deleta conexões VNC do SQLite
        const deleteConnResult = databaseManager.db.prepare(`
            DELETE FROM connections WHERE protocol = 'vnc'
        `).run();

        // 4. Deleta grupos VNC (apenas do tipo 'vnc')
        const deleteGroupsResult = databaseManager.db.prepare(`
            DELETE FROM groups WHERE type = 'vnc'
        `).run();

        console.log(`✅ [VNC CLEAN] Limpeza concluída:`);
        console.log(`   - ${deleteConnResult.changes} conexões removidas do SQLite`);
        console.log(`   - ${deleteGroupsResult.changes} grupos VNC removidos`);
        console.log(`   - ${filesDeleted} arquivos .vnc removidos`);

        return {
            success: true,
            connectionsDeleted: deleteConnResult.changes,
            groupsDeleted: deleteGroupsResult.changes,
            filesDeleted: filesDeleted
        };
    }

    /**
     * ⚠️ PERIGO: Deleta TODAS as conexões e grupos VNC
     * Afeta APENAS VNC - RDP/SSH permanecem intactos
     */
    ipcMain.handle('db-vnc-delete-all', async () => {
        try {
            return await executeVncClean();
        } catch (error) {
            console.error('❌ [VNC CLEAN] Erro na limpeza:', error);
            return { success: false, error: error.message };
        }
    });

    /**
     * Importa conexões VNC de um CSV
     * @param {string} csvContent - Conteúdo do arquivo CSV
     * @param {boolean} cleanImport - Se true, deleta tudo antes de importar
     */
    ipcMain.handle('db-vnc-import-csv', async (event, { csvContent, cleanImport }) => {
        const results = {
            success: true,
            imported: 0,
            skipped: 0,
            failed: 0,
            groupsCreated: 0,
            errors: [],
            skippedNames: []
        };

        try {
            console.log(`📥 [VNC CSV] Iniciando importação CSV (modo: ${cleanImport ? 'LIMPO' : 'MESCLAR'})`);

            // 1. Se cleanImport, deleta tudo primeiro (chama função diretamente)
            if (cleanImport) {
                console.log('🧹 [VNC CSV] Executando limpeza prévia...');
                const cleanResult = await executeVncClean();
                if (!cleanResult.success) {
                    throw new Error('Falha na limpeza prévia: ' + cleanResult.error);
                }
                console.log(`✅ [VNC CSV] Limpeza concluída: ${cleanResult.connectionsDeleted} conexões removidas`);
            }

            // 2. Remove BOM UTF-8 se existir e normaliza quebras de linha
            let cleanedCsv = csvContent;
            if (cleanedCsv.charCodeAt(0) === 0xFEFF) {
                cleanedCsv = cleanedCsv.slice(1);
            }
            cleanedCsv = cleanedCsv.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            // 3. Parse CSV (delimitador: ;)
            const lines = cleanedCsv.split('\n').filter(line => line.trim());

            if (lines.length === 0) {
                return { ...results, success: false, error: 'Arquivo CSV vazio' };
            }

            // 4. Verifica se primeira linha é cabeçalho
            const firstLine = lines[0].toLowerCase();
            const isHeader = firstLine.includes('nome') || firstLine.includes('host') || firstLine.includes('grupo');
            const dataLines = isHeader ? lines.slice(1) : lines;

            console.log(`📊 [VNC CSV] ${dataLines.length} linhas de dados para processar`);

            // 5. Cache de grupos existentes
            const existingGroups = databaseManager.getAllGroups('vnc');
            const groupCache = new Map();
            existingGroups.forEach(g => groupCache.set(g.groupName.toLowerCase(), g.id));

            // 6. Processa cada linha
            for (let i = 0; i < dataLines.length; i++) {
                const line = dataLines[i].trim();
                if (!line) continue;

                try {
                    // Parse: Nome;Host;Porta;Senha;Grupo
                    const parts = line.split(';').map(p => p.trim());

                    if (parts.length < 2) {
                        results.failed++;
                        results.errors.push({ line: i + 1, error: 'Linha inválida (mínimo: Nome;Host)' });
                        continue;
                    }

                    const [name, host, port = '5900', password = '', groupName = 'Importados CSV'] = parts;

                    if (!name || !host) {
                        results.failed++;
                        results.errors.push({ line: i + 1, error: 'Nome ou Host vazio' });
                        continue;
                    }

                    // 7. Busca ou cria grupo
                    let groupId;
                    const normalizedGroupName = groupName.toLowerCase();

                    if (groupCache.has(normalizedGroupName)) {
                        groupId = groupCache.get(normalizedGroupName);
                    } else {
                        // Cria novo grupo
                        groupId = databaseManager.addGroup(groupName, 'vnc');
                        groupCache.set(normalizedGroupName, groupId);
                        results.groupsCreated++;
                        console.log(`📁 [VNC CSV] Grupo criado: "${groupName}" (ID: ${groupId})`);
                    }

                    // 8. Verifica duplicatas (mesmo nome E mesmo IP no mesmo grupo)
                    const existsByName = databaseManager.connectionExists(name, groupId);
                    if (existsByName) {
                        results.skipped++;
                        results.skippedNames.push(name);
                        continue;
                    }

                    // 9. Criptografa senha
                    let encryptedPassword = '';
                    if (password) {
                        try {
                            const encrypted = safeStorage.encryptString(password);
                            encryptedPassword = encrypted.toString('base64');
                        } catch (e) {
                            console.warn(`⚠️ [VNC CSV] Falha ao criptografar senha para ${name}`);
                            encryptedPassword = password; // Fallback: guarda sem criptografia
                        }
                    }

                    // 10. Insere no SQLite
                    const connectionData = {
                        name: name,
                        ipAddress: host,
                        port: port || '5900',
                        protocol: 'vnc',
                        password: encryptedPassword
                    };

                    const connectionId = databaseManager.addConnection(groupId, connectionData);

                    // 11. Cria arquivo .vnc no disco
                    fileSystemManager.saveConnectionFile({
                        ...connectionData,
                        id: connectionId,
                        groupName: groupName
                    });

                    results.imported++;

                } catch (lineError) {
                    results.failed++;
                    results.errors.push({ line: i + 1, error: lineError.message });
                    console.error(`❌ [VNC CSV] Erro na linha ${i + 1}:`, lineError.message);
                }
            }

            console.log(`✅ [VNC CSV] Importação concluída:`);
            console.log(`   - ${results.imported} conexões importadas`);
            console.log(`   - ${results.groupsCreated} grupos criados`);
            console.log(`   - ${results.skipped} duplicatas ignoradas`);
            console.log(`   - ${results.failed} erros`);

            return results;

        } catch (error) {
            console.error('❌ [VNC CSV] Erro geral na importação:', error);
            return { ...results, success: false, error: error.message };
        }
    });

    console.log('✅ Database handlers registrados (12 handlers)');

    // ============================================
    // HANDLERS ANYDESK
    // ============================================

    // Obter todos os grupos AnyDesk com conexões
    ipcMain.handle('db-anydesk-get-groups', async () => {
        try {
            const groups = databaseManager.db.prepare(`
                SELECT * FROM anydesk_groups ORDER BY sort_order, name
            `).all();

            const connections = databaseManager.db.prepare(`
                SELECT * FROM anydesk_connections ORDER BY sort_order, name
            `).all();

            // Agrupar conexões
            const groupsWithConnections = groups.map(group => ({
                id: group.id,
                name: group.name,
                icon: group.icon,
                color: group.color,
                sortOrder: group.sort_order,
                connections: connections
                    .filter(c => c.group_id === group.id)
                    .map(c => ({
                        id: c.id,
                        groupId: c.group_id,
                        name: c.name,
                        anydeskId: c.anydesk_id,
                        description: c.description,
                        password: c.password,
                        lastConnected: c.last_connected,
                        sortOrder: c.sort_order
                    }))
            }));

            return groupsWithConnections;
        } catch (error) {
            console.error('❌ Erro ao obter grupos AnyDesk:', error);
            return [];
        }
    });

    // Adicionar grupo AnyDesk
    ipcMain.handle('db-anydesk-add-group', async (event, { name, icon, color }) => {
        try {
            const result = databaseManager.db.prepare(`
                INSERT INTO anydesk_groups (name, icon, color) VALUES (?, ?, ?)
            `).run(name, icon, color || '#EF473A');
            return { success: true, id: result.lastInsertRowid };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Atualizar grupo AnyDesk
    ipcMain.handle('db-anydesk-update-group', async (event, { id, name, icon, color }) => {
        try {
            databaseManager.db.prepare(`
                UPDATE anydesk_groups SET name = ?, icon = COALESCE(?, icon), color = COALESCE(?, color) WHERE id = ?
            `).run(name, icon, color, id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Deletar grupo AnyDesk
    ipcMain.handle('db-anydesk-delete-group', async (event, id) => {
        try {
            databaseManager.db.prepare(`DELETE FROM anydesk_groups WHERE id = ?`).run(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Adicionar conexão AnyDesk
    ipcMain.handle('db-anydesk-add-connection', async (event, { groupId, name, anydeskId, description, password }) => {
        try {
            const result = databaseManager.db.prepare(`
                INSERT INTO anydesk_connections (group_id, name, anydesk_id, description, password)
                VALUES (?, ?, ?, ?, ?)
            `).run(groupId, name, anydeskId, description || '', password || '');
            return { success: true, id: result.lastInsertRowid };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Atualizar conexão AnyDesk
    ipcMain.handle('db-anydesk-update-connection', async (event, { id, name, anydeskId, description, password }) => {
        try {
            databaseManager.db.prepare(`
                UPDATE anydesk_connections 
                SET name = ?, anydesk_id = ?, description = ?, password = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(name, anydeskId, description || '', password || '', id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Deletar conexão AnyDesk
    ipcMain.handle('db-anydesk-delete-connection', async (event, id) => {
        try {
            databaseManager.db.prepare(`DELETE FROM anydesk_connections WHERE id = ?`).run(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Atualizar último acesso
    ipcMain.handle('db-anydesk-update-last-connected', async (event, id) => {
        try {
            databaseManager.db.prepare(`
                UPDATE anydesk_connections SET last_connected = CURRENT_TIMESTAMP WHERE id = ?
            `).run(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ AnyDesk database handlers registrados (8 handlers)');
}

module.exports = { registerDatabaseHandlers };
