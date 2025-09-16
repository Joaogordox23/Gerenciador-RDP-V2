import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import RdpSshView from './views/RdpSshView';
import VncView from './views/VncView';
import ConfirmationDialog from './components/ConfirmationDialog';
import { useConnectivity, ConnectivityProvider } from './hooks/useConnectivity';
import AddGroupForm from './components/AddGroupForm';
import Modal from './components/Modal';
import AddServerForm from './components/AddServerForm'; 
import AddVncConnectionForm from './components/AddVncConnectionForm';
import DashboardView from './views/DashboardView';

// Sistema de Toasts
import { ToastProvider, useToast } from './hooks/useToast';
import ToastContainer from './components/toast/ToastContainer';

// --- Ícones para a Barra de Estatísticas ---
const TotalIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>);
const OnlineIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>);
const OfflineIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>);
const ConnectionsIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-3 0h15v9a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 3 19.5v-9Z"></path><path d="M12 15a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"></path></svg>);


function App() {
    return (
        <ToastProvider>
            <ConnectivityProvider>
                <AppContent />
            </ConnectivityProvider>
        </ToastProvider>
    );
}

function AppContent() {
    const { toast } = useToast();
     const { testAllServers } = useConnectivity(); 
    const [activeView, setActiveView] = useState('Dashboard');
    const [groups, setGroups] = useState([]);
    const [vncGroups, setVncGroups] = useState([]);
    const [dialogConfig, setDialogConfig] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeConnections, setActiveConnections] = useState([]);
    const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);
    const [showAddGroupForm, setShowAddGroupForm] = useState(false);
    const [addingToGroupId, setAddingToGroupId] = useState(null);
    
    const showError = useCallback((message) => {
        if (typeof message === 'string' && message.trim()) toast.error(message.trim());
    }, [toast]);

    const showSuccess = useCallback((message) => {
        if (typeof message === 'string' && message.trim()) toast.success(message.trim());
    }, [toast]);

    // Handlers para Grupos RDP/SSH
    const handleAddGroup = useCallback((name) => {
        const trimmedName = name.trim();
        if(!trimmedName) {
            showError('Nome do grupo não pode estar vazio.');
            return;
        }
        setGroups(prevGroups => {
            if (prevGroups.some(g => g.groupName.toLowerCase() === trimmedName.toLowerCase())) {
                showError('Já existe um grupo com este nome.');
                return prevGroups;
            }
            const newGroup = { id: Date.now(), groupName: trimmedName, servers: [] };
            showSuccess(`Grupo "${trimmedName}" criado com sucesso`);
            setShowAddGroupForm(false);
            return [...prevGroups, newGroup];
        });
    }, [showError, showSuccess]);
    
    const handleUpdateGroup = useCallback((groupId, newGroupName) => {
        const trimmedName = newGroupName.trim();
        if (!trimmedName) {
            showError('O nome do grupo não pode estar vazio.');
            return;
        }
        if (groups.some(g => g.id !== groupId && g.groupName.toLowerCase() === trimmedName.toLowerCase())) {
            showError('Já existe um grupo com este nome.');
            return;
        }
        setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, groupName: trimmedName } : g)));
        showSuccess('Grupo atualizado com sucesso');
    }, [groups, showError, showSuccess]);

    const handleDeleteGroup = useCallback((groupId) => {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        showSuccess('Grupo removido com sucesso');
    }, [showSuccess]);

    // Handlers para Servidores RDP/SSH
    const handleAddServer = useCallback((groupId, serverData) => {
        setGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                const newServer = { ...serverData, id: Date.now() };
                const updatedServers = Array.isArray(group.servers) ? [...group.servers, newServer] : [newServer];
                return { ...group, servers: updatedServers };
            }
            return group;
        }));
        showSuccess(`Servidor "${serverData.name}" adicionado com sucesso.`);
    }, [showSuccess]);

    const handleUpdateServer = useCallback((groupId, serverId, updatedData) => {
        setGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                return { ...group, servers: group.servers.map(s => (s.id === serverId ? { ...s, ...updatedData } : s)) };
            }
            return group;
        }));
        showSuccess('Servidor atualizado com sucesso.');
    }, [showSuccess]);

    const handleDeleteServer = useCallback((groupId, serverId) => {
        setGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                return { ...group, servers: group.servers.filter(s => s.id !== serverId) };
            }
            return group;
        }));
        showSuccess('Servidor removido com sucesso.');
    }, [showSuccess]);

    // Handlers para Grupos VNC
    const handleAddVncGroup = useCallback((name) => {
        const trimmedName = name.trim();
        if(!trimmedName) {
            showError('Nome do grupo não pode estar vazio.');
            return;
        }
        setVncGroups(prevVncGroups => {
            if (prevVncGroups.some(g => g.groupName.toLowerCase() === trimmedName.toLowerCase())) {
                showError('Já existe um grupo VNC com este nome.');
                return prevVncGroups;
            }
            const newGroup = { id: Date.now(), groupName: trimmedName, connections: [] };
            showSuccess(`Grupo VNC "${trimmedName}" criado com sucesso`);
            setShowAddGroupForm(false);
            return [...prevVncGroups, newGroup];
        });
    }, [showError, showSuccess]);

    const handleUpdateVncGroup = useCallback((groupId, newGroupName) => {
        const trimmedName = newGroupName.trim();
        if (!trimmedName) {
            showError("O novo nome do grupo não pode estar vazio.");
            return;
        }
        if (vncGroups.some(g => g.id !== groupId && g.groupName.toLowerCase() === trimmedName.toLowerCase())) {
            showError("Já existe um grupo VNC com este nome.");
            return;
        }
        setVncGroups(prev => prev.map(g => (g.id === groupId ? { ...g, groupName: trimmedName } : g)));
        showSuccess(`Grupo VNC renomeado para "${trimmedName}".`);
    }, [vncGroups, showError, showSuccess]);

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

    // Handlers para Conexões VNC
    const handleAddVncConnection = useCallback((groupId, connectionData) => {
        setVncGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                const newConnection = { ...connectionData, id: Date.now() };
                const updatedConnections = Array.isArray(group.connections) ? [...group.connections, newConnection] : [newConnection];
                return { ...group, connections: updatedConnections };
            }
            return group;
        }));
        showSuccess(`Conexão "${connectionData.name}" adicionada com sucesso`);
    }, [showSuccess]);

    const handleUpdateVncConnection = useCallback((groupId, connectionId, updatedData) => {
        setVncGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                return { ...group, connections: group.connections.map(c => (c.id === connectionId ? { ...c, ...updatedData } : c)) };
            }
            return group;
        }));
        showSuccess('Conexão VNC atualizada com sucesso');
    }, [showSuccess]);

    const handleDeleteVncConnection = useCallback((groupId, connectionId, connectionName) => {
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

    const handleConfirmDelete = useCallback(() => {
        if (dialogConfig && typeof dialogConfig.onConfirm === 'function') {
            dialogConfig.onConfirm();
        }
        setDialogConfig(null);
    }, [dialogConfig]);

    const allServers = useMemo(() => {
        return groups.flatMap(group => 
            // Para cada servidor, retornamos um novo objeto que inclui o nome do grupo
            (group.servers || []).map(server => ({
                ...server,
                groupName: group.groupName // Adicionando o nome do grupo ao objeto do servidor
            }))
        );
    }, [groups]);
    const handleTestAllServers = useCallback(() => {
        if (allServers.length === 0) {
            toast.warning('Não há servidores para testar.');
            return;
        }
        toast.success(`Iniciando teste de conectividade para ${allServers.length} servidores...`);
        testAllServers(allServers);
    }, [allServers, testAllServers, toast]);
    const allVncConnections = useMemo(() => vncGroups.flatMap(group => group.connections || []), [vncGroups]);

    const connectivityStats = useMemo(() => {
        const stats = { total: allServers.length, online: 0, offline: 0, testing: 0, unknown: 0 };
        return stats;
    }, [allServers]);

    const filteredGroups = useMemo(() => {
        if (!searchTerm) return groups;
        return groups.filter(group => {
            const term = searchTerm.toLowerCase();
            const groupNameMatches = group.groupName.toLowerCase().includes(term);
            const serverMatches = (group.servers || []).some(server =>
                server.name.toLowerCase().includes(term) || server.ipAddress.toLowerCase().includes(term)
            );
            return groupNameMatches || serverMatches;
        });
    }, [groups, searchTerm]);

    useEffect(() => {
        const loadData = async () => {
            if (window.api && window.api.storage) {
                const savedGroups = await window.api.storage.get('groups');
                setGroups(Array.isArray(savedGroups) ? savedGroups : []);
                const savedVncGroups = await window.api.storage.get('vncGroups');
                setVncGroups(Array.isArray(savedVncGroups) ? savedVncGroups : []);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        if (window.api && window.api.storage) {
            window.api.storage.set('groups', groups);
            window.api.storage.set('vncGroups', vncGroups);
        }
    }, [groups, vncGroups]);
    
    useEffect(() => {
        if (window.api && window.api.onConnectionStatus) {
            window.api.onConnectionStatus((serverId, status) => {
                setActiveConnections(prev => {
                    if (status === 'active') return [...new Set([...prev, serverId])];
                    return prev.filter(id => id !== serverId);
                });
            });
        }
    }, []);

    return (
        <div className="app">
            <ToastContainer />
            <header className="app-header">
                <div className="header-content">
                    <h1>🖥️ Gerenciador RDP/SSH Enterprise</h1>
                    <div className="stats-bar">
                        <div className="stat-item"><TotalIcon /> Total: {allServers.length}</div>
                        <div className="stat-item active-connections"><OnlineIcon /> Online: {connectivityStats.online}</div>
                        <div className="stat-item"><OfflineIcon /> Offline: {connectivityStats.offline}</div>
                        <div className="stat-item"><ConnectionsIcon /> Conexões: {activeConnections.length}</div>
                    </div>
                </div>
            </header>
            <div className="toolbar">
                <div className="search-container">
                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                </div>
                <div className="toolbar-actions">
                    <button onClick={() => setShowAddGroupForm(!showAddGroupForm)} className="toolbar-btn">
                        {showAddGroupForm ? '✖️ Cancelar' : '➕ Novo Grupo'}
                    </button>
                    <label htmlFor="edit-mode-toggle" className="edit-mode-toggle">
                        <span>Modo Edição</span>
                        <input type="checkbox" id="edit-mode-toggle" checked={isEditModeEnabled} onChange={(e) => setIsEditModeEnabled(e.target.checked)} />
                        <span className="toggle-switch"></span>
                    </label>
                </div>
            </div>
            <nav className="view-switcher">
                <button className={`view-tab ${activeView === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveView('Dashboard')}>Dashboard</button>
                <button className={`view-tab ${activeView === 'RDP/SSH' ? 'active' : ''}`} onClick={() => setActiveView('RDP/SSH')}>RDP/SSH</button>
                <button className={`view-tab ${activeView === 'VNC' ? 'active' : ''}`} onClick={() => setActiveView('VNC')}>VNC</button>
            </nav>
            <main className="groups-container">
                <Modal 
                    isOpen={showAddGroupForm} 
                    onClose={() => setShowAddGroupForm(false)}
                    title={activeView === 'RDP/SSH' ? 'Criar Novo Grupo RDP/SSH' : 'Criar Novo Grupo VNC'}
                >
                    <AddGroupForm 
                        onAddGroup={activeView === 'RDP/SSH' ? handleAddGroup : handleAddVncGroup}
                        onCancel={() => setShowAddGroupForm(false)}
                        // O título e subtítulo agora podem ser passados para o próprio formulário
                        // title={activeView === 'RDP/SSH' ? 'Criar Novo Grupo RDP/SSH' : 'Criar Novo Grupo VNC'}
                        subtitle={activeView === 'RDP/SSH' ? 'Organize seus servidores.' : 'Organize suas conexões.'}
                    />
                </Modal>
                <Modal
                    isOpen={!!addingToGroupId} // O modal abre se addingToGroupId tiver um valor
                    onClose={() => setAddingToGroupId(null)}
                    title={activeView === 'RDP/SSH' ? 'Adicionar Novo Servidor' : 'Adicionar Nova Conexão VNC'}
                >
                    {activeView === 'RDP/SSH' ? (
                        <AddServerForm
                            onAddServer={(serverData) => {
                                handleAddServer(addingToGroupId, serverData);
                                setAddingToGroupId(null); // Fecha o modal após adicionar
                            }}
                            onCancel={() => setAddingToGroupId(null)}
                        />
                    ) : (
                        <AddVncConnectionForm
                            onAddConnection={(connectionData) => {
                                handleAddVncConnection(addingToGroupId, connectionData);
                                setAddingToGroupId(null); // Fecha o modal após adicionar
                            }}
                            onCancel={() => setAddingToGroupId(null)}
                        />
                    )}
                </Modal>
                {activeView === 'RDP/SSH' && (
                    <RdpSshView
                        filteredGroups={filteredGroups}
                        onAddServer={(groupId, serverData) => handleAddServer(groupId, serverData)}
                        onDeleteServer={(groupId, serverId, serverName) => setDialogConfig({ message: `Deletar servidor "${serverName}"?`, onConfirm: () => handleDeleteServer(groupId, serverId), isOpen: true })}
                        onUpdateServer={handleUpdateServer}
                        onDeleteGroup={(groupId, groupName) => setDialogConfig({ message: `Deletar grupo "${groupName}"?`, onConfirm: () => handleDeleteGroup(groupId), isOpen: true })}
                        onUpdateGroup={handleUpdateGroup}
                        activeConnections={activeConnections}
                        isEditModeEnabled={isEditModeEnabled}
                        onShowAddGroupForm={() => setShowAddGroupForm(true)}
                        onShowAddServerModal={setAddingToGroupId}
                        
                    />
                )}
                {activeView === 'Dashboard' && (
                    <DashboardView
                        servers={allServers} // Passamos a lista de todos os servidores
                        onTestAll={handleTestAllServers}
                    />
                )}
                {activeView === 'VNC' && (
                    <VncView
                        vncGroups={vncGroups}
                        onAddGroup={handleAddVncGroup}
                        onAddConnection={(groupId, connectionData) => handleAddVncConnection(groupId, connectionData)}
                        onDeleteConnection={handleDeleteVncConnection}
                        onDeleteGroup={handleDeleteVncGroup}
                        onUpdateConnection={handleUpdateVncConnection}
                        onUpdateVncGroup={handleUpdateVncGroup}
                        isEditModeEnabled={isEditModeEnabled}
                        onShowAddConnectionModal={setAddingToGroupId}
                        
                    />
                )}
            </main>
            <footer className="app-footer">
                <div className="footer-content">
                    <div>🚀 Gerenciador Enterprise v3.1</div>
                    <div>{groups.length + vncGroups.length} grupo(s) • {allServers.length + allVncConnections.length} item(ns)</div>
                </div>
            </footer>
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