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
        if (!window.api) return;

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
            setMonitoredServers(prev => {
                const newSet = new Set(prev);
                if (action === 'started') newSet.add(serverKey);
                else newSet.delete(serverKey);
                return newSet;
            });
        };
        
        window.api.onConnectivityStatusUpdate(onUpdate);
        window.api.onConnectivityMonitoringChange(onMonitorChange);

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