// public/ipc/connection.handlers.js
// Handlers IPC para conexões RDP/SSH nativas

const { ipcMain, safeStorage, dialog, Notification } = require('electron');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Registra handlers IPC para conexões RDP/SSH nativas
 * @param {Object} deps - Dependências injetadas
 * @param {Object} deps.connectivityTester - Testador de conectividade
 * @param {Object} deps.fileSystemManager - Gerenciador de arquivos
 * @param {Object} deps.sanitizeLog - Função para sanitizar logs
 * @param {boolean} deps.isDev - Se está em modo desenvolvimento
 * @param {Function} deps.getMainWindow - Função para obter janela principal
 */
function registerConnectionHandlers({ connectivityTester, fileSystemManager, sanitizeLog, isDev, getMainWindow }) {

    // ==========================
    // CONEXÃO RDP/SSH NATIVA
    // ==========================
    ipcMain.on('start-connection', async (event, serverInfo) => {
        const mainWindow = getMainWindow();
        const protocol = serverInfo.protocol || 'rdp';
        console.log(`🔗 Pedido de conexão [${protocol.toUpperCase()}] recebido:`, sanitizeLog(serverInfo));

        // Teste prévio de conectividade
        const continueConnection = await testConnectivityBeforeConnect(serverInfo, mainWindow, connectivityTester);
        if (!continueConnection) return;

        // Notificação de início
        showConnectionNotification(serverInfo, protocol);

        // Lógica de conexão baseada no protocolo
        if (protocol === 'ssh') {
            handleSshConnection(serverInfo, isDev, mainWindow);
        } else if (protocol === 'rdp') {
            handleRdpConnection(serverInfo, isDev, mainWindow, fileSystemManager);
        }
    });

    console.log('✅ Connection handlers registrados (1 handler)');
}

/**
 * Testa conectividade antes de iniciar conexão
 */
async function testConnectivityBeforeConnect(serverInfo, mainWindow, connectivityTester) {
    try {
        console.log('🧪 Executando teste prévio de conectividade...');
        const quickTest = await connectivityTester.testServerConnectivity(serverInfo);

        if (quickTest.status === 'offline') {
            dialog.showErrorBox(
                'Servidor Inacessível',
                `O servidor ${serverInfo.name} não está acessível no momento.\n\nDetalhes: ${quickTest.message}\n\nVerifique a conectividade antes de tentar conectar.`
            );
            return false;
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
                return false;
            }
        }

        if (quickTest.status === 'online' && quickTest.tests?.tcpLatency?.average) {
            console.log(`✅ Conectividade confirmada. Latência: ${quickTest.tests.tcpLatency.average}ms`);
        }

        return true;
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

        return response === 1;
    }
}

/**
 * Exibe notificação de início de conexão
 */
function showConnectionNotification(serverInfo, protocol) {
    if (Notification.isSupported()) {
        const notification = new Notification({
            title: 'Gerenciador de Conexões',
            body: `Iniciando conexão ${protocol.toUpperCase()} com o servidor: ${serverInfo.name}`,
        });
        notification.show();
    }
}

/**
 * Inicia conexão SSH via PuTTY
 */
function handleSshConnection(serverInfo, isDev, mainWindow) {
    if (!serverInfo.ipAddress || !serverInfo.username) {
        dialog.showErrorBox('Erro de Conexão', 'Endereço de IP e Usuário são obrigatórios para SSH.');
        return;
    }

    const puttyPath = isDev
        ? path.join(__dirname, '..', 'assets', 'putty.exe')
        : path.join(process.resourcesPath, 'assets', 'putty.exe');

    const port = serverInfo.port || '22';
    let sshCommand = `"${puttyPath}" -ssh ${serverInfo.username}@${serverInfo.ipAddress} -P ${port}`;

    // Descriptografar senha
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
}

/**
 * Inicia conexão RDP via MSTSC
 */
function handleRdpConnection(serverInfo, isDev, mainWindow, fileSystemManager) {
    // Descriptografar senha
    let plainTextPassword = '';
    if (serverInfo.password) {
        try {
            const encryptedBuffer = Buffer.from(serverInfo.password, 'base64');
            plainTextPassword = safeStorage.decryptString(encryptedBuffer);
            console.log('🔓 Senha RDP descriptografada com sucesso.');
        } catch (error) {
            console.warn('⚠️ Falha ao descriptografar senha RDP:', error.message);
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
    // O username para cmdkey deve incluir o domínio se houver
    const fullUsername = serverInfo.domain
        ? `${serverInfo.domain}\\${serverInfo.username}`
        : serverInfo.username;

    // Target para cmdkey - formato TERMSRV/hostname é obrigatório para RDP
    const target = `TERMSRV/${serverInfo.ipAddress}`;

    console.log(`🔐 Preparando conexão RDP:`);
    console.log(`   - Target: ${target}`);
    console.log(`   - Usuário: ${fullUsername}`);
    console.log(`   - IP: ${serverInfo.ipAddress}`);
    console.log(`   - Senha: ${'*'.repeat(plainTextPassword.length)}`);

    // Primeiro, remove qualquer credencial existente para evitar conflitos
    const deleteExisting = spawn('cmdkey', ['/delete:' + target]);

    deleteExisting.on('close', (deleteCode) => {
        if (deleteCode === 0) {
            console.log('🧹 Credencial anterior removida.');
        }

        // Agora adiciona a nova credencial
        // IMPORTANTE: Sempre usar /add: para credenciais de RDP (TERMSRV)
        const cmdkeyArgs = ['/add:' + target, '/user:' + fullUsername, '/pass:' + plainTextPassword];

        console.log(`🔧 Executando: cmdkey /add:${target} /user:${fullUsername} /pass:***`);

        const addKey = spawn('cmdkey', cmdkeyArgs);

        let cmdkeyOutput = '';
        let cmdkeyError = '';

        addKey.stdout.on('data', (data) => {
            cmdkeyOutput += data.toString();
        });

        addKey.stderr.on('data', (data) => {
            cmdkeyError += data.toString();
        });

        addKey.on('close', (code) => {
            console.log(`📋 cmdkey stdout: ${cmdkeyOutput.trim()}`);

            if (code !== 0 || cmdkeyError) {
                console.error(`❌ cmdkey falhou com código ${code}`);
                console.error(`❌ cmdkey stderr: ${cmdkeyError}`);
                dialog.showErrorBox('Erro de Credencial',
                    `Não foi possível salvar a credencial temporária.\n\nErro: ${cmdkeyError || 'Código ' + code}`);
                return;
            }

            console.log(`✅ Credencial RDP adicionada com sucesso (cmdkey).`);

            if (mainWindow) {
                mainWindow.webContents.send('connection-status-update', serverInfo.id, 'active');
            }

            // Pequeno delay para garantir que o Windows Credential Manager processou a credencial
            setTimeout(() => {
                // Obtém ou cria o arquivo RDP
                const rdpFilePath = fileSystemManager.getFilePath(serverInfo);

                if (!fs.existsSync(rdpFilePath)) {
                    console.log(`⚠️ Arquivo RDP não encontrado. Recriando...`);
                    fileSystemManager.saveConnectionFile(serverInfo);
                }

                console.log(`📄 Usando arquivo RDP: ${rdpFilePath}`);

                // Inicia MSTSC com o arquivo RDP
                const mstsc = spawn('mstsc.exe', [rdpFilePath]);

                mstsc.on('close', (mstscCode) => {
                    console.log(`🏁 Sessão RDP finalizada (código ${mstscCode}).`);

                    if (mainWindow) {
                        mainWindow.webContents.send('connection-status-update', serverInfo.id, 'inactive');
                    }

                    // Limpa credenciais após a sessão
                    const deleteKey = spawn('cmdkey', ['/delete:' + target]);
                    deleteKey.on('close', () => {
                        console.log('🧹 Credencial RDP limpa com sucesso.');
                    });
                });
            }, 500); // Delay de 500ms para garantir que a credencial foi salva
        });
    });
}

module.exports = { registerConnectionHandlers };
