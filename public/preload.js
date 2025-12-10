// preload.js - VERSÃO MELHORADA COM SISTEMA DE CONECTIVIDADE
// Ponte segura entre Electron e React com APIs de conectividade enterprise

const { contextBridge, ipcRenderer } = require('electron');

// ==========================
// STORAGE API (ORIGINAL MANTIDA)
// ==========================
const storage = {
    get: (key) => ipcRenderer.invoke('get-data', key),
    set: (key, value) => ipcRenderer.send('set-data', key, value)
};

// ==========================
// CONNECTION API (ORIGINAL MELHORADA)
// ==========================
const connection = {
    connect: (serverInfo) => {
        console.log('🔌 Preload: Enviando pedido de conexão', serverInfo);
        ipcRenderer.send('start-connection', serverInfo);
    },
    connectVnc: (connectionInfo) => {
        console.log('🖥️ Preload: Enviando pedido de conexão VNC', connectionInfo);
        return ipcRenderer.invoke('connect-vnc', connectionInfo);
    }
};

// ==========================
// CONNECTIVITY API (NOVA - SISTEMA ENTERPRISE)
// ==========================
const connectivity = {
    // Teste individual de servidor
    testServer: async (serverInfo) => {
        console.log('🧪 Preload: Testando conectividade do servidor', serverInfo);
        return await ipcRenderer.invoke('connectivity-test-server', serverInfo);
    },

    // Teste múltiplos servidores
    testMultiple: async (servers) => {
        console.log(`🔄 Preload: Testando ${servers.length} servidor(es)`);
        return await ipcRenderer.invoke('connectivity-test-multiple', servers);
    },

    // Monitoramento contínuo
    startMonitoring: (serverInfo, interval = 30000) => {
        console.log('📡 Preload: Iniciando monitoramento para', serverInfo.name);
        ipcRenderer.send('connectivity-start-monitoring', serverInfo, interval);
    },

    stopMonitoring: (serverKey) => {
        console.log('⏹️ Preload: Parando monitoramento para', serverKey);
        ipcRenderer.send('connectivity-stop-monitoring', serverKey);
    },

    stopAllMonitoring: () => {
        console.log('⏹️ Preload: Parando todo monitoramento');
        ipcRenderer.send('connectivity-stop-all-monitoring');
    },

    // Gerenciamento de cache
    clearCache: () => {
        console.log('🧹 Preload: Limpando cache de conectividade');
        ipcRenderer.send('connectivity-clear-cache');
    },

    // Estatísticas
    getStats: async () => {
        return await ipcRenderer.invoke('connectivity-get-stats');
    }
};

// ==========================
// EVENT LISTENERS (ORIGINAIS + NOVOS)
// ==========================

// Listener original para status de conexão
const onConnectionStatus = (callback) => {
    ipcRenderer.on('connection-status-update', (event, serverId, status) => {
        console.log(`📡 Preload: Status de conexão atualizado - ${serverId}: ${status}`);
        callback(serverId, status);
    });
};

// Listener para dados iniciais
const onInitialDataLoaded = (callback) => {
    ipcRenderer.on('initial-data-loaded', (event, data) => {
        console.log('📦 Preload: Dados iniciais recebidos');
        callback(data);
    });
};

// ==========================
// NOVOS EVENT LISTENERS PARA CONECTIVIDADE
// ==========================

// Listener para atualizações de status de conectividade
const onConnectivityStatusUpdate = (callback) => {
    ipcRenderer.on('connectivity-status-update', (event, serverKey, result) => {
        console.log(`🔌 Preload: Status de conectividade atualizado - ${serverKey}:`, result.status);
        callback(serverKey, result);
    });
};

// Listener para início de teste
const onConnectivityTestStart = (callback) => {
    ipcRenderer.on('connectivity-test-start', (event, serverKey, serverInfo) => {
        console.log(`🧪 Preload: Teste de conectividade iniciado - ${serverKey}`);
        callback(serverKey, serverInfo);
    });
};

// Listener para conclusão de teste
const onConnectivityTestComplete = (callback) => {
    ipcRenderer.on('connectivity-test-complete', (event, serverKey, result) => {
        console.log(`✅ Preload: Teste de conectividade concluído - ${serverKey}: ${result.status}`);
        callback(serverKey, result);
    });
};

// Listener para mudanças de monitoramento
const onConnectivityMonitoringChange = (callback) => {
    ipcRenderer.on('connectivity-monitoring-change', (event, action, serverKey, data) => {
        console.log(`📡 Preload: Monitoramento ${action} - ${serverKey}`);
        callback(action, serverKey, data);
    });
};

// Listener para erros de conectividade
const onConnectivityError = (callback) => {
    ipcRenderer.on('connectivity-error', (event, serverKey, error) => {
        console.error(`❌ Preload: Erro de conectividade - ${serverKey}:`, error);
        callback(serverKey, error);
    });
};

// ==========================
// CLEAR DATA API (ORIGINAL MANTIDA)
// ==========================
const clearData = () => {
    console.log('🗑️ Preload: Limpando todos os dados');
    ipcRenderer.send('clear-data-request');
};

// ==========================
// VALIDAÇÃO E LOGS DE INICIALIZAÇÃO
// ==========================
console.log('🚀 Preload carregado com sistema de conectividade enterprise');
console.log('📡 APIs disponíveis:');
console.log('   • storage (get, set)');
console.log('   • connection (connect)');
console.log('   • connectivity (testServer, testMultiple, monitoring, cache, stats)');
console.log('   • event listeners (status updates, monitoring, errors)');
console.log('   • clearData (limpar dados)');

// Validação das dependências
if (!ipcRenderer) {
    console.error('❌ Preload: ipcRenderer não disponível');
}

if (!contextBridge) {
    console.error('❌ Preload: contextBridge não disponível');
}

// ==========================
// EXPOSIÇÃO SEGURA DAS APIs VIA CONTEXT BRIDGE
// ==========================
// src/preload.js

try {
    contextBridge.exposeInMainWorld('api', {
        // APIs originais
        storage,
        connection,
        clearData,
        onConnectionStatus,
        onInitialDataLoaded, // ADICIONADO: Listener de dados iniciais
        adSearch: (params) => ipcRenderer.invoke('ad-search', params), // ADICIONADO: Busca AD direta
        bulkUpdatePassword: (data) => ipcRenderer.invoke('bulk-update-password', data), // ADICIONADO: Atualização em massa

        // <-- ADICIONE ESTE NOVO OBJETO PARA VNC -->
        vnc: {
            startProxy: (connectionInfo) => ipcRenderer.invoke('vnc-proxy-start', connectionInfo),
            stopProxy: (serverId) => ipcRenderer.invoke('vnc-proxy-stop', serverId),
        },

        // API Guacamole (RDP/SSH/VNC integrado)
        guacamole: {
            generateToken: (connectionInfo) => ipcRenderer.invoke('generate-guacamole-token', connectionInfo),
        },

        // API Config (configuração do servidor Guacamole)
        config: {
            getGuacamole: () => ipcRenderer.invoke('get-guacamole-config'),
            setGuacamole: (config) => ipcRenderer.invoke('set-guacamole-config', config),
            isGuacamoleConfigured: () => ipcRenderer.invoke('is-guacamole-configured'),
        },

        // ==========================
        // API SQLite (CRUD PONTUAL - PERFORMANCE!)
        // ==========================
        db: {
            // Grupos
            getGroups: (type) => ipcRenderer.invoke('db-get-groups', type),
            addGroup: (name, type) => ipcRenderer.invoke('db-add-group', { name, type }),
            updateGroup: (groupId, name) => ipcRenderer.invoke('db-update-group', { groupId, name }),
            deleteGroup: (groupId) => ipcRenderer.invoke('db-delete-group', groupId),

            // Conexões (OPERAÇÕES PONTUAIS!)
            addConnection: (groupId, connectionData) => ipcRenderer.invoke('db-add-connection', { groupId, connectionData }),
            updateConnection: (connectionId, updatedData) => ipcRenderer.invoke('db-update-connection', { connectionId, updatedData }),
            deleteConnection: (connectionId) => ipcRenderer.invoke('db-delete-connection', connectionId),

            // Busca e estatísticas
            searchConnections: (term, protocol) => ipcRenderer.invoke('db-search-connections', { term, protocol }),
            getStats: () => ipcRenderer.invoke('db-get-stats'),

            // Sincronização
            forceSync: () => ipcRenderer.invoke('force-sync-from-disk'),
            getLastSyncTime: () => ipcRenderer.invoke('get-last-sync-time'),
        },

        // Novas APIs de conectividade
        connectivity,

        // Novos event listeners
        onConnectivityStatusUpdate,
        onConnectivityTestStart,
        onConnectivityTestComplete,
        onConnectivityMonitoringChange,
        onConnectivityError
    });

    console.log('✅ Preload: APIs expostas com segurança via contextBridge');
    console.log('🔒 Preload: contextIsolation ativo e funcionando');

} catch (error) {
    console.error('❌ Preload: Erro ao expor APIs:', error);
}

// ==========================
// CLEANUP E GESTÃO DE RECURSOS
// ==========================

// Limpeza automática ao fechar
window.addEventListener('beforeunload', () => {
    console.log('🧹 Preload: Executando limpeza antes de fechar');

    // Para todo monitoramento ativo
    connectivity.stopAllMonitoring();

    // Remove todos os listeners
    ipcRenderer.removeAllListeners('connectivity-status-update');
    ipcRenderer.removeAllListeners('connectivity-test-start');
    ipcRenderer.removeAllListeners('connectivity-test-complete');
    ipcRenderer.removeAllListeners('connectivity-monitoring-change');
    ipcRenderer.removeAllListeners('connectivity-error');

    console.log('✅ Preload: Limpeza concluída');
});

// ==========================
// HEARTBEAT E VALIDAÇÃO CONTÍNUA
// ==========================

// Validação periódica da conexão IPC (a cada 30 segundos)
setInterval(() => {
    try {
        // Testa se a comunicação IPC ainda está ativa
        connectivity.getStats().then(stats => {
            console.log(`💓 Preload: Heartbeat OK - ${stats.size} resultados em cache`);
        }).catch(error => {
            console.warn('⚠️ Preload: Heartbeat falhou:', error);
        });
    } catch (error) {
        console.error('❌ Preload: Erro no heartbeat:', error);
    }
}, 30000);

// ==========================
// VERSIONAMENTO E INFORMAÇÕES DO SISTEMA
// ==========================
const PRELOAD_VERSION = '4.2.0';
const CONNECTIVITY_FEATURES = [
    'server-testing',
    'batch-testing',
    'continuous-monitoring',
    'cache-management',
    'statistics-reporting',
    'event-driven-updates'
];

console.log(`📋 Preload versão: ${PRELOAD_VERSION}`);
console.log(`🔧 Recursos de conectividade: ${CONNECTIVITY_FEATURES.join(', ')}`);
console.log('🎯 Sistema enterprise de conectividade carregado com sucesso!');

// Expõe informações do sistema para debug
if (process.env.NODE_ENV === 'development') {
    try {
        contextBridge.exposeInMainWorld('preloadInfo', {
            version: PRELOAD_VERSION,
            features: CONNECTIVITY_FEATURES,
            timestamp: Date.now()
        });
        console.log('🐛 Preload: Informações de debug expostas (modo desenvolvimento)');
    } catch (error) {
        console.warn('⚠️ Preload: Não foi possível expor informações de debug:', error);
    }
}