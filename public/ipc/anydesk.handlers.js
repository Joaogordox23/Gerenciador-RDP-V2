// public/ipc/anydesk.handlers.js
// Handlers IPC para conexões AnyDesk

const { ipcMain, shell } = require('electron');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Caminhos possíveis do AnyDesk
const ANYDESK_PATHS = [
    'C:\\Program Files (x86)\\AnyDesk\\AnyDesk.exe',
    'C:\\Program Files\\AnyDesk\\AnyDesk.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'AnyDesk', 'AnyDesk.exe'),
    path.join(process.env.APPDATA || '', 'AnyDesk', 'AnyDesk.exe'),
];

let anydeskPath = null;

// Encontra o caminho do AnyDesk instalado
function findAnyDeskPath() {
    if (anydeskPath) return anydeskPath;

    for (const p of ANYDESK_PATHS) {
        if (fs.existsSync(p)) {
            anydeskPath = p;
            console.log(`✅ AnyDesk encontrado em: ${p}`);
            return p;
        }
    }

    console.warn('⚠️ AnyDesk não encontrado nos caminhos padrão');
    return null;
}

function registerAnyDeskHandlers() {
    // Verificar se AnyDesk está instalado
    ipcMain.handle('anydesk-check-installed', async () => {
        const path = findAnyDeskPath();
        return {
            installed: path !== null,
            path: path
        };
    });

    // Conectar a um ID AnyDesk
    ipcMain.handle('anydesk-connect', async (event, { anydeskId, password }) => {
        try {
            const exePath = findAnyDeskPath();

            if (!exePath) {
                // Tenta usar o protocolo anydesk:
                console.log(`🔗 Tentando protocolo anydesk: ${anydeskId}`);
                await shell.openExternal(`anydesk:${anydeskId.replace(/\s/g, '')}`);
                return { success: true, method: 'protocol' };
            }

            // Normaliza o ID (remove espaços)
            const cleanId = anydeskId.replace(/\s/g, '');

            console.log(`🔗 Conectando AnyDesk: ${cleanId}`);

            // Argumentos para o AnyDesk
            const args = [cleanId];

            // Se tiver senha, adiciona o argumento
            if (password) {
                args.push('--with-password');
                // A senha é passada via stdin para segurança
            }

            // Inicia o processo AnyDesk
            const child = spawn(exePath, args, {
                detached: true,
                stdio: password ? ['pipe', 'ignore', 'ignore'] : 'ignore'
            });

            // Se tiver senha, envia via stdin
            if (password && child.stdin) {
                child.stdin.write(password);
                child.stdin.end();
            }

            child.unref();

            return { success: true, method: 'executable', pid: child.pid };
        } catch (error) {
            console.error('❌ Erro ao conectar AnyDesk:', error);
            return { success: false, error: error.message };
        }
    });

    // Obter ID local do AnyDesk (se disponível)
    ipcMain.handle('anydesk-get-local-id', async () => {
        try {
            const exePath = findAnyDeskPath();
            if (!exePath) return { success: false, error: 'AnyDesk não instalado' };

            return new Promise((resolve) => {
                exec(`"${exePath}" --get-id`, { timeout: 5000 }, (error, stdout, stderr) => {
                    if (error) {
                        resolve({ success: false, error: error.message });
                    } else {
                        const id = stdout.trim();
                        resolve({ success: true, id });
                    }
                });
            });
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    console.log('📦 AnyDesk handlers registrados');
}

module.exports = { registerAnyDeskHandlers };
