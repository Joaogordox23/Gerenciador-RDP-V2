const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class FileSystemManager {
    constructor() {
        // Define a pasta raiz em Meus Documentos/GerenciadorRDP
        this.rootDir = path.join(app.getPath('documents'), 'GerenciadorRDP');
        this.serversDir = path.join(this.rootDir, 'Servidores');

        // Estrutura de pastas por protocolo
        this.protocolDirs = {
            rdp: path.join(this.serversDir, 'RDP'),
            ssh: path.join(this.serversDir, 'SSH'),
            vnc: path.join(this.serversDir, 'VNC')
        };

        this.logFile = path.join(this.rootDir, 'debug_fs.log');
    }

    logToFile(message) {
        try {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] ${message}\n`;
            fs.appendFileSync(this.logFile, logMessage);
        } catch (e) {
            // Ignora erro de log
        }
    }

    /**
     * Garante que a estrutura de diretórios exista.
     */
    ensureDirectories() {
        try {
            if (!fs.existsSync(this.rootDir)) fs.mkdirSync(this.rootDir);
            if (!fs.existsSync(this.serversDir)) fs.mkdirSync(this.serversDir);

            Object.values(this.protocolDirs).forEach(dir => {
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
            });

            console.log('✅ Estrutura de diretórios verificada em:', this.rootDir);
            this.logToFile(`Estrutura de diretórios verificada em: ${this.rootDir}`);
        } catch (error) {
            console.error('❌ Erro ao criar diretórios:', error);
            this.logToFile(`Erro ao criar diretórios: ${error.message}`);
        }
    }

    /**
     * Sanitiza nomes de arquivos para evitar caracteres inválidos.
     * Remove apenas caracteres proibidos no Windows: < > : " / \ | ? *
     */
    sanitizeFileName(name) {
        if (!name) return '';
        // Remove caracteres proibidos e quebras de linha
        return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim();
    }

    /**
     * ✅ OTIMIZAÇÃO: Verifica se o conteúdo do arquivo mudou antes de escrever
     * Evita escritas desnecessárias quando o conteúdo é idêntico
     */
    _hasContentChanged(filePath, newContent) {
        try {
            if (!fs.existsSync(filePath)) return true;
            const existingContent = fs.readFileSync(filePath, 'utf8');
            return existingContent !== newContent;
        } catch (error) {
            // Em caso de erro, assume que mudou para garantir escrita
            return true;
        }
    }

    /**
     * Salva um arquivo de conexão baseado no servidor.
     * @param {Object} server Objeto do servidor
     */
    saveConnectionFile(server) {
        if (!server || !server.name || !server.protocol) {
            this.logToFile(`Tentativa de salvar servidor inválido: ${JSON.stringify(server)}`);
            return;
        }

        const protocol = server.protocol.toLowerCase();
        const groupName = this.sanitizeFileName(server.groupName || 'Sem Grupo');
        const serverName = this.sanitizeFileName(server.name);

        this.logToFile(`Salvando arquivo para: ${server.name} (Grupo: ${groupName}, Protocolo: ${protocol})`);

        // Define o diretório do grupo dentro do protocolo
        const groupDir = path.join(this.protocolDirs[protocol] || this.protocolDirs.rdp, groupName);

        // Cria a pasta do grupo se não existir
        if (!fs.existsSync(groupDir)) {
            try {
                fs.mkdirSync(groupDir, { recursive: true });
                this.logToFile(`Diretório criado: ${groupDir}`);
            } catch (err) {
                this.logToFile(`Erro ao criar diretório ${groupDir}: ${err.message}`);
            }
        }

        try {
            switch (protocol) {
                case 'rdp':
                    this._createRdpFile(groupDir, serverName, server);
                    break;
                case 'ssh':
                    this._createSshFile(groupDir, serverName, server);
                    break;
                case 'vnc':
                    this._createVncFile(groupDir, serverName, server);
                    break;
            }
            console.log(`💾 Arquivo de conexão salvo para: ${server.name} (${protocol})`);
            this.logToFile(`Arquivo salvo com sucesso: ${serverName} em ${groupDir}`);
        } catch (error) {
            console.error(`❌ Erro ao salvar arquivo para ${server.name}:`, error);
            this.logToFile(`Erro ao salvar arquivo: ${error.message}`);
        }
    }

    /**
     * Remove o arquivo de conexão.
     */
    deleteConnectionFile(server) {
        if (!server) return;

        const protocol = server.protocol.toLowerCase();
        const groupName = this.sanitizeFileName(server.groupName || 'Sem Grupo');
        const serverName = this.sanitizeFileName(server.name);
        const groupDir = path.join(this.protocolDirs[protocol] || this.protocolDirs.rdp, groupName);

        let extension = '';
        if (protocol === 'rdp') extension = '.rdp';
        else if (protocol === 'ssh') extension = '.bat';
        else if (protocol === 'vnc') extension = '.vnc';

        const filePath = path.join(groupDir, `${serverName}${extension}`);

        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Arquivo removido: ${filePath}`);

                // Remove a pasta do grupo se estiver vazia
                if (fs.readdirSync(groupDir).length === 0) {
                    fs.rmdirSync(groupDir);
                }
            } catch (error) {
                console.error(`❌ Erro ao remover arquivo ${filePath}:`, error);
            }
        }
    }

    /**
     * Remove um grupo inteiro e seus arquivos.
     */
    deleteGroup(groupName, protocol) {
        if (!groupName || !protocol) return;

        const safeGroupName = this.sanitizeFileName(groupName);
        const protocolDir = this.protocolDirs[protocol.toLowerCase()];

        if (!protocolDir) return;

        const groupDir = path.join(protocolDir, safeGroupName);

        if (fs.existsSync(groupDir)) {
            try {
                fs.rmSync(groupDir, { recursive: true, force: true });
                console.log(`🗑️ Grupo removido: ${groupDir}`);
                this.logToFile(`Grupo removido: ${groupDir}`);
            } catch (error) {
                console.error(`❌ Erro ao remover grupo ${groupDir}:`, error);
                this.logToFile(`Erro ao remover grupo ${groupDir}: ${error.message}`);
            }
        }
    }

    /**
     * Cria arquivo .rdp
     */
    _createRdpFile(dir, name, server) {
        const filePath = path.join(dir, `${name}.rdp`);
        const fullUsername = server.domain ? `${server.domain}\\${server.username}` : server.username;

        const content = [
            'screen mode id:i:2',
            `full address:s:${server.ipAddress}${server.port ? ':' + server.port : ''}`,
            `username:s:${fullUsername || ''}`,
            'prompt for credentials:i:0', // Pede credenciais se não tiver salvo no Windows
            'authentication level:i:2',
            'enablecredsspsupport:i:1',
            'displayconnectionbar:i:1',
            'negotiate security layer:i:1',
            'redirectclipboard:i:1',
            'redirectprinters:i:0',
            'redirectcomports:i:0',
            'redirectsmartcards:i:0',
            'redirectposdevices:i:0',
            'drivestoredirect:s:*',
            'autoreconnection enabled:i:1'
        ].join('\r\n');

        // ✅ OTIMIZAÇÃO: Só escreve se o conteúdo mudou
        if (this._hasContentChanged(filePath, content)) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`⚡ Arquivo RDP atualizado: ${name}.rdp`);
        } else {
            console.log(`⏭️ Arquivo RDP inalterado: ${name}.rdp`);
        }
    }

    /**
 * Cria arquivo .vnc
 * ✅ v5.11: Corrigido para incluir senha no arquivo
 */
    _createVncFile(dir, name, server) {
        const filePath = path.join(dir, `${name}.vnc`);

        // ✅ CORREÇÃO: Incluir a senha no arquivo .vnc
        // A senha já vem criptografada (base64) do banco de dados
        const password = server.password || '';

        const content = `[Connection]\r\nHost=${server.ipAddress}\r\nPort=${server.port || 5900}\r\nPassword=${password}\r\n`;

        // ✅ OTIMIZAÇÃO: Só escreve se o conteúdo mudou
        if (this._hasContentChanged(filePath, content)) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`⚡ Arquivo VNC atualizado: ${name}.vnc`);
        } else {
            console.log(`⏭️ Arquivo VNC inalterado: ${name}.vnc`);
        }
    }

    /**
     * Cria arquivo .ssh (configuração de referência para conexões SSH)
     * Nota: O SSH nativo usa xterm.js + ssh2, não precisa de arquivo para executar,
     * mas criamos um arquivo de referência para backup/documentação.
     */
    _createSshFile(dir, name, server) {
        const filePath = path.join(dir, `${name}.ssh`);
        const content = [
            `# SSH Connection: ${name}`,
            `Host=${server.ipAddress}`,
            `Port=${server.port || 22}`,
            `Username=${server.username || ''}`,
            `# Password is stored encrypted in database`,
            `# Created by Gerenciador RDP v4`
        ].join('\r\n');

        // ✅ OTIMIZAÇÃO: Só escreve se o conteúdo mudou
        if (this._hasContentChanged(filePath, content)) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`⚡ Arquivo SSH atualizado: ${name}.ssh`);
        } else {
            console.log(`⏭️ Arquivo SSH inalterado: ${name}.ssh`);
        }
    }

    /**
     * Escaneia recursivamente o diretório raiz e retorna uma lista de todos os servidores encontrados.
     */
    scanServers() {
        const foundServers = [];
        this.logToFile(`Iniciando scanServers em: ${this.rootDir}`);

        const scanDir = (directory) => {
            try {
                const files = fs.readdirSync(directory, { withFileTypes: true });

                files.forEach(entry => {
                    const fullPath = path.join(directory, entry.name);

                    if (entry.isDirectory()) {
                        scanDir(fullPath);
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name).toLowerCase();
                        const name = path.basename(entry.name, ext);
                        const groupName = path.basename(path.dirname(fullPath));

                        // Log para arquivos VNC especificamente para debug
                        if (ext === '.vnc') {
                            this.logToFile(`Arquivo VNC encontrado: ${entry.name} em ${groupName}`);
                        }

                        let protocol = null;
                        let serverData = null;

                        try {
                            if (ext === '.rdp') {
                                protocol = 'rdp';
                                serverData = this._parseRdpFile(fullPath);
                            } else if (ext === '.bat') {
                                const content = fs.readFileSync(fullPath, 'utf8');
                                if (content.includes('putty') || content.includes('ssh')) {
                                    protocol = 'ssh';
                                    serverData = this._parseSshFile(fullPath);
                                }
                            } else if (ext === '.vnc') {
                                protocol = 'vnc';
                                serverData = this._parseVncFile(fullPath);
                                if (!serverData) {
                                    this.logToFile(`Falha ao parsear VNC (retornou null): ${fullPath}`);
                                }
                            }

                            if (serverData && protocol) {
                                foundServers.push({
                                    id: Date.now() + Math.random(),
                                    ...serverData,
                                    name: name,
                                    groupName: groupName,
                                    protocol: protocol,
                                    filePath: fullPath // ADICIONADO: Caminho absoluto para validação
                                });
                            }
                        } catch (err) {
                            this.logToFile(`Erro ao processar arquivo ${entry.name}: ${err.message}`);
                        }
                    }
                });
            } catch (err) {
                this.logToFile(`Erro ao ler diretório ${directory}: ${err.message}`);
            }
        };

        if (fs.existsSync(this.rootDir)) {
            scanDir(this.rootDir);
        } else {
            this.logToFile(`Diretório raiz não existe: ${this.rootDir}`);
        }

        this.logToFile(`Scan concluído. Encontrados: ${foundServers.length} servidores.`);
        return foundServers;
    }

    _parseRdpFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split(/\r?\n/);

        const addressLine = lines.find(l => l.includes('full address:s:'));
        const userLine = lines.find(l => l.includes('username:s:'));

        if (!addressLine) return null;

        const rawAddress = addressLine.split('full address:s:')[1].trim();

        let ipAddress = rawAddress;
        let port = '';

        if (rawAddress.includes(':')) {
            const parts = rawAddress.split(':');
            port = parts.pop();
            ipAddress = parts.join(':');
        }

        const username = userLine ? userLine.split('username:s:')[1].trim() : '';

        return { ipAddress, port, username };
    }

    _parseVncFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const hostMatch = content.match(/Host=(.*)/);
            const portMatch = content.match(/Port=(.*)/);

            if (!hostMatch) {
                this.logToFile(`Arquivo VNC sem campo Host: ${filePath}`);
                return null;
            }

            let hostValue = hostMatch[1].trim();
            let ipAddress = '';
            let port = portMatch ? portMatch[1].trim() : '5900';

            // Formato: Host=hostname::port ou Host=hostname::port - description
            if (hostValue.includes('::')) {
                const parts = hostValue.split('::');
                ipAddress = parts[0].trim();

                // A porta pode ter sufixo como " - description", então pegamos apenas os dígitos
                const portPart = parts[1].trim();
                const portDigits = portPart.split(/\s/)[0]; // Pega primeiro token antes de espaço
                port = portDigits;
            }
            // Formato alternativo: Host=hostname:port (single colon)
            else if (hostValue.includes(':') && !hostValue.includes('.')) {
                const parts = hostValue.split(':');
                if (parts.length === 2) {
                    ipAddress = parts[0].trim();
                    port = parts[1].trim();
                }
            }
            // Formato simples: Host=hostname ou Host=ipaddress
            else {
                ipAddress = hostValue;
            }

            if (!ipAddress) {
                this.logToFile(`Não foi possível extrair IP/hostname de: ${hostValue}`);
                return null;
            }

            this.logToFile(`VNC parseado com sucesso: ${ipAddress}:${port} (arquivo: ${path.basename(filePath)})`);

            return {
                ipAddress,
                port
            };
        } catch (err) {
            this.logToFile(`Erro ao parsear VNC ${filePath}: ${err.message}`);
            return null;
        }
    }

    _parseSshFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const sshMatch = content.match(/-ssh\s+([^\s]+)/);
        const portMatch = content.match(/-P\s+(\d+)/);

        if (!sshMatch) return null;

        let userAtHost = sshMatch[1];
        let username = '';
        let ipAddress = userAtHost;

        if (userAtHost.includes('@')) {
            [username, ipAddress] = userAtHost.split('@');
        }

        return {
            ipAddress,
            username,
            port: portMatch ? portMatch[1] : '22'
        };
    }

    /**
     * Retorna o caminho absoluto do arquivo para execução
     */
    getFilePath(server) {
        const protocol = server.protocol.toLowerCase();
        const groupName = this.sanitizeFileName(server.groupName || 'Sem Grupo');
        const serverName = this.sanitizeFileName(server.name);
        const groupDir = path.join(this.protocolDirs[protocol] || this.protocolDirs.rdp, groupName);

        let extension = '';
        if (protocol === 'rdp') extension = '.rdp';
        else if (protocol === 'ssh') extension = '.bat';
        else if (protocol === 'vnc') extension = '.vnc';

        return path.join(groupDir, `${serverName}${extension}`);
    }
}

module.exports = new FileSystemManager();
