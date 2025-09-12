// src/hooks/useConnectivity.js - HOOK MINIMALISTA ULTRA-SEGURO
// Versão simplificada que NÃO causa loops infinitos

import { useState, useCallback } from 'react';

/**
 * Hook personalizado MINIMALISTA para conectividade
 * @param {Object} options - Opções de configuração
 * @returns {Object} - Estado e funções básicas de conectividade
 */
function useConnectivity(options = {}) {
    // Estados básicos (sem Maps complexos que causam loops)
    const [isTestingMultiple, setIsTestingMultiple] = useState(false);
    const [lastTestTime, setLastTestTime] = useState(null);
    const [isConnectivityEnabled, setIsConnectivityEnabled] = useState(true);

    // Estados simples para resultados (sem Map que causa loops)
    const [connectivityResults, setConnectivityResults] = useState({});
    const [monitoredServers, setMonitoredServers] = useState([]);

    // ==========================
    // FUNÇÕES BÁSICAS (SEM LOOPS)
    // ==========================
    
    /**
     * Testa conectividade de um servidor (função simples)
     */
    const testServer = useCallback(async (serverInfo) => {
        if (!serverInfo || !serverInfo.ipAddress) {
            throw new Error('Informações do servidor inválidas');
        }

        if (!window.api || !window.api.connectivity) {
            console.warn('⚠️ API de conectividade não disponível');
            return { 
                status: 'error', 
                message: 'API não disponível', 
                timestamp: Date.now() 
            };
        }

        try {
            console.log(`🧪 Testando conectividade: ${serverInfo.name || serverInfo.ipAddress}`);
            const result = await window.api.connectivity.testServer(serverInfo);
            
            // Atualiza timestamp do último teste
            setLastTestTime(Date.now());
            
            return result;
        } catch (error) {
            console.error(`❌ Erro no teste:`, error);
            return {
                status: 'error',
                error: error.message,
                timestamp: Date.now(),
                message: `Erro: ${error.message}`
            };
        }
    }, []); // Sem dependências para evitar loops

    /**
     * Testa múltiplos servidores (função simples)
     */
    const testMultipleServers = useCallback(async (servers) => {
        if (!servers || !Array.isArray(servers) || servers.length === 0) {
            throw new Error('Lista de servidores inválida');
        }

        if (!window.api || !window.api.connectivity) {
            console.warn('⚠️ API de conectividade não disponível');
            return [];
        }

        setIsTestingMultiple(true);
        
        try {
            console.log(`🔄 Testando ${servers.length} servidores`);
            
            // Teste simples sem complexidade
            const results = [];
            for (const server of servers) {
                try {
                    const result = await window.api.connectivity.testServer(server);
                    results.push({ server, result });
                } catch (error) {
                    results.push({ 
                        server, 
                        result: { 
                            status: 'error', 
                            message: error.message,
                            timestamp: Date.now()
                        } 
                    });
                }
            }
            
            setLastTestTime(Date.now());
            return results;
        } catch (error) {
            console.error('❌ Erro no teste múltiplo:', error);
            throw error;
        } finally {
            setIsTestingMultiple(false);
        }
    }, []); // Sem dependências para evitar loops

    /**
     * Limpa cache (função simples)
     */
    const clearCache = useCallback(() => {
        try {
            if (window.api && window.api.connectivity && window.api.connectivity.clearCache) {
                window.api.connectivity.clearCache();
            }
            
            // Limpa estados locais
            setConnectivityResults({});
            
            console.log('🧹 Cache de conectividade limpo');
        } catch (error) {
            console.error('❌ Erro ao limpar cache:', error);
        }
    }, []); // Sem dependências para evitar loops

    /**
     * Obtém estatísticas básicas
     */
    const getStats = useCallback(async () => {
        try {
            if (window.api && window.api.connectivity && window.api.connectivity.getStats) {
                const stats = await window.api.connectivity.getStats();
                return stats;
            }
            
            return {
                message: 'Stats não disponíveis',
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return {
                error: error.message,
                timestamp: Date.now()
            };
        }
    }, []); // Sem dependências para evitar loops

    /**
     * Função básica para obter resultado (sem Map complexo)
     */
    const getConnectivityResult = useCallback((serverKey) => {
        if (typeof serverKey === 'object' && serverKey.ipAddress) {
            // Gera chave simples
            const key = `${serverKey.ipAddress}:${serverKey.port || '22'}`;
            return connectivityResults[key] || null;
        }
        
        return connectivityResults[serverKey] || null;
    }, [connectivityResults]);

    /**
     * Verifica se servidor está sendo testado (função simples)
     */
    const isServerTesting = useCallback((serverInfo) => {
        const result = getConnectivityResult(serverInfo);
        return result && result.status === 'testing';
    }, [getConnectivityResult]);

    /**
     * Verifica se servidor está online (função simples)
     */
    const isServerOnline = useCallback((serverInfo) => {
        const result = getConnectivityResult(serverInfo);
        return result && result.status === 'online';
    }, [getConnectivityResult]);

    /**
     * Verifica se servidor está monitorado (função simples)
     */
    const isServerMonitored = useCallback((serverInfo) => {
        if (!serverInfo || !serverInfo.ipAddress) return false;
        const key = `${serverInfo.ipAddress}:${serverInfo.port || '22'}`;
        return monitoredServers.includes(key);
    }, [monitoredServers]);

    /**
     * Inicia monitoramento (função simples sem loops)
     */
    const startMonitoring = useCallback((serverInfo) => {
        if (!serverInfo || !serverInfo.ipAddress) return;
        
        const key = `${serverInfo.ipAddress}:${serverInfo.port || '22'}`;
        
        if (!monitoredServers.includes(key)) {
            setMonitoredServers(prev => [...prev, key]);
            console.log(`📡 Monitoramento iniciado: ${serverInfo.name || key}`);
        }
    }, [monitoredServers]);

    /**
     * Para monitoramento (função simples)
     */
    const stopMonitoring = useCallback((serverInfo) => {
        if (!serverInfo) return;
        
        const key = typeof serverInfo === 'string' ? 
            serverInfo : 
            `${serverInfo.ipAddress}:${serverInfo.port || '22'}`;
        
        setMonitoredServers(prev => prev.filter(s => s !== key));
        console.log(`⏹️ Monitoramento parado: ${key}`);
    }, []);

    /**
     * Para todo monitoramento
     */
    const stopAllMonitoring = useCallback(() => {
        setMonitoredServers([]);
        console.log('⏹️ Todo monitoramento parado');
    }, []);

    /**
     * Gera chave do servidor (função simples local)
     */
    const generateServerKey = useCallback((serverInfo) => {
        if (!serverInfo || !serverInfo.ipAddress) return 'unknown';
        const port = serverInfo.port || (serverInfo.protocol === 'rdp' ? 3389 : 22);
        return `${serverInfo.ipAddress}:${port}`;
    }, []);

    // ==========================
    // RETURN DO HOOK SIMPLIFICADO
    // ==========================
    return {
        // Estados básicos
        connectivityResults,
        isTestingMultiple,
        monitoredServers,
        lastTestTime,
        isConnectivityEnabled,

        // Funções de teste
        testServer,
        testMultipleServers,

        // Funções de consulta
        getConnectivityResult,
        isServerTesting,
        isServerOnline,

        // Funções de monitoramento
        startMonitoring,
        stopMonitoring,
        stopAllMonitoring,
        isServerMonitored,

        // Utilitários
        clearCache,
        getStats,
        generateServerKey,

        // Controles
        setConnectivityEnabled: setIsConnectivityEnabled
    };
}

export default useConnectivity;