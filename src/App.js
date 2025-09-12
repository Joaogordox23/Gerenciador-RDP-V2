

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import Group from './components/Group';
import AddGroupForm from './components/AddGroupForm';
import RdpSshView from './views/RdpSshView'; // Importa a nova vista
import VncView from './views/VncView'; // Importa a nova vista
import ConfirmationDialog from './components/ConfirmationDialog';
import useConnectivity from './hooks/useConnectivity';

function App() {
    // Estados originais
    const [activeView, setActiveView] = useState('RDP/SSH');
    const [groups, setGroups] = useState([]);
    const [vncGroups, setVncGroups] = useState([]);
    const [dialogConfig, setDialogConfig] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeConnections, setActiveConnections] = useState([]);
    const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);

    // Estados para conectividade (simplificados para evitar loops)
    const [globalConnectivityEnabled, setGlobalConnectivityEnabled] = useState(true);
    const [showAddGroupForm, setShowAddGroupForm] = useState(false);
    const [errorBanner, setErrorBanner] = useState(null);
    const [successBanner, setSuccessBanner] = useState(null);

    // Hook de conectividade com opções simplificadas
    const connectivity = useConnectivity({ 
        autoTest: false, // Desabilita teste automático para evitar loops
        enableMonitoring: false // Desabilita monitoramento para evitar loops
    });

    // ==========================
    // COMPUTED VALUES (MEMOIZADOS)
    // ==========================
    const allServers = useMemo(() => {
        if (!Array.isArray(groups)) return [];
        
        return groups.flatMap(group => 
            Array.isArray(group.servers) ? group.servers.map(server => ({
                ...server,
                groupName: group.groupName
            })) : []
        );
    }, [groups]);

    const connectivityStats = useMemo(() => {
        const stats = {
            total: allServers.length,
            online: 0,
            offline: 0,
            testing: 0,
            unknown: 0,
            monitored: 0
        };

        if (connectivity && connectivity.connectivityResults) {
            allServers.forEach(server => {
                const serverKey = `${server.ipAddress}:${server.port || (server.protocol === 'rdp' ? 3389 : 22)}`;
                const result = connectivity.connectivityResults.get ? 
                    connectivity.connectivityResults.get(serverKey) : null;
                
                if (result && result.status) {
                    switch (result.status) {
                        case 'online': stats.online++; break;
                        case 'offline': stats.offline++; break;
                        case 'testing': stats.testing++; break;
                        default: stats.unknown++; break;
                    }
                } else {
                    stats.unknown++;
                }
            });
        } else {
            stats.unknown = allServers.length;
        }

        return stats;
    }, [allServers, connectivity?.connectivityResults]);

    const filteredGroups = useMemo(() => {
        if (!searchTerm) return groups;
        if (!Array.isArray(groups)) return [];

        return groups.filter(group => {
            if (!group || !group.groupName) return false;
            
            const term = searchTerm.toLowerCase();
            const groupNameMatches = group.groupName.toLowerCase().includes(term);
            
            if (!Array.isArray(group.servers)) return groupNameMatches;
            
            const serverMatches = group.servers.some(server => 
                server && (
                    (server.name && server.name.toLowerCase().includes(term)) || 
                    (server.ipAddress && server.ipAddress.toLowerCase().includes(term))
                )
            );
            return groupNameMatches || serverMatches;
        });
    }, [groups, searchTerm]);

    // ==========================
    // EFFECTS SEGUROS (SEM LOOPS)
    // ==========================
    useEffect(() => {
        const loadData = async () => {
            if (window.api && window.api.storage && window.api.storage.get) {
                // Carrega os grupos RDP/SSH
                const savedGroups = await window.api.storage.get('groups');
                setGroups(Array.isArray(savedGroups) ? savedGroups : []);

                // Carrega os grupos VNC
                const savedVncGroups = await window.api.storage.get('vncGroups');
                setVncGroups(Array.isArray(savedVncGroups) ? savedVncGroups : []);
            }
        };
        loadData().catch(console.error);
    }, []);

    useEffect(() => {
        if (groups && groups.length > 0) {
            try {
                if (window.api && window.api.storage && window.api.storage.set) {
                    window.api.storage.set('groups', groups);
                    window.api.storage.set('vncGroups', vncGroups);
                }
            } catch (error) {
                console.error('❌ Erro ao salvar grupos:', error);
                // NÃO chama showError aqui para evitar loop infinito
            }
        }
    }, [groups, vncGroups]);

    useEffect(() => {
        if (window.api && window.api.onConnectionStatus) {
            const handleConnectionStatus = (serverId, status) => {
                console.log(`📡 Status recebido: Servidor ${serverId} está ${status}`);
                setActiveConnections(prev => {
                    if (status === 'active') {
                        return [...new Set([...prev, serverId])];
                    } else {
                        return prev.filter(id => id !== serverId);
                    }
                });
            };

            try {
                window.api.onConnectionStatus(handleConnectionStatus);
            } catch (error) {
                console.error('❌ Erro ao registrar listener:', error);
            }
        }
    }, []); // Dependência vazia é segura aqui

    // ==========================
    // HANDLERS SEGUROS (MEMOIZADOS)
    // ==========================
    const showError = useCallback((message) => {
        if (typeof message === 'string' && message.trim()) {
            setErrorBanner({ message: message.trim(), id: Date.now() });
            setTimeout(() => setErrorBanner(null), 5000);
        }
    }, []); // Sem dependências para evitar re-renders

    const showSuccess = useCallback((message) => {
        if (typeof message === 'string' && message.trim()) {
            setSuccessBanner({ message: message.trim(), id: Date.now() });
            setTimeout(() => setSuccessBanner(null), 3000);
        }
    }, []); // Sem dependências para evitar re-renders

    const handleAddGroup = useCallback((name) => {
        if (!name || typeof name !== 'string' || !name.trim()) {
            showError('Nome do grupo não pode estar vazio');
            return;
        }

        const trimmedName = name.trim();
        
        if (!Array.isArray(groups)) {
            setGroups([]);
            return;
        }

        const existsGroup = groups.some(group => 
            group && group.groupName && 
            group.groupName.toLowerCase() === trimmedName.toLowerCase()
        );

        if (existsGroup) {
            showError('Já existe um grupo com este nome');
            return;
        }

        const newGroup = {
            id: Date.now(),
            groupName: trimmedName,
            servers: []
        };

        setGroups(prev => Array.isArray(prev) ? [...prev, newGroup] : [newGroup]);
        setShowAddGroupForm(false);
        showSuccess(`Grupo "${trimmedName}" criado com sucesso`);
    }, [groups, showError, showSuccess]);

    const handleAddServer = useCallback((groupIndex, serverData) => {
        if (!serverData || typeof groupIndex !== 'number') {
            showError('Dados inválidos para adicionar servidor');
            return;
        }

        setGroups(prev => {
            if (!Array.isArray(prev)) return []; 
            
            return prev.map((group, index) => {
                if (index === groupIndex && group) {
                    return {
                        ...group,
                        servers: Array.isArray(group.servers) ? 
                            [...group.servers, serverData] : [serverData]
                    };
                }
                return group;
            });
        });

        if (serverData.name) {
            showSuccess(`Servidor "${serverData.name}" adicionado com sucesso`);
        }
    }, [showError, showSuccess]);

   const handleDeleteServer = useCallback((groupId, serverId) => {
        if (!groupId || !serverId) {
            showError('Parâmetros inválidos para deletar servidor');
            return;
        }

        setGroups(prev => {
            if (!Array.isArray(prev)) return [];
            
            return prev.map(group => {
                if (group && group.id === groupId) { // <-- MUDANÇA IMPORTANTE: Compara por group.id
                    return {
                        ...group,
                        servers: group.servers.filter(server => server && server.id !== serverId)
                    };
                }
                return group;
            });
        });

        showSuccess('Servidor removido com sucesso');
    }, [showError, showSuccess]);

    const handleDeleteGroup = useCallback((groupId) => {
        if (!groupId) {
            showError('ID de grupo inválido');
            return;
        }

        setGroups(prev => {
            if (!Array.isArray(prev)) return [];
            return prev.filter(group => group && group.id !== groupId); // <-- MUDANÇA IMPORTANTE: Compara por group.id
        });

        showSuccess('Grupo removido com sucesso');
    }, [showError, showSuccess]);

    const handleUpdateServer = useCallback((groupIndex, serverId, updatedServerData) => {
        if (typeof groupIndex !== 'number' || !serverId || !updatedServerData) {
            showError('Parâmetros inválidos para atualizar servidor');
            return;
        }

        setGroups(prev => {
            if (!Array.isArray(prev)) return [];
            
            return prev.map((group, index) => {
                if (index === groupIndex && group && Array.isArray(group.servers)) {
                    return {
                        ...group,
                        servers: group.servers.map(server => {
                            if (server && server.id === serverId) {
                                return { ...server, ...updatedServerData };
                            }
                            return server;
                        })
                    };
                }
                return group;
            });
        });

        showSuccess('Servidor atualizado com sucesso');
    }, [showError, showSuccess]);

    const handleUpdateGroup = useCallback((groupIndex, newGroupName) => {
        if (typeof groupIndex !== 'number' || !newGroupName || typeof newGroupName !== 'string') {
            showError('Parâmetros inválidos para atualizar grupo');
            return;
        }

        setGroups(prev => {
            if (!Array.isArray(prev)) return [];
            
            return prev.map((group, index) => {
                if (index === groupIndex && group) {
                    return { ...group, groupName: newGroupName.trim() };
                }
                return group;
            });
        });

        showSuccess('Grupo atualizado com sucesso');
    }, [showError, showSuccess]);


    // src/App.js - Adicione estas funções

        const handleAddVncGroup = useCallback((name) => {
            const newGroup = { id: Date.now(), groupName: name.trim(), connections: [] };
            setVncGroups(prev => [...prev, newGroup]);
            showSuccess(`Grupo VNC "${name.trim()}" criado com sucesso`);
        }, [showSuccess]);

        const handleAddVncConnection = useCallback((groupId, connectionData) => {
            setVncGroups(prev => prev.map(group => {
                if (group.id === groupId) {
                    // Garante que a propriedade 'connections' existe e é um array
                    const existingConnections = Array.isArray(group.connections) ? group.connections : [];
                    return {
                        ...group,
                        connections: [...existingConnections, connectionData]
                    };
                }
                return group;
            }));
            showSuccess(`Conexão "${connectionData.name}" adicionada com sucesso`);
        }, [showSuccess]);

        const handleDeleteVncConnection = useCallback((groupId, connectionId, connectionName) => {
            // Reutiliza o diálogo de confirmação global
            setDialogConfig({
                message: `Tem certeza que deseja deletar a conexão VNC "${connectionName}"?`,
                onConfirm: () => {
                    setVncGroups(prev => prev.map(group => {
                        if (group.id === groupId) {
                            return { ...group, connections: group.connections.filter(c => c.id !== connectionId) };
                        }
                        return group;
                    }));
                    showSuccess(`Conexão "${connectionName}" deletada.`);
                },
                isOpen: true
            });
        }, [showSuccess]);

        const handleDeleteVncGroup = useCallback((groupId, groupName) => {
            setDialogConfig({
                message: `Tem certeza que deseja deletar o grupo VNC "${groupName}" e todas as suas conexões?`,
                onConfirm: () => {
                    setVncGroups(prev => prev.filter(g => g.id !== groupId));
                    showSuccess(`Grupo VNC "${groupName}" deletado.`);
                },
                isOpen: true
            });
        }, [showSuccess]);

    // Handlers simplificados para conectividade
    const handleTestAllServers = useCallback(async () => {
        if (!globalConnectivityEnabled || !connectivity || !connectivity.testMultipleServers) {
            showError('Sistema de conectividade desabilitado ou indisponível');
            return;
        }

        if (allServers.length === 0) {
            showError('Nenhum servidor para testar');
            return;
        }

        try {
            console.log(`🧪 Testando ${allServers.length} servidores...`);
            await connectivity.testMultipleServers(allServers);
            showSuccess(`Teste iniciado para ${allServers.length} servidor(es)`);
        } catch (error) {
            console.error('❌ Erro no teste:', error);
            showError(`Erro no teste: ${error.message || 'Erro desconhecido'}`);
        }
    }, [globalConnectivityEnabled, connectivity, allServers, showError, showSuccess]);

    const handleClearCache = useCallback(() => {
        try {
            if (connectivity && connectivity.clearCache) {
                connectivity.clearCache();
                showSuccess('Cache de conectividade limpo');
            } else {
                showError('Função de limpar cache não disponível');
            }
        } catch (error) {
            console.error('❌ Erro ao limpar cache:', error);
            showError('Erro ao limpar cache');
        }
    }, [connectivity, showError, showSuccess]);

    const handleToggleConnectivity = useCallback(() => {
        setGlobalConnectivityEnabled(prev => !prev);
        // NÃO chama showSuccess aqui para evitar loop infinito
    }, []);

    // Handlers de diálogo
    const handleConfirmDelete = useCallback(() => {
        if (dialogConfig && typeof dialogConfig.onConfirm === 'function') {
            try {
                dialogConfig.onConfirm();
            } catch (error) {
                console.error('❌ Erro ao confirmar ação:', error);
            }
        }
        setDialogConfig(null);
    }, [dialogConfig]);

    const openDeleteGroupDialog = useCallback((groupId, groupName) => {
        if (groupId && groupName) {
            setDialogConfig({
                message: `Tem certeza que deseja deletar o grupo "${groupName}" e todos os seus servidores?`,
                onConfirm: () => handleDeleteGroup(groupId),
                isOpen: true,
            });
        }
    }, [handleDeleteGroup]);


    const openDeleteServerDialog = useCallback((groupId, serverId, serverName) => {
        if (groupId && serverId && serverName) {
            setDialogConfig({
                message: `Tem certeza que deseja deletar o servidor "${serverName}"?`,
                onConfirm: () => handleDeleteServer(groupId, serverId),
                isOpen: true,
            });
        }
    }, [handleDeleteServer]);

    const closeBanner = useCallback((type) => {
        if (type === 'error') {
            setErrorBanner(null);
        } else if (type === 'success') {
            setSuccessBanner(null);
        }
    }, []);

    const handleSearchChange = useCallback((event) => {
        if (event && event.target && typeof event.target.value === 'string') {
            setSearchTerm(event.target.value);
        }
    }, []);

    // ==========================
    // RENDER SEGURO
    // ==========================
    return (
        <div className="app">
            {/* Header com stats */}
            <header className="app-header">
                <div className="header-content">
                    <h1>🖥️ Gerenciador RDP/SSH Enterprise</h1>
                    
                    {/* Stats bar simplificada */}
                    <div className="stats-bar">
                        <div className="stat-item">
                            📊 Total: {connectivityStats.total}
                        </div>
                        <div className="stat-item active-connections">
                            ✅ Online: {connectivityStats.online}
                        </div>
                        <div className="stat-item">
                            ❌ Offline: {connectivityStats.offline}
                        </div>
                        <div className="stat-item">
                            🔄 Testando: {connectivityStats.testing}
                        </div>
                        <div className="stat-item">
                            🔌 Conexões: {activeConnections.length}
                        </div>
                    </div>
                </div>
            </header>

            {/* Banners de erro e sucesso */}
            {errorBanner && (
                <div className="error-banner error">
                    <div className="error-message">
                        <span className="error-icon">❌</span>
                        <span>{errorBanner.message}</span>
                    </div>
                    <button
                        className="error-close"
                        onClick={() => closeBanner('error')}
                        aria-label="Fechar"
                    >
                        ✕
                    </button>
                </div>
            )}

            {successBanner && (
                <div className="error-banner success">
                    <div className="error-message">
                        <span className="error-icon">✅</span>
                        <span>{successBanner.message}</span>
                    </div>
                    <button
                        className="error-close"
                        onClick={() => closeBanner('success')}
                        aria-label="Fechar"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Toolbar */}
            <div className="toolbar">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="🔍 Buscar grupos e servidores..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="search-input"
                    />
                    {filteredGroups.length !== groups.length && (
                        <div className="search-results">
                            {filteredGroups.length} de {groups.length} grupo(s)
                        </div>
                    )}
                </div>

                <div className="toolbar-actions">
                    <div className="edit-mode-toggle">
                        <input
                            type="checkbox"
                            id="connectivity-toggle"
                            checked={globalConnectivityEnabled}
                            onChange={handleToggleConnectivity}
                        />
                        <label htmlFor="connectivity-toggle">
                            🔌 Conectividade Ativa
                        </label>
                    </div>

                    <button
                        onClick={handleTestAllServers}
                        disabled={!globalConnectivityEnabled || allServers.length === 0}
                        className="toolbar-btn"
                    >
                        🧪 Testar Todos
                    </button>

                    <button
                        onClick={handleClearCache}
                        disabled={!globalConnectivityEnabled}
                        className="toolbar-btn secondary"
                    >
                        🧹 Limpar Cache
                    </button>

                    <button
                        onClick={() => setShowAddGroupForm(!showAddGroupForm)}
                        className="toolbar-btn"
                    >
                        {showAddGroupForm ? '❌ Cancelar' : '➕ Novo Grupo'}
                    </button>

                    <div className="edit-mode-toggle">
                        <input
                            type="checkbox"
                            id="edit-mode-toggle"
                            checked={isEditModeEnabled}
                            onChange={(e) => setIsEditModeEnabled(e.target.checked)}
                        />
                        <label htmlFor="edit-mode-toggle">
                            ✏️ Modo Edição
                        </label>
                    </div>
                </div>
            </div>
         <nav className="view-switcher">
                <button
                    className={`view-tab ${activeView === 'RDP/SSH' ? 'active' : ''}`}
                    onClick={() => setActiveView('RDP/SSH')}
                >
                    RDP/SSH
                </button>
                <button
                    className={`view-tab ${activeView === 'VNC' ? 'active' : ''}`}
                    onClick={() => setActiveView('VNC')}
                >
                    VNC
                </button>
            </nav>


            {/* Formulário de adicionar grupo */}
            {showAddGroupForm && (
                <div className="groups-container">
                    <AddGroupForm 
                        onAddGroup={handleAddGroup}
                        onCancel={() => setShowAddGroupForm(false)}
                    />
                </div>
            )}

            {/* Container principal */}
            <main className="groups-container">
                {activeView === 'RDP/SSH' && (
                    <RdpSshView
                        groups={groups}
                        filteredGroups={filteredGroups}
                        showAddGroupForm={showAddGroupForm}
                        setShowAddGroupForm={setShowAddGroupForm}
                        handleAddGroup={handleAddGroup}
                        searchTerm={searchTerm}
                        // Props que o Group precisa
                        onAddServer={handleAddServer}
                        onDeleteServer={openDeleteServerDialog}
                        onUpdateServer={handleUpdateServer}
                        onDeleteGroup={openDeleteGroupDialog}
                        onUpdateGroup={handleUpdateGroup}
                        activeConnections={activeConnections}
                        isEditModeEnabled={isEditModeEnabled}
                        isConnectivityEnabled={globalConnectivityEnabled}
                    />
                )}

                {activeView === 'VNC' && (
                    <VncView
                        vncGroups={vncGroups}
                        onAddGroup={handleAddVncGroup}
                        onAddConnection={handleAddVncConnection}
                        onDeleteConnection={handleDeleteVncConnection}
                        onDeleteGroup={handleDeleteVncGroup}
                        isEditModeEnabled={isEditModeEnabled}
                    />
                )}
                
            </main>

            {/* Footer */}
            <footer className="app-footer">
                <div className="footer-content">
                    <div>
                        🚀 Gerenciador RDP/SSH Enterprise v2.0 - Sistema de Conectividade Integrado
                    </div>
                    <div>
                        {groups.length} grupo(s) • {allServers.length} servidor(es) • {activeConnections.length} conexão(ões) ativa(s)
                    </div>
                </div>
            </footer>

            {/* Diálogo de confirmação */}
            {dialogConfig && (
                <ConfirmationDialog
                    isOpen={dialogConfig.isOpen} 
                    message={dialogConfig.message}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setDialogConfig(null)}
                />
            )}
        </div>
    );
}

export default App;