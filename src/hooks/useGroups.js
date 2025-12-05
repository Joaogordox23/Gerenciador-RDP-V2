import { useState, useCallback, useEffect, useRef } from 'react';

export function useGroups(toast) {
    const [groups, setGroups] = useState([]);
    const [vncGroups, setVncGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Flag para evitar salvamento automático logo após carregar dados iniciais
    // Só salva quando o usuário faz uma alteração real
    const hasUserMadeChanges = useRef(false);

    // Helper para mostrar erros/sucessos se o toast estiver disponível
    const showError = useCallback((message) => {
        if (toast && typeof message === 'string' && message.trim()) toast.error(message.trim());
    }, [toast]);

    const showSuccess = useCallback((message) => {
        if (toast && typeof message === 'string' && message.trim()) toast.success(message.trim());
    }, [toast]);

    // --- RDP/SSH GROUPS ---

    const handleAddGroup = useCallback((name) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            showError('Nome do grupo não pode estar vazio.');
            return;
        }
        hasUserMadeChanges.current = true;
        setGroups(prevGroups => {
            if (prevGroups.some(g => g.groupName.toLowerCase() === trimmedName.toLowerCase())) {
                showError('Já existe um grupo com este nome.');
                return prevGroups;
            }
            const newGroup = { id: Date.now(), groupName: trimmedName, servers: [] };
            showSuccess(`Grupo "${trimmedName}" criado com sucesso`);
            return [...prevGroups, newGroup];
        });
    }, [showError, showSuccess]);

    const handleUpdateGroup = useCallback((groupId, newGroupName) => {
        const trimmedName = newGroupName.trim();
        if (!trimmedName) {
            showError('O nome do grupo não pode estar vazio.');
            return;
        }
        hasUserMadeChanges.current = true;
        setGroups(prev => {
            if (prev.some(g => g.id !== groupId && g.groupName.toLowerCase() === trimmedName.toLowerCase())) {
                showError('Já existe um grupo com este nome.');
                return prev;
            }
            showSuccess('Grupo atualizado com sucesso');
            return prev.map(g => (g.id === groupId ? { ...g, groupName: trimmedName } : g));
        });
    }, [showError, showSuccess]);

    const handleDeleteGroup = useCallback((groupId) => {
        hasUserMadeChanges.current = true;
        setGroups(prev => prev.filter(g => g.id !== groupId));
        showSuccess('Grupo removido com sucesso');
    }, [showSuccess]);

    // --- RDP/SSH SERVERS ---

    const handleAddServer = useCallback((groupId, serverData) => {
        hasUserMadeChanges.current = true;
        setGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                const newServer = { ...serverData, id: Date.now() + Math.floor(Math.random() * 10000) };
                const updatedServers = Array.isArray(group.servers) ? [...group.servers, newServer] : [newServer];
                return { ...group, servers: updatedServers };
            }
            return group;
        }));
        showSuccess(`Servidor "${serverData.name}" adicionado com sucesso.`);
    }, [showSuccess]);

    const handleUpdateServer = useCallback((groupId, serverId, updatedData) => {
        hasUserMadeChanges.current = true;
        setGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                return { ...group, servers: group.servers.map(s => (s.id === serverId ? { ...s, ...updatedData } : s)) };
            }
            return group;
        }));
        showSuccess('Servidor atualizado com sucesso.');
    }, [showSuccess]);

    const handleDeleteServer = useCallback((groupId, serverId) => {
        hasUserMadeChanges.current = true;
        setGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                return { ...group, servers: group.servers.filter(s => s.id !== serverId) };
            }
            return group;
        }));
        showSuccess('Servidor removido com sucesso.');
    }, [showSuccess]);

    // --- VNC GROUPS ---

    const handleAddVncGroup = useCallback((name) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            showError('Nome do grupo não pode estar vazio.');
            return;
        }
        hasUserMadeChanges.current = true;
        setVncGroups(prevVncGroups => {
            if (prevVncGroups.some(g => g.groupName.toLowerCase() === trimmedName.toLowerCase())) {
                showError('Já existe um grupo VNC com este nome.');
                return prevVncGroups;
            }
            const newGroup = { id: Date.now(), groupName: trimmedName, connections: [] };
            showSuccess(`Grupo VNC "${trimmedName}" criado com sucesso`);
            return [...prevVncGroups, newGroup];
        });
    }, [showError, showSuccess]);

    const handleUpdateVncGroup = useCallback((groupId, newGroupName) => {
        const trimmedName = newGroupName.trim();
        if (!trimmedName) {
            showError("O novo nome do grupo não pode estar vazio.");
            return;
        }
        hasUserMadeChanges.current = true;
        setVncGroups(prev => {
            if (prev.some(g => g.id !== groupId && g.groupName.toLowerCase() === trimmedName.toLowerCase())) {
                showError("Já existe um grupo VNC com este nome.");
                return prev;
            }
            showSuccess(`Grupo VNC renomeado para "${trimmedName}".`);
            return prev.map(g => (g.id === groupId ? { ...g, groupName: trimmedName } : g));
        });
    }, [showError, showSuccess]);

    const handleDeleteVncGroup = useCallback((groupId, groupName) => {
        // A confirmação deve ser feita no componente UI antes de chamar esta função
        hasUserMadeChanges.current = true;
        setVncGroups(prev => prev.filter(g => g.id !== groupId));
        showSuccess(`Grupo VNC "${groupName}" deletado.`);
    }, [showSuccess]);

    // --- VNC CONNECTIONS ---

    const handleAddVncConnection = useCallback((groupId, connectionData) => {
        hasUserMadeChanges.current = true;
        setVncGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                const newConnection = { ...connectionData, id: Date.now() + Math.floor(Math.random() * 10000) };
                const updatedConnections = Array.isArray(group.connections) ? [...group.connections, newConnection] : [newConnection];
                return { ...group, connections: updatedConnections };
            }
            return group;
        }));
        showSuccess(`Conexão "${connectionData.name}" adicionada com sucesso`);
    }, [showSuccess]);

    const handleUpdateVncConnection = useCallback((groupId, connectionId, updatedData) => {
        hasUserMadeChanges.current = true;
        setVncGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                return { ...group, connections: group.connections.map(c => (c.id === connectionId ? { ...c, ...updatedData } : c)) };
            }
            return group;
        }));
        showSuccess('Conexão VNC atualizada com sucesso');
    }, [showSuccess]);

    const handleDeleteVncConnection = useCallback((groupId, connectionId, connectionName) => {
        // A confirmação deve ser feita no componente UI
        hasUserMadeChanges.current = true;
        setVncGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                return { ...group, connections: group.connections.filter(c => c.id !== connectionId) };
            }
            return group;
        }));
        showSuccess(`Conexão "${connectionName}" deletada.`);
    }, [showSuccess]);

    // --- INITIAL DATA LOADING & PERSISTENCE ---

    useEffect(() => {
        // 🎯 SOLUÇÃO MINIMALISTA: Aguarda dados do backend via IPC
        if (window.api && window.api.onInitialDataLoaded) {
            console.log('📥 useGroups: Aguardando dados do backend via IPC...');

            // Listener para receber dados diretamente do backend
            window.api.onInitialDataLoaded((data) => {
                console.log(`✅ useGroups: Dados recebidos! ${data.groups.length} RDP/SSH, ${data.vncGroups.length} VNC`);
                setGroups(data.groups || []);
                setVncGroups(data.vncGroups || []);
                setIsLoading(false);
            });

            // Fallback: se após 5s não receber, tenta ler do store
            setTimeout(async () => {
                if (isLoading) {
                    console.log('⚠️ useGroups: Timeout waiting for IPC, reading from store as fallback...');
                    const savedGroups = await window.api.storage.get('groups');
                    const savedVncGroups = await window.api.storage.get('vncGroups');
                    setGroups(savedGroups || []);
                    setVncGroups(savedVncGroups || []);
                    setIsLoading(false);
                }
            }, 5000);
        } else {
            console.warn('⚠️ useGroups: window.api.onInitialDataLoaded não disponível');
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // ✅ OTIMIZAÇÃO: Só salva quando o usuário fez alterações reais
        // Evita o loop de salvamento logo após carregar dados iniciais
        if (!isLoading && hasUserMadeChanges.current && window.api && window.api.storage) {
            // Debounce de 500ms - agrupa múltiplas mudanças rápidas
            const timeoutId = setTimeout(() => {
                console.log('💾 useGroups: Salvando dados no storage (mudança do usuário)...');
                window.api.storage.set('groups', groups);
                window.api.storage.set('vncGroups', vncGroups);
            }, 500);

            // Cleanup: cancela o timeout se houver nova mudança
            return () => clearTimeout(timeoutId);
        }
    }, [groups, vncGroups, isLoading]);

    return {
        groups,
        setGroups,
        vncGroups,
        setVncGroups,
        isLoading,
        handleAddGroup,
        handleUpdateGroup,
        handleDeleteGroup,
        handleAddServer,
        handleUpdateServer,
        handleDeleteServer,
        handleAddVncGroup,
        handleUpdateVncGroup,
        handleDeleteVncGroup,
        handleAddVncConnection,
        handleUpdateVncConnection,
        handleDeleteVncConnection
    };
}
