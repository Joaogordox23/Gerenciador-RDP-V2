// src/hooks/useConnectivity.js (VERSÃO COMPLETA E FUNCIONAL)

import { useState, useEffect, useCallback, useContext, createContext } from 'react';

// 1. Criamos um Contexto para compartilhar os resultados de conectividade
const ConnectivityContext = createContext();

// 2. O Provedor que vai gerenciar todos os dados de conectividade
export function ConnectivityProvider({ children }) {
    const [results, setResults] = useState(new Map());
    const [monitoredServers, setMonitoredServers] = useState(new Set());
    const [isTesting, setIsTesting] = useState(new Set());

    const updateResult = useCallback((serverKey, result) => {
        setResults(prev => new Map(prev).set(serverKey, result));
    }, []);

    // Ouvintes (Listeners) para eventos do backend (Electron)
    useEffect(() => {
        if (!window.api) {
            console.warn('⚠️ useConnectivity: window.api não disponível');
            return;
        }

        const onUpdate = (serverKey, result) => {
            console.log(`[Hook] Recebido status para ${serverKey}:`, result.status);
            updateResult(serverKey, result);
            setIsTesting(prev => {
                const newSet = new Set(prev);
                newSet.delete(serverKey);
                return newSet;
            });
        };

        const onMonitorChange = (action, serverKey) => {
            console.log(`[Hook] Monitor ${action} para ${serverKey}`);
            setMonitoredServers(prev => {
                const newSet = new Set(prev);
                if (action === 'started') newSet.add(serverKey);
                else newSet.delete(serverKey);
                return newSet;
            });
        };

        const onError = (serverKey, error) => {
            console.error(`[Hook] Erro de conectividade para ${serverKey}:`, error);
            setIsTesting(prev => {
                const newSet = new Set(prev);
                newSet.delete(serverKey);
                return newSet;
            });
        };

        // ✅ OTIMIZAÇÃO: Registrar todos os listeners
        window.api.onConnectivityStatusUpdate(onUpdate);
        window.api.onConnectivityMonitoringChange(onMonitorChange);
        if (window.api.onConnectivityError) {
            window.api.onConnectivityError(onError);
        }

        console.log('✅ useConnectivity: Listeners registrados');

        // ✅ OTIMIZAÇÃO: Cleanup adequado ao desmontar
        return () => {
            console.log('🧹 useConnectivity: Limpando listeners');
            // Para todos os monitoramentos ativos
            if (window.api.connectivity?.stopAllMonitoring) {
                window.api.connectivity.stopAllMonitoring();
            }
        };
    }, [updateResult]);

    // Funções que os componentes irão usar
    const generateServerKey = useCallback((serverInfo) => {
        if (!serverInfo?.ipAddress) return null;
        const port = serverInfo.port || (serverInfo.protocol === 'rdp' ? 3389 : 22);
        return `${serverInfo.ipAddress}:${port}`;
    }, []);

    const testServer = useCallback(async (serverInfo) => {
        const serverKey = generateServerKey(serverInfo);
        if (!serverKey) return;

        console.log(`[Hook] Enviando pedido de teste para ${serverKey}`);
        setIsTesting(prev => new Set(prev).add(serverKey));
        try {
            await window.api.connectivity.testServer(serverInfo);
        } catch (e) {
            console.error("Erro no testServer:", e);
            setIsTesting(prev => {
                const newSet = new Set(prev);
                newSet.delete(serverKey);
                return newSet;
            });
        }
    }, [generateServerKey]);

    const testAllServers = useCallback(async (servers) => {
        if (!servers || servers.length === 0) return;

        console.log(`[Hook] Disparando teste em lote para ${servers.length} servidores.`);

        // Usamos a API do backend que já existe para testar múltiplos servidores
        try {
            await window.api.connectivity.testMultiple(servers);
            console.log('[Hook] Pedido de teste em lote enviado com sucesso.');
        } catch (e) {
            console.error("Erro no testAllServers:", e);
        }
    }, []);

    const startMonitoring = useCallback((serverInfo) => {
        const serverKey = generateServerKey(serverInfo);
        if (!serverKey || monitoredServers.has(serverKey)) return;
        console.log(`[Hook] Enviando pedido de monitoramento para ${serverKey}`);
        window.api.connectivity.startMonitoring(serverInfo);
    }, [generateServerKey, monitoredServers]);

    const stopMonitoring = useCallback((serverKey) => {
        if (!serverKey || !monitoredServers.has(serverKey)) return;
        console.log(`[Hook] Parando monitoramento de ${serverKey}`);
        window.api.connectivity.stopMonitoring(serverKey);
    }, [monitoredServers]);

    const value = {
        results,
        isTesting,
        monitoredServers,
        generateServerKey,
        testServer,
        testAllServers,
        startMonitoring,
        stopMonitoring,
    };

    return (
        <ConnectivityContext.Provider value={value}>
            {children}
        </ConnectivityContext.Provider>
    );
}

// 3. O Hook que os componentes usarão para acessar os dados
export function useConnectivity() {
    const context = useContext(ConnectivityContext);
    if (!context) {
        throw new Error('useConnectivity deve ser usado dentro de um ConnectivityProvider');
    }
    return context;
}