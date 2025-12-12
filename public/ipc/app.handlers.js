// public/ipc/app.handlers.js
// Handlers IPC para gerenciamento de Aplicações (Feature v4.3)

const { ipcMain, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

/**
 * Registra handlers IPC para operações de aplicações
 * @param {Object} deps - Dependências injetadas
 * @param {Object} deps.databaseManager - Gerenciador do banco SQLite
 */
function registerAppHandlers({ databaseManager }) {

    // ==========================
    // GRUPOS DE APLICAÇÕES
    // ==========================

    // Obtém todos os grupos com suas aplicações
    ipcMain.handle('app-get-groups', async () => {
        try {
            const groups = databaseManager.getAppGroups();
            console.log(`📱 ${groups.length} grupos de aplicações carregados`);
            return { success: true, groups };
        } catch (error) {
            console.error('❌ Erro ao obter grupos de apps:', error);
            return { success: false, error: error.message, groups: [] };
        }
    });

    // Adiciona um grupo
    ipcMain.handle('app-add-group', async (event, data) => {
        try {
            const groupId = databaseManager.addAppGroup(data);
            return { success: true, id: groupId };
        } catch (error) {
            console.error('❌ Erro ao adicionar grupo de apps:', error);
            return { success: false, error: error.message };
        }
    });

    // Atualiza um grupo
    ipcMain.handle('app-update-group', async (event, { groupId, data }) => {
        try {
            databaseManager.updateAppGroup(groupId, data);
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao atualizar grupo de apps:', error);
            return { success: false, error: error.message };
        }
    });

    // Remove um grupo
    ipcMain.handle('app-delete-group', async (event, groupId) => {
        try {
            databaseManager.deleteAppGroup(groupId);
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao remover grupo de apps:', error);
            return { success: false, error: error.message };
        }
    });

    // ==========================
    // APLICAÇÕES
    // ==========================

    // Adiciona uma aplicação
    ipcMain.handle('app-add', async (event, { groupId, data }) => {
        try {
            const appId = databaseManager.addApp(groupId, data);
            return { success: true, id: appId };
        } catch (error) {
            console.error('❌ Erro ao adicionar aplicação:', error);
            return { success: false, error: error.message };
        }
    });

    // Atualiza uma aplicação
    ipcMain.handle('app-update', async (event, { appId, data }) => {
        try {
            databaseManager.updateApp(appId, data);
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao atualizar aplicação:', error);
            return { success: false, error: error.message };
        }
    });

    // Remove uma aplicação
    ipcMain.handle('app-delete', async (event, appId) => {
        try {
            databaseManager.deleteApp(appId);
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao remover aplicação:', error);
            return { success: false, error: error.message };
        }
    });

    // ==========================
    // ORDENAÇÃO
    // ==========================

    // Atualiza ordem das apps dentro de um grupo
    ipcMain.handle('app-update-apps-order', async (event, appOrders) => {
        try {
            databaseManager.updateAppsOrder(appOrders);
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao atualizar ordem de apps:', error);
            return { success: false, error: error.message };
        }
    });

    // Atualiza ordem dos grupos
    ipcMain.handle('app-update-groups-order', async (event, groupOrders) => {
        try {
            databaseManager.updateAppGroupsOrder(groupOrders);
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao atualizar ordem de grupos:', error);
            return { success: false, error: error.message };
        }
    });

    // ==========================
    // EXECUÇÃO DE APLICAÇÕES
    // ==========================

    // Executa uma aplicação (Web ou Local)
    ipcMain.handle('app-launch', async (event, appId) => {
        try {
            const app = databaseManager.getAppById(appId);

            if (!app) {
                return { success: false, error: 'Aplicação não encontrada' };
            }

            console.log(`🚀 Executando aplicação: ${app.name} (${app.type})`);

            if (app.type === 'web') {
                // Abre URL no navegador padrão usando comando start do Windows
                // O comando 'start' respeita melhor o navegador padrão que shell.openExternal
                const { exec } = require('child_process');
                exec(`start "" "${app.path}"`, (error) => {
                    if (error) {
                        console.error('Erro ao abrir URL:', error);
                        // Fallback para shell.openExternal
                        shell.openExternal(app.path);
                    }
                });
                console.log(`🌐 URL aberta: ${app.path}`);
            } else if (app.type === 'local') {
                // Executa aplicativo local
                const args = app.arguments ? app.arguments.split(' ').filter(a => a) : [];

                // Verifica se é um arquivo ou executável
                const ext = path.extname(app.path).toLowerCase();

                if (['.exe', '.bat', '.cmd', '.ps1'].includes(ext)) {
                    // Executável - usar spawn
                    const child = spawn(app.path, args, {
                        detached: true,
                        stdio: 'ignore',
                        shell: true
                    });
                    child.unref();
                    console.log(`💻 Executável iniciado: ${app.path}`);
                } else {
                    // Arquivo - abrir com aplicativo padrão
                    await shell.openPath(app.path);
                    console.log(`📂 Arquivo aberto: ${app.path}`);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao executar aplicação:', error);
            return { success: false, error: error.message };
        }
    });

    // Abre diálogo para selecionar arquivo/executável/imagem
    ipcMain.handle('app-select-file', async (event, type) => {
        const { dialog } = require('electron');

        try {
            let options;

            if (type === 'executable') {
                options = {
                    title: 'Selecionar Executável',
                    filters: [
                        { name: 'Executáveis', extensions: ['exe', 'bat', 'cmd', 'ps1'] },
                        { name: 'Todos os Arquivos', extensions: ['*'] }
                    ]
                };
            } else if (type === 'image') {
                // ✨ v4.6: Suporte para selecionar imagens
                options = {
                    title: 'Selecionar Ícone',
                    filters: [
                        { name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'gif', 'ico', 'svg', 'webp', 'bmp'] },
                        { name: 'Todos os Arquivos', extensions: ['*'] }
                    ]
                };
            } else {
                options = {
                    title: 'Selecionar Arquivo',
                    filters: [
                        { name: 'Todos os Arquivos', extensions: ['*'] }
                    ]
                };
            }

            const result = await dialog.showOpenDialog(options);

            if (result.canceled || !result.filePaths.length) {
                return { success: false, canceled: true };
            }

            const filePath = result.filePaths[0];

            // ✨ v4.6: Para imagens, retorna como data URL base64
            if (type === 'image') {
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const fileBuffer = fs.readFileSync(filePath);
                    const base64 = fileBuffer.toString('base64');
                    const ext = path.extname(filePath).toLowerCase().replace('.', '');
                    const mimeTypes = {
                        'png': 'image/png',
                        'jpg': 'image/jpeg',
                        'jpeg': 'image/jpeg',
                        'gif': 'image/gif',
                        'ico': 'image/x-icon',
                        'svg': 'image/svg+xml',
                        'webp': 'image/webp',
                        'bmp': 'image/bmp'
                    };
                    const mimeType = mimeTypes[ext] || 'image/png';
                    const dataUrl = `data:${mimeType};base64,${base64}`;
                    return { success: true, path: dataUrl };
                } catch (imgError) {
                    console.error('❌ Erro ao ler imagem:', imgError);
                    return { success: false, error: 'Não foi possível ler a imagem' };
                }
            }

            return { success: true, path: filePath };
        } catch (error) {
            console.error('❌ Erro ao abrir diálogo:', error);
            return { success: false, error: error.message };
        }
    });

    console.log('✅ App handlers registrados (8 handlers)');
}

module.exports = { registerAppHandlers };
