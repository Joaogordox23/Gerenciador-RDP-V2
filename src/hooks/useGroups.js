import { useState, useCallback, useEffect, useRef } from 'react';

export function useGroups(toast) {
    const [groups, setGroups] = useState([]);
    const [vncGroups, setVncGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Flag para evitar salvamento automático logo após carregar dados iniciais
    // Só salva quando o usuário faz uma alteração real
    const hasUserMadeChanges = useRef(false);

    // Flag para pular o sync no storage quando a operação já foi feita pontualmente via SQLite
    const skipNextStorageSync = useRef(false);

    // Flag para pular sync durante operações de Drag and Drop (reordenação local apenas)
    const skipDndSync = useRef(false);

    // Helper para mostrar erros/sucessos se o toast estiver disponível
    const showError = useCallback((message) => {
        if (toast && typeof message === 'string' && message.trim()) toast.error(message.trim());
    }, [toast]);

    const showSuccess = useCallback((message) => {
        if (toast && typeof message === 'string' && message.trim()) toast.success(message.trim());
    }, [toast]);

    // --- RDP/SSH GROUPS ---

    const handleAddGroup = useCallback(async (name) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            showError('Nome do grupo não pode estar vazio.');
            return;
        }

        // ✅ OTIMIZAÇÃO: Verifica duplicata localmente primeiro
        if (groups.some(g => g.groupName.toLowerCase() === trimmedName.toLowerCase())) {
            showError('Já existe um grupo com este nome.');
            return;
        }

        // ✅ OTIMIZAÇÃO: Adiciona direto no SQLite (PONTUAL!)
        if (window.api && window.api.db) {
            try {
                const result = await window.api.db.addGroup(trimmedName, 'rdp');
                if (result.success) {
                    const newGroup = { id: result.id, groupName: trimmedName, servers: [] };
                    setGroups(prevGroups => [...prevGroups, newGroup]);
                    showSuccess(`Grupo "${trimmedName}" criado com sucesso`);
                    console.log(`⚡ Grupo ${trimmedName} adicionado via SQLite (pontual)`);
                } else {
                    showError('Erro ao criar grupo no banco de dados.');
                }
            } catch (error) {
                console.error('❌ Erro ao adicionar grupo no SQLite:', error);
                showError('Erro ao criar grupo.');
            }
        } else {
            // Fallback para modo antigo
            hasUserMadeChanges.current = true;
            const newGroup = { id: Date.now(), groupName: trimmedName, servers: [] };
            setGroups(prevGroups => [...prevGroups, newGroup]);
            showSuccess(`Grupo "${trimmedName}" criado com sucesso`);
        }
    }, [groups, showError, showSuccess]);

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

    const handleDeleteGroup = useCallback(async (groupId) => {
        // ✅ OTIMIZAÇÃO: Deleta direto no SQLite (PONTUAL!)
        if (window.api && window.api.db) {
            try {
                const result = await window.api.db.deleteGroup(groupId);
                if (result.success) {
                    setGroups(prev => prev.filter(g => g.id !== groupId));
                    showSuccess('Grupo removido com sucesso');
                    console.log(`⚡ Grupo ${groupId} deletado via SQLite (pontual)`);
                } else {
                    showError('Erro ao remover grupo do banco de dados.');
                }
            } catch (error) {
                console.error('❌ Erro ao deletar grupo no SQLite:', error);
                showError('Erro ao remover grupo.');
            }
        } else {
            // Fallback para modo antigo
            hasUserMadeChanges.current = true;
            setGroups(prev => prev.filter(g => g.id !== groupId));
            showSuccess('Grupo removido com sucesso');
        }
    }, [showSuccess, showError]);

    // --- RDP/SSH SERVERS ---

    const handleAddServer = useCallback(async (groupId, serverData) => {
        // ✅ OTIMIZAÇÃO: Adiciona direto no SQLite (PONTUAL!)
        if (window.api && window.api.db) {
            try {
                const result = await window.api.db.addConnection(groupId, {
                    ...serverData,
                    protocol: serverData.protocol || 'rdp'
                });
                if (result.success) {
                    const newServer = { ...serverData, id: result.id };
                    setGroups(prev => prev.map(group => {
                        if (group.id === groupId) {
                            const updatedServers = Array.isArray(group.servers) ? [...group.servers, newServer] : [newServer];
                            return { ...group, servers: updatedServers };
                        }
                        return group;
                    }));
                    showSuccess(`Servidor "${serverData.name}" adicionado com sucesso.`);
                    console.log(`⚡ Servidor ${serverData.name} adicionado via SQLite (pontual)`);
                } else {
                    showError('Erro ao adicionar servidor no banco de dados.');
                }
            } catch (error) {
                console.error('❌ Erro ao adicionar servidor no SQLite:', error);
                showError('Erro ao adicionar servidor.');
            }
        } else {
            // Fallback para modo antigo
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
        }
    }, [showSuccess, showError]);

    const handleUpdateServer = useCallback(async (groupId, serverId, updatedData, newGroupId = null) => {
        // ✅ OTIMIZAÇÃO: Atualiza no SQLite diretamente (PONTUAL!)
        // Não define hasUserMadeChanges para evitar salvamento em massa
        let serverWithEncryptedPassword = updatedData;

        if (window.api && window.api.db) {
            try {
                const result = await window.api.db.updateConnection(serverId, updatedData);
                console.log(`⚡ Servidor ${serverId} atualizado via SQLite (pontual)`);
                skipNextStorageSync.current = true; // Pula o sync em massa

                // Usa a conexão retornada pelo backend (com senha criptografada)
                if (result.connection) {
                    serverWithEncryptedPassword = result.connection;
                }
            } catch (error) {
                console.error('❌ Erro ao atualizar servidor no SQLite:', error);
            }
        }

        // Verifica se precisa mover para outro grupo
        if (newGroupId && newGroupId !== groupId) {
            hasUserMadeChanges.current = true;
            setGroups(prev => {
                // 1. Remove do grupo antigo
                const withoutServer = prev.map(group => {
                    if (group.id === groupId) {
                        return { ...group, servers: group.servers.filter(s => s.id !== serverId) };
                    }
                    return group;
                });

                // 2. Adiciona ao novo grupo
                return withoutServer.map(group => {
                    if (group.id === newGroupId) {
                        const serverToMove = { ...serverWithEncryptedPassword, id: serverId };
                        return { ...group, servers: [...(group.servers || []), serverToMove] };
                    }
                    return group;
                });
            });
            showSuccess('Servidor movido para outro grupo com sucesso.');
        } else {
            // Atualiza o state local normalmente
            setGroups(prev => prev.map(group => {
                if (group.id === groupId) {
                    return { ...group, servers: group.servers.map(s => (s.id === serverId ? { ...s, ...serverWithEncryptedPassword } : s)) };
                }
                return group;
            }));
            showSuccess('Servidor atualizado com sucesso.');
        }
    }, [showSuccess]);

    const handleDeleteServer = useCallback(async (groupId, serverId) => {
        // ✅ OTIMIZAÇÃO: Deleta direto no SQLite (PONTUAL!)
        if (window.api && window.api.db) {
            try {
                const result = await window.api.db.deleteConnection(serverId);
                if (result.success) {
                    setGroups(prev => prev.map(group => {
                        if (group.id === groupId) {
                            return { ...group, servers: group.servers.filter(s => s.id !== serverId) };
                        }
                        return group;
                    }));
                    showSuccess('Servidor removido com sucesso.');
                    console.log(`⚡ Servidor ${serverId} deletado via SQLite (pontual)`);
                } else {
                    showError('Erro ao remover servidor do banco de dados.');
                }
            } catch (error) {
                console.error('❌ Erro ao deletar servidor no SQLite:', error);
                showError('Erro ao remover servidor.');
            }
        } else {
            // Fallback para modo antigo
            hasUserMadeChanges.current = true;
            setGroups(prev => prev.map(group => {
                if (group.id === groupId) {
                    return { ...group, servers: group.servers.filter(s => s.id !== serverId) };
                }
                return group;
            }));
            showSuccess('Servidor removido com sucesso.');
        }
    }, [showSuccess, showError]);

    // --- VNC GROUPS ---

    const handleAddVncGroup = useCallback(async (name) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            showError('Nome do grupo não pode estar vazio.');
            return;
        }

        // ✅ OTIMIZAÇÃO: Verifica duplicata localmente primeiro
        if (vncGroups.some(g => g.groupName.toLowerCase() === trimmedName.toLowerCase())) {
            showError('Já existe um grupo VNC com este nome.');
            return;
        }

        // ✅ OTIMIZAÇÃO: Adiciona direto no SQLite (PONTUAL!)
        if (window.api && window.api.db) {
            try {
                const result = await window.api.db.addGroup(trimmedName, 'vnc');
                if (result.success) {
                    const newGroup = { id: result.id, groupName: trimmedName, connections: [] };
                    setVncGroups(prevVncGroups => [...prevVncGroups, newGroup]);
                    showSuccess(`Grupo VNC "${trimmedName}" criado com sucesso`);
                    console.log(`⚡ Grupo VNC ${trimmedName} adicionado via SQLite (pontual)`);
                } else {
                    showError('Erro ao criar grupo VNC no banco de dados.');
                }
            } catch (error) {
                console.error('❌ Erro ao adicionar grupo VNC no SQLite:', error);
                showError('Erro ao criar grupo VNC.');
            }
        } else {
            // Fallback para modo antigo
            hasUserMadeChanges.current = true;
            const newGroup = { id: Date.now(), groupName: trimmedName, connections: [] };
            setVncGroups(prevVncGroups => [...prevVncGroups, newGroup]);
            showSuccess(`Grupo VNC "${trimmedName}" criado com sucesso`);
        }
    }, [vncGroups, showError, showSuccess]);

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

    const handleDeleteVncGroup = useCallback(async (groupId, groupName) => {
        // ✅ OTIMIZAÇÃO: Deleta direto no SQLite (PONTUAL!)
        if (window.api && window.api.db) {
            try {
                const result = await window.api.db.deleteGroup(groupId);
                if (result.success) {
                    setVncGroups(prev => prev.filter(g => g.id !== groupId));
                    showSuccess(`Grupo VNC "${groupName}" deletado.`);
                    console.log(`⚡ Grupo VNC ${groupId} deletado via SQLite (pontual)`);
                } else {
                    showError('Erro ao remover grupo VNC do banco de dados.');
                }
            } catch (error) {
                console.error('❌ Erro ao deletar grupo VNC no SQLite:', error);
                showError('Erro ao remover grupo VNC.');
            }
        } else {
            // Fallback para modo antigo
            hasUserMadeChanges.current = true;
            setVncGroups(prev => prev.filter(g => g.id !== groupId));
            showSuccess(`Grupo VNC "${groupName}" deletado.`);
        }
    }, [showSuccess, showError]);

    // --- VNC CONNECTIONS ---

    const handleAddVncConnection = useCallback(async (groupId, connectionData) => {
        // ✅ OTIMIZAÇÃO: Adiciona direto no SQLite (PONTUAL!)
        if (window.api && window.api.db) {
            try {
                const result = await window.api.db.addConnection(groupId, {
                    ...connectionData,
                    protocol: 'vnc'
                });
                if (result.success) {
                    const newConnection = { ...connectionData, id: result.id };
                    setVncGroups(prev => prev.map(group => {
                        if (group.id === groupId) {
                            const updatedConnections = Array.isArray(group.connections) ? [...group.connections, newConnection] : [newConnection];
                            return { ...group, connections: updatedConnections };
                        }
                        return group;
                    }));
                    showSuccess(`Conexão "${connectionData.name}" adicionada com sucesso`);
                    console.log(`⚡ Conexão VNC ${connectionData.name} adicionada via SQLite (pontual)`);
                } else {
                    showError('Erro ao adicionar conexão VNC no banco de dados.');
                }
            } catch (error) {
                console.error('❌ Erro ao adicionar conexão VNC no SQLite:', error);
                showError('Erro ao adicionar conexão VNC.');
            }
        } else {
            // Fallback para modo antigo
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
        }
    }, [showSuccess, showError]);

    const handleUpdateVncConnection = useCallback(async (groupId, connectionId, updatedData, newGroupId = null) => {
        // ✅ OTIMIZAÇÃO: Atualiza no SQLite diretamente (PONTUAL!)
        // Não define hasUserMadeChanges para evitar salvamento em massa
        let connectionWithEncryptedPassword = updatedData;

        if (window.api && window.api.db) {
            try {
                const result = await window.api.db.updateConnection(connectionId, { ...updatedData, protocol: 'vnc' });
                console.log(`⚡ Conexão VNC ${connectionId} atualizada via SQLite (pontual)`);
                skipNextStorageSync.current = true; // Pula o sync em massa

                // Usa a conexão retornada pelo backend (com senha criptografada)
                if (result.connection) {
                    connectionWithEncryptedPassword = result.connection;
                }
            } catch (error) {
                console.error('❌ Erro ao atualizar conexão VNC no SQLite:', error);
            }
        }

        // Verifica se precisa mover para outro grupo
        if (newGroupId && newGroupId !== groupId) {
            hasUserMadeChanges.current = true;
            setVncGroups(prev => {
                // 1. Remove do grupo antigo
                const withoutConnection = prev.map(group => {
                    if (group.id === groupId) {
                        return { ...group, connections: group.connections.filter(c => c.id !== connectionId) };
                    }
                    return group;
                });

                // 2. Adiciona ao novo grupo
                return withoutConnection.map(group => {
                    if (group.id === newGroupId) {
                        const connectionToMove = { ...connectionWithEncryptedPassword, id: connectionId };
                        return { ...group, connections: [...(group.connections || []), connectionToMove] };
                    }
                    return group;
                });
            });
            showSuccess('Conexão VNC movida para outro grupo com sucesso.');
        } else {
            // Atualiza o state local normalmente
            setVncGroups(prev => prev.map(group => {
                if (group.id === groupId) {
                    return { ...group, connections: group.connections.map(c => (c.id === connectionId ? { ...c, ...connectionWithEncryptedPassword } : c)) };
                }
                return group;
            }));
            showSuccess('Conexão VNC atualizada com sucesso.');
        }
    }, [showSuccess]);

    const handleDeleteVncConnection = useCallback(async (groupId, connectionId, connectionName) => {
        // ✅ OTIMIZAÇÃO: Deleta direto no SQLite (PONTUAL!)
        if (window.api && window.api.db) {
            try {
                const result = await window.api.db.deleteConnection(connectionId);
                if (result.success) {
                    setVncGroups(prev => prev.map(group => {
                        if (group.id === groupId) {
                            return { ...group, connections: group.connections.filter(c => c.id !== connectionId) };
                        }
                        return group;
                    }));
                    showSuccess(`Conexão "${connectionName}" deletada.`);
                    console.log(`⚡ Conexão VNC ${connectionId} deletada via SQLite (pontual)`);
                } else {
                    showError('Erro ao remover conexão VNC do banco de dados.');
                }
            } catch (error) {
                console.error('❌ Erro ao deletar conexão VNC no SQLite:', error);
                showError('Erro ao remover conexão VNC.');
            }
        } else {
            // Fallback para modo antigo
            hasUserMadeChanges.current = true;
            setVncGroups(prev => prev.map(group => {
                if (group.id === groupId) {
                    return { ...group, connections: group.connections.filter(c => c.id !== connectionId) };
                }
                return group;
            }));
            showSuccess(`Conexão "${connectionName}" deletada.`);
        }
    }, [showSuccess, showError]);

    // --- DRAG AND DROP FUNCTIONS (sem sync em massa) ---

    // Reordena grupos (DnD de grupo)
    const reorderGroups = useCallback((newGroups) => {
        skipDndSync.current = true;
        setGroups(newGroups);
    }, []);

    // Reordena servidores dentro do mesmo grupo
    const reorderServersInGroup = useCallback((groupId, newServers) => {
        skipDndSync.current = true;
        setGroups(prev => prev.map(g =>
            g.id === groupId ? { ...g, servers: newServers } : g
        ));
    }, []);

    // Move servidor para outro grupo
    const moveServerToGroup = useCallback((serverId, sourceGroupId, destGroupId, destIndex) => {
        skipDndSync.current = true;
        setGroups(prev => {
            const sourceGroup = prev.find(g => g.id.toString() === sourceGroupId.toString());
            const destGroup = prev.find(g => g.id.toString() === destGroupId.toString());

            if (!sourceGroup || !destGroup) return prev;

            const serverToMove = sourceGroup.servers.find(s => s.id === serverId);
            if (!serverToMove) return prev;

            return prev.map(g => {
                if (g.id.toString() === sourceGroupId.toString()) {
                    return { ...g, servers: g.servers.filter(s => s.id !== serverId) };
                }
                if (g.id.toString() === destGroupId.toString()) {
                    const newServers = [...g.servers];
                    newServers.splice(destIndex, 0, serverToMove);
                    return { ...g, servers: newServers };
                }
                return g;
            });
        });
    }, []);

    // Reordena grupos VNC (DnD de grupo)
    const reorderVncGroups = useCallback((newVncGroups) => {
        skipDndSync.current = true;
        setVncGroups(newVncGroups);
    }, []);

    // --- INITIAL DATA LOADING & PERSISTENCE ---

    // Ref para acessar isLoading dentro dos callbacks sem precisar adicionar às dependências
    const isLoadingRef = useRef(isLoading);
    useEffect(() => {
        isLoadingRef.current = isLoading;
    }, [isLoading]);

    useEffect(() => {
        // 🎯 CORREÇÃO: Solicita dados ativamente em vez de apenas escutar
        const loadInitialData = async () => {
            console.log('📥 useGroups: Iniciando carregamento de dados...');

            // 1. Registra listener para dados enviados pelo backend (did-finish-load)
            if (window.api && window.api.onInitialDataLoaded) {
                window.api.onInitialDataLoaded((data) => {
                    if (isLoadingRef.current) {
                        console.log(`✅ useGroups: Dados recebidos via push! ${data.groups.length} RDP/SSH, ${data.vncGroups.length} VNC`);
                        setGroups(data.groups || []);
                        setVncGroups(data.vncGroups || []);
                        setIsLoading(false);
                    }
                });
            }

            // 2. ✅ NOVO: Solicita dados ativamente (resolve race condition)
            if (window.api?.db?.requestInitialData) {
                try {
                    console.log('📡 useGroups: Solicitando dados ativamente via IPC...');
                    const data = await window.api.db.requestInitialData();
                    if (data && (data.groups.length > 0 || data.vncGroups.length > 0 || isLoadingRef.current)) {
                        console.log(`✅ useGroups: Dados recebidos via request! ${data.groups.length} RDP/SSH, ${data.vncGroups.length} VNC`);
                        setGroups(data.groups || []);
                        setVncGroups(data.vncGroups || []);
                        setIsLoading(false);
                        return; // Sucesso, não precisa do fallback
                    }
                } catch (error) {
                    console.error('❌ useGroups: Erro ao solicitar dados:', error);
                }
            }

            // 3. Fallback: se após 3s ainda não tiver dados, tenta ler do store
            setTimeout(async () => {
                if (isLoadingRef.current) {
                    console.log('⚠️ useGroups: Fallback - lendo do electron-store...');
                    try {
                        const savedGroups = await window.api.storage.get('groups');
                        const savedVncGroups = await window.api.storage.get('vncGroups');
                        setGroups(savedGroups || []);
                        setVncGroups(savedVncGroups || []);
                    } catch (e) {
                        console.error('❌ Erro no fallback:', e);
                    }
                    setIsLoading(false);
                }
            }, 3000);
        };

        loadInitialData();
    }, []);

    // ✅ OTIMIZAÇÃO: useEffect de sync em massa REMOVIDO
    // Todas as operações (add/update/delete) agora são pontuais via SQLite.
    // O código antigo fazia sync de TODOS os grupos a cada alteração.
    // Mantido apenas para referência - pode ser removido completamente no futuro.
    //
    // CÓDIGO REMOVIDO:
    // useEffect(() => {
    //     if (!isLoading && hasUserMadeChanges.current) {
    //         window.api.storage.set('groups', groups);
    //         window.api.storage.set('vncGroups', vncGroups);
    //     }
    // }, [groups, vncGroups, isLoading]);

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
        handleDeleteVncConnection,
        // DnD functions (sem sync em massa)
        reorderGroups,
        reorderServersInGroup,
        moveServerToGroup,
        reorderVncGroups
    };
}
