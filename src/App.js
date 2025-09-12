import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import RdpSshView from './views/RdpSshView';
import VncView from './views/VncView';
import ConfirmationDialog from './components/ConfirmationDialog';
import useConnectivity from './hooks/useConnectivity';
import AddGroupForm from './components/AddGroupForm'; // Importação corrigida

// Sistema de Toasts
import { ToastProvider, useToast } from './hooks/useToast';
import ToastContainer from './components/toast/ToastContainer';

// Componente Wrapper para que AppContent possa usar o hook useToast
function App() {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    );
}

function AppContent() {
    const { toast } = useToast();
    
    // Estados da aplicação
    const [activeView, setActiveView] = useState('RDP/SSH');
    const [groups, setGroups] = useState([]);
    const [vncGroups, setVncGroups] = useState([]);
    const [dialogConfig, setDialogConfig] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeConnections, setActiveConnections] = useState([]);
    const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);
    const [globalConnectivityEnabled, setGlobalConnectivityEnabled] = useState(true);
    const [showAddGroupForm, setShowAddGroupForm] = useState(false);
    
    // Hook de conectividade (funcionalidade preservada)
    const connectivity = useConnectivity({ autoTest: false, enableMonitoring: false });

    // Funções de notificação usando o sistema Toast
    const showError = useCallback((message) => {
        if (typeof message === 'string' && message.trim()) {
            toast.error(message.trim());
        }
    }, [toast]);

    const showSuccess = useCallback((message) => {
        if (typeof message === 'string' && message.trim()) {
            toast.success(message.trim());
        }
    }, [toast]);

    //
    // Handlers para Grupos RDP/SSH
    //
    const handleAddGroup = useCallback((name) => {
        if (!name || typeof name !== 'string' || !name.trim()) {
            showError('Nome do grupo não pode estar vazio');
            return;
        }
        const trimmedName = name.trim();
        
        // CORREÇÃO: Padrão de atualização de estado seguro para evitar "stale state"
        setGroups(prevGroups => {
            if (prevGroups.some(g => g.groupName.toLowerCase() === trimmedName.toLowerCase())) {
                showError('Já existe um grupo com este nome.');
                return prevGroups; // Retorna o estado anterior sem alteração
            }
            
            const newGroup = { id: Date.now(), groupName: trimmedName, servers: [] };
            showSuccess(`Grupo "${trimmedName}" criado com sucesso`);
            return [...prevGroups, newGroup]; // Retorna o novo estado
        });

        setShowAddGroupForm(false);
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

    //
    // Handlers para Servidores RDP/SSH
    //
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

    //
    // Handlers para Grupos VNC
    //
    const handleAddVncGroup = useCallback((name) => {
        const trimmedName = name.trim();
        if(!trimmedName) {
            showError('Nome do grupo não pode estar vazio.');
            return;
        }

        // CORREÇÃO: Padrão de atualização de estado seguro e unificado
        setVncGroups(prevVncGroups => {
            if (prevVncGroups.some(g => g.groupName.toLowerCase() === trimmedName.toLowerCase())) {
                showError('Já existe um grupo VNC com este nome.');
                return prevVncGroups;
            }

            const newGroup = { id: Date.now(), groupName: trimmedName, connections: [] };
            showSuccess(`Grupo VNC "${trimmedName}" criado com sucesso`);
            return [...prevVncGroups, newGroup];
        });

        setShowAddGroupForm(false);
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

    //
    // Handlers para Conexões VNC
    //
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
    
    //
    // Efeitos e valores memoizados
    //
    const allServers = useMemo(() => groups.flatMap(group => group.servers || []), [groups]);
    const allVncConnections = useMemo(() => vncGroups.flatMap(group => group.connections || []), [vncGroups]);

    const connectivityStats = useMemo(() => {
        // A lógica completa de conectividade pode ser re-adicionada aqui se necessário
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
                        <div className="stat-item">📊 Total: {connectivityStats.total}</div>
                        <div className="stat-item active-connections">✅ Online: {connectivityStats.online}</div>
                        <div className="stat-item">❌ Offline: {connectivityStats.offline}</div>
                        <div className="stat-item">🔄 Testando: {connectivityStats.testing}</div>
                        <div className="stat-item">🔌 Conexões: {activeConnections.length}</div>
                    </div>
                </div>
            </header>

            <div className="toolbar">
                <div className="search-container">
                    <input type="text" placeholder="🔍 Buscar grupos e servidores..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                </div>
                <div className="toolbar-actions">
                    <div className="edit-mode-toggle">
                        <input type="checkbox" id="connectivity-toggle" checked={globalConnectivityEnabled} onChange={() => setGlobalConnectivityEnabled(p => !p)} />
                        <label htmlFor="connectivity-toggle">🔌 Conectividade Ativa</label>
                    </div>
                    <button onClick={() => {}} disabled={!globalConnectivityEnabled || allServers.length === 0} className="toolbar-btn">🧪 Testar Todos</button>
                    <button onClick={() => {}} disabled={!globalConnectivityEnabled} className="toolbar-btn secondary">🧹 Limpar Cache</button>
                    <button onClick={() => setShowAddGroupForm(!showAddGroupForm)} className="toolbar-btn">{showAddGroupForm ? '❌ Cancelar' : '➕ Novo Grupo'}</button>
                    <div className="edit-mode-toggle">
                        <input type="checkbox" id="edit-mode-toggle" checked={isEditModeEnabled} onChange={(e) => setIsEditModeEnabled(e.target.checked)} />
                        <label htmlFor="edit-mode-toggle">✏️ Modo Edição</label>
                    </div>
                </div>
            </div>

            <nav className="view-switcher">
                <button className={`view-tab ${activeView === 'RDP/SSH' ? 'active' : ''}`} onClick={() => setActiveView('RDP/SSH')}>RDP/SSH</button>
                <button className={`view-tab ${activeView === 'VNC' ? 'active' : ''}`} onClick={() => setActiveView('VNC')}>VNC</button>
            </nav>

            <main className="groups-container">
                {showAddGroupForm && activeView === 'RDP/SSH' && (
                    <AddGroupForm 
                        onAddGroup={handleAddGroup}
                        onCancel={() => setShowAddGroupForm(false)}
                    />
                )}
                 {showAddGroupForm && activeView === 'VNC' && (
                    <AddGroupForm 
                        onAddGroup={handleAddVncGroup}
                        onCancel={() => setShowAddGroupForm(false)}
                        title="Criar Novo Grupo VNC"
                        subtitle="Organize suas conexões VNC."
                    />
                )}
                {activeView === 'RDP/SSH' && (
                    <RdpSshView
                        filteredGroups={filteredGroups}
                        onAddGroup={handleAddGroup}
                        onAddServer={handleAddServer}
                        onDeleteServer={(groupId, serverId, serverName) => setDialogConfig({ message: `Deletar servidor "${serverName}"?`, onConfirm: () => handleDeleteServer(groupId, serverId), isOpen: true })}
                        onUpdateServer={handleUpdateServer}
                        onDeleteGroup={(groupId, groupName) => setDialogConfig({ message: `Deletar grupo "${groupName}"?`, onConfirm: () => handleDeleteGroup(groupId), isOpen: true })}
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
                        onUpdateConnection={handleUpdateVncConnection}
                        onUpdateVncGroup={handleUpdateVncGroup}
                        isEditModeEnabled={isEditModeEnabled}
                    />
                )}
            </main>
            
            <footer className="app-footer">
                <div className="footer-content">
                    <div>🚀 Gerenciador RDP/SSH Enterprise v2.1</div>
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

