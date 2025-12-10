/**
 * server.js
 * Servidor guacamole-lite para Docker
 * Recebe conexões WebSocket do app Electron e encaminha para guacd
 */

const GuacamoleLite = require('guacamole-lite');

// Configuração via variáveis de ambiente
const PORT = process.env.PORT || 8080;
const GUACD_HOST = process.env.GUACD_HOST || 'guacd';
const GUACD_PORT = parseInt(process.env.GUACD_PORT || '4822');
const SECRET_KEY = process.env.SECRET_KEY || 'GerenciadorRDPv2SecretKey123456!';

console.log('🚀 Iniciando guacamole-lite server...');
console.log(`   WebSocket: ws://0.0.0.0:${PORT}`);
console.log(`   guacd: ${GUACD_HOST}:${GUACD_PORT}`);
console.log(`   Secret key length: ${SECRET_KEY.length}`);

// Opções do WebSocket
const websocketOptions = {
    port: PORT
};

// Opções de conexão com guacd
const guacdOptions = {
    host: GUACD_HOST,
    port: GUACD_PORT
};

// Opções do cliente (criptografia)
const clientOptions = {
    log: {
        level: 'VERBOSE'
    },
    crypt: {
        cypher: 'AES-256-CBC',
        key: SECRET_KEY
    }
};

try {
    const server = new GuacamoleLite(
        websocketOptions,
        guacdOptions,
        clientOptions
    );

    console.log('✅ guacamole-lite server iniciado com sucesso!');
    console.log('📡 Aguardando conexões WebSocket...');

} catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM, encerrando...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Recebido SIGINT, encerrando...');
    process.exit(0);
});
