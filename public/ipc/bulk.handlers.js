// public/ipc/bulk.handlers.js
// Handlers IPC para operações em massa (bulk operations)

const { ipcMain, safeStorage } = require('electron');

/**
 * Verifica se uma string já está criptografada com safeStorage
 * @param {string} str - String a verificar
 * @returns {boolean}
 */
function isAlreadyEncrypted(str) {
    if (!str || typeof str !== 'string') return false;
    if (str.length < 40) return false;
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    return base64Regex.test(str);
}

/**
 * Registra handlers IPC para operações em massa
 * @param {Object} deps - Dependências injetadas
 * @param {Object} deps.store - Instância do electron-store
 * @param {Object} deps.fileSystemManager - Gerenciador de arquivos
 * @param {Object} deps.databaseManager - Gerenciador do banco SQLite
 */
function registerBulkHandlers({ store, fileSystemManager, databaseManager }) {

    // ==========================
    // ALTERAÇÃO DE SENHA EM MASSA
    // ==========================
    ipcMain.handle('bulk-update-password', async (event, { type, servers, credentials }) => {
        console.log(`🔑 Pedido de alteração de senha em massa: ${servers.length} servidor(es) ${type}`);

        const results = [];

        try {
            let totalUpdated = 0;

            // ✅ CORREÇÃO: Criptografar a senha ANTES de salvar
            let encryptedPassword = credentials.password;

            if (credentials.password && typeof credentials.password === 'string') {
                if (!isAlreadyEncrypted(credentials.password)) {
                    try {
                        const encrypted = safeStorage.encryptString(credentials.password);
                        encryptedPassword = encrypted.toString('base64');
                        console.log('🔐 Senha criptografada para salvamento em massa');
                    } catch (e) {
                        console.error('❌ Falha ao criptografar senha:', e);
                        // Continua com a senha em texto plano se falhar
                    }
                } else {
                    console.log('🔓 Senha já criptografada, mantendo original');
                }
            }

            // Atualiza cada servidor selecionado diretamente no SQLite
            for (const serverId of servers) {
                try {
                    // Prepara os dados de atualização com senha criptografada
                    const updateData = {
                        password: encryptedPassword
                    };

                    // Para RDP/SSH, também atualiza username e domain
                    if (type !== 'vnc') {
                        if (credentials.username) {
                            updateData.username = credentials.username;
                        }
                        if (credentials.domain !== undefined) {
                            updateData.domain = credentials.domain;
                        }
                    }

                    // Atualiza no SQLite
                    const result = databaseManager.updateConnection(serverId, updateData);

                    if (result.changes > 0) {
                        totalUpdated++;
                        results.push({ id: serverId, success: true });
                        console.log(`  ✅ Servidor ${serverId} atualizado`);

                        // Atualiza arquivo físico com a conexão atualizada do banco
                        const connection = databaseManager.getConnectionById(serverId);
                        if (connection && fileSystemManager) {
                            // Usa groupDisplayName (nome real do grupo) ao invés de groupName (campo antigo)
                            fileSystemManager.saveConnectionFile({
                                ...connection,
                                groupName: connection.groupDisplayName || connection.groupName || 'Sem Grupo'
                            });
                            console.log(`  📁 Arquivo físico atualizado para ${connection.name}`);
                        }
                    } else {
                        results.push({ id: serverId, success: false, error: 'Não encontrado' });
                    }
                } catch (err) {
                    console.error(`  ❌ Erro ao atualizar servidor ${serverId}:`, err);
                    results.push({ id: serverId, success: false, error: err.message });
                }
            }

            console.log(`✅ ${totalUpdated} servidor(es) atualizado(s) com sucesso`);

            // ✅ OTIMIZAÇÃO: Não recarrega todos os grupos
            // Retorna apenas os IDs atualizados para o frontend atualizar localmente
            return {
                success: true,
                updated: totalUpdated,
                failed: servers.length - totalUpdated,
                details: results,
                // Frontend atualiza localmente com base nos IDs
                updatedIds: results.filter(r => r.success).map(r => r.id)
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

