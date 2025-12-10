// public/ipc/index.js
// Registro central de todos os IPC handlers

const { registerStoreHandlers } = require('./store.handlers');
const { registerDatabaseHandlers } = require('./database.handlers');
const { registerConnectivityHandlers } = require('./connectivity.handlers');
const { registerVncHandlers } = require('./vnc.handlers');
const { registerGuacamoleHandlers } = require('./guacamole.handlers');
const { registerAdHandlers } = require('./ad.handlers');
const { registerBulkHandlers } = require('./bulk.handlers');
const { registerConnectionHandlers } = require('./connection.handlers');
const { registerConfigHandlers } = require('./config.handlers');

/**
 * Registra todos os IPC handlers do Electron
 * @param {Object} deps - Dependências compartilhadas
 * @param {Object} deps.store - Instância do electron-store
 * @param {Object} deps.databaseManager - Gerenciador do banco SQLite
 * @param {Object} deps.fileSystemManager - Gerenciador de arquivos
 * @param {Object} deps.connectivityTester - Testador de conectividade
 * @param {Map} deps.connectivityMonitors - Map de intervalos de monitoramento
 * @param {Object} deps.vncProxyService - Serviço de proxy VNC
 * @param {Object} deps.sanitizeLog - Função para sanitizar logs
 * @param {boolean} deps.isDev - Se está em modo desenvolvimento
 * @param {Function} deps.getMainWindow - Função para obter janela principal
 * @param {Function} deps.getGuacamoleServer - Função para obter servidor Guacamole
 */
function registerAllHandlers(deps) {
    console.log('📡 Registrando IPC handlers...');

    // Store handlers (get-data, set-data, clear-data, sync)
    registerStoreHandlers({
        store: deps.store,
        fileSystemManager: deps.fileSystemManager,
        databaseManager: deps.databaseManager
    });

    // Database handlers (db-*)
    registerDatabaseHandlers({
        databaseManager: deps.databaseManager,
        fileSystemManager: deps.fileSystemManager
    });

    // Connectivity handlers (connectivity-*)
    registerConnectivityHandlers({
        connectivityTester: deps.connectivityTester,
        connectivityMonitors: deps.connectivityMonitors,
        getMainWindow: deps.getMainWindow
    });

    // VNC handlers (connect-vnc, vnc-proxy-*)
    registerVncHandlers({
        vncProxyService: deps.vncProxyService,
        sanitizeLog: deps.sanitizeLog,
        isDev: deps.isDev
    });

    // Guacamole handlers (generate-guacamole-token)
    registerGuacamoleHandlers({
        getGuacamoleServer: deps.getGuacamoleServer
    });

    // AD handlers (ad-search)
    registerAdHandlers();

    // Bulk handlers (bulk-update-password)
    registerBulkHandlers({
        store: deps.store,
        fileSystemManager: deps.fileSystemManager,
        databaseManager: deps.databaseManager
    });

    // Connection handlers (start-connection)
    registerConnectionHandlers({
        connectivityTester: deps.connectivityTester,
        fileSystemManager: deps.fileSystemManager,
        sanitizeLog: deps.sanitizeLog,
        isDev: deps.isDev,
        getMainWindow: deps.getMainWindow
    });

    // Config handlers (get-guacamole-config, set-guacamole-config)
    registerConfigHandlers({
        store: deps.store
    });

    console.log('✅ Todos os IPC handlers registrados (29 handlers em 9 módulos)');
}

module.exports = { registerAllHandlers };
