const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuração
const DOCUMENTS_PATH = path.join(os.homedir(), 'Documents', 'GerenciadorRDP', 'Servidores', 'VNC');
const OUTPUT_FILE = path.join(__dirname, '..', 'vnc_import.json');

console.log('🚀 Iniciando gerador de JSON VNC...');
console.log(`📂 Lendo diretório: ${DOCUMENTS_PATH}`);

function parseVncFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const hostMatch = content.match(/Host=(.*)/);
        const portMatch = content.match(/Port=(.*)/);

        if (!hostMatch) return null;

        let ipAddress = hostMatch[1].trim();
        let port = portMatch ? portMatch[1].trim() : '5900';

        // Lógica de parse aprimorada (igual à do sistema principal)
        if (ipAddress.includes('::')) {
            const parts = ipAddress.split('::');
            ipAddress = parts[0];
            port = parts[1];
        } else if (ipAddress.includes(':') && !ipAddress.split(':')[0].includes('.')) {
            // Caso onde pode ser hostname:porta
            const parts = ipAddress.split(':');
            if (parts.length === 2) {
                ipAddress = parts[0];
                port = parts[1];
            }
        }

        // Remove descrição se houver (ex: HOSTNAME - Descrição)
        if (ipAddress.includes(' - ')) {
            ipAddress = ipAddress.split(' - ')[0].trim();
        }

        return {
            ipAddress,
            port
        };
    } catch (err) {
        console.error(`❌ Erro ao ler ${filePath}: ${err.message}`);
        return null;
    }
}

function scanDirectory() {
    if (!fs.existsSync(DOCUMENTS_PATH)) {
        console.error('❌ Diretório Documents/GerenciadorRDP não encontrado!');
        return [];
    }

    const groups = [];
    const entries = fs.readdirSync(DOCUMENTS_PATH, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const groupName = entry.name;
            // Ignora pastas de sistema ou ocultas se necessário
            if (groupName.startsWith('.')) continue;

            const groupPath = path.join(DOCUMENTS_PATH, groupName);
            const groupFiles = fs.readdirSync(groupPath);
            const connections = [];

            for (const file of groupFiles) {
                if (file.toLowerCase().endsWith('.vnc')) {
                    const filePath = path.join(groupPath, file);
                    const parsed = parseVncFile(filePath);

                    if (parsed) {
                        connections.push({
                            id: Date.now() + Math.random(), // ID temporário
                            name: file.replace('.vnc', ''),
                            ipAddress: parsed.ipAddress,
                            port: parsed.port,
                            protocol: 'vnc'
                        });
                    }
                }
            }

            if (connections.length > 0) {
                groups.push({
                    id: Date.now() + Math.random(),
                    name: groupName,
                    groupName: groupName,
                    connections: connections
                });
                console.log(`✅ Grupo "${groupName}": ${connections.length} conexões encontradas.`);
            }
        }
    }

    return groups;
}

// Execução
try {
    const vncGroups = scanDirectory();

    const output = {
        generatedAt: new Date().toISOString(),
        totalGroups: vncGroups.length,
        totalConnections: vncGroups.reduce((acc, g) => acc + g.connections.length, 0),
        vncGroups: vncGroups
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

    console.log('\n==========================================');
    console.log(`🎉 Sucesso! Arquivo gerado em: ${OUTPUT_FILE}`);
    console.log(`📊 Total: ${output.totalGroups} grupos, ${output.totalConnections} conexões.`);
    console.log('==========================================');
    console.log('👉 Agora você pode verificar este arquivo JSON e importá-lo se estiver correto.');

} catch (error) {
    console.error('❌ Falha fatal:', error);
}
