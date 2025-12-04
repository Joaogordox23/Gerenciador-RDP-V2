import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import RdpSshView from './views/RdpSshView';
import VncView from './views/VncView';
import VncWallView from './views/VncWallView'; // ✨ v4.0:VNC Wall
import ConfirmationDialog from './components/ConfirmationDialog';
import { useConnectivity, ConnectivityProvider } from './hooks/useConnectivity';
import AddGroupForm from './components/AddGroupForm';
import Modal from './components/Modal';
import AddServerForm from './components/AddServerForm';
import AddVncConnectionForm from './components/AddVncConnectionForm';
import DashboardView from './views/DashboardView';
import { DragDropContext } from 'react-beautiful-dnd';
import {
    ComputerIcon,
    LayersIcon,
    CheckCircleOutlineIcon,
    CancelIcon,
    LinkIcon,
    CloudDownloadIcon,
    LightModeIcon,
    DarkModeIcon,
    AddCircleOutlineIcon,
    CloseIcon,
    SearchIcon,
    RocketLaunchIcon,
    LockIcon,
    GridViewIcon,
    ViewListIcon
} from './components/MuiIcons';

// Sistema de Toasts
import { ToastProvider, useToast } from './hooks/useToast';
import ToastContainer from './components/toast/ToastContainer';

// Hook de Grupos
import { useGroups } from './hooks/useGroups';

// Modal de Importação do AD
import ADImportModal from './components/ADImportModal';

// Modal de Alteração de Senha Global
import BulkPasswordModal from './components/BulkPasswordModal';

// Tela de Loading
import LoadingSpinner from './components/LoadingSpinner';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme/AppTheme';

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
    // ✨ v4.0: Adicionando dados de conectividade em tempo real para o Dashboard
    const { testAllServers, results: connectivityResults, isTesting: testingSet, generateServerKey } = useConnectivity();
    const [activeView, setActiveView] = useState('Dashboard');

    // Usando o hook customizado para gerenciar grupos
    const {
        groups,
        setGroups,
        vncGroups,
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
        isLoading
    } = useGroups(toast);

    const [dialogConfig, setDialogConfig] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeConnections, setActiveConnections] = useState([]);
    const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);
    const [showAddGroupForm, setShowAddGroupForm] = useState(false);
    const [addingToGroupId, setAddingToGroupId] = useState(null);
    const [theme, setTheme] = useState(null);
    const [rdpViewMode, setRdpViewMode] = useState('grid');
    const [vncViewMode, setVncViewMode] = useState('grid');
    const [showADModal, setShowADModal] = useState(false);
    const [showBulkPasswordModal, setShowBulkPasswordModal] = useState(false);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    const showSuccess = useCallback((message) => {
        if (typeof message === 'string' && message.trim()) toast.success(message.trim());
    }, [toast]);

    // Handler para Importação do AD
    const handleImportFromAD = useCallback((targetGroupId, servers, type) => {
        if (type === 'rdp') {
            servers.forEach(server => handleAddServer(targetGroupId, server));
        } else {
            servers.forEach(server => handleAddVncConnection(targetGroupId, server));
        }
        showSuccess(`${servers.length} computadores importados com sucesso!`);
    }, [handleAddServer, handleAddVncConnection, showSuccess]);

    // Handler para Alteração de Senha Global
    const handleBulkPasswordUpdate = useCallback(async (data) => {
        try {
            if (!window.api || !window.api.bulkUpdatePassword) {
                toast.error('API de alteração em massa não disponível');
                return;
            }

            const result = await window.api.bulkUpdatePassword(data);

            if (result.success) {
                toast.success(`✅ ${result.updated} servidor(es) atualizado(s) com sucesso!`);
                if (result.failed > 0) {
                    toast.warning(`⚠️ ${result.failed} servidor(es) falharam na atualização`);
                }
                // Força reload dos dados para refletir mudanças
                window.location.reload();
            }
        } catch (error) {
            console.error('Erro ao atualizar senhas em massa:', error);
            toast.error(`Erro ao atualizar senhas: ${error.message}`);
        }
    }, [toast]);

    // Wrappers para deletar com confirmação
    const confirmDeleteGroup = useCallback((groupId, groupName) => {
        setDialogConfig({
            message: `Tem certeza que deseja deletar o grupo "${groupName}"?`,
            onConfirm: () => handleDeleteGroup(groupId),
            isOpen: true
        });
    }, [handleDeleteGroup]);

    const confirmDeleteVncGroup = useCallback((groupId, groupName) => {
        setDialogConfig({
            message: `Tem certeza que deseja deletar o grupo VNC "${groupName}" e todas as suas conexões?`,
            onConfirm: () => handleDeleteVncGroup(groupId, groupName),
            isOpen: true
        });
    }, [handleDeleteVncGroup]);

    const confirmDeleteVncConnection = useCallback((groupId, connectionId, connectionName) => {
        setDialogConfig({
            message: `Tem certeza que deseja deletar a conexão VNC "${connectionName}"?`,
            onConfirm: () => handleDeleteVncConnection(groupId, connectionId, connectionName),
            isOpen: true
        });
    }, [handleDeleteVncConnection]);

    const handleConfirmDelete = useCallback(() => {
        if (dialogConfig && typeof dialogConfig.onConfirm === 'function') {
            dialogConfig.onConfirm();
        }
        setDialogConfig(null);
    }, [dialogConfig]);

    const allServers = useMemo(() => {
        return groups.flatMap(group =>
            (group.servers || []).map(server => ({
                ...server,
                groupName: group.groupName
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

    // ✨ v4.0: Estatísticas de conectividade em tempo real
    const connectivityStats = useMemo(() => {
        const stats = {
            total: allServers.length,
            online: 0,
            offline: 0,
            partial: 0,
            testing: 0,
            unknown: 0,
            error: 0
        };

        stats.testing = testingSet.size;

        allServers.forEach(server => {
            const serverKey = generateServerKey(server);
            const result = connectivityResults.get(serverKey);

            if (!result) {
                stats.unknown++;
            } else {
                switch (result.status) {
                    case 'online': stats.online++; break;
                    case 'offline': stats.offline++; break;
                    case 'partial': stats.partial++; break;
                    case 'error': stats.error++; break;
                    default: stats.unknown++;
                }
            }
        });

        return stats;
    }, [allServers, connectivityResults, testingSet, generateServerKey]);

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

    const filteredVncGroups = useMemo(() => {
        if (!searchTerm) return vncGroups;
        return vncGroups.filter(group => {
            const term = searchTerm.toLowerCase();
            const groupNameMatches = group.groupName.toLowerCase().includes(term);
            const connectionMatches = (group.connections || []).some(conn =>
                conn.name.toLowerCase().includes(term) || conn.ipAddress.toLowerCase().includes(term)
            );
            return groupNameMatches || connectionMatches;
        });
    }, [vncGroups, searchTerm]);

    const handleOnDragEnd = useCallback((result) => {
        const { destination, source, type } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        try {
            if (type === 'group') {
                const newGroups = Array.from(groups);
                const [reorderedItem] = newGroups.splice(source.index, 1);
                newGroups.splice(destination.index, 0, reorderedItem);
                setGroups(newGroups);
                toast.success(`Grupo "${reorderedItem.groupName}" reordenado`);
                return;
            }

            const startGroupId = source.droppableId;
            const finishGroupId = destination.droppableId;
            const startGroup = groups.find(g => g.id.toString() === startGroupId.toString());
            const finishGroup = groups.find(g => g.id.toString() === finishGroupId.toString());

            if (!startGroup || !finishGroup) {
                toast.error('Erro ao mover item: Grupo de destino não encontrado.');
                return;
            }

            if (startGroup === finishGroup) {
                const newServers = Array.from(startGroup.servers);
                const [reorderedItem] = newServers.splice(source.index, 1);
                newServers.splice(destination.index, 0, reorderedItem);

                const newGroup = { ...startGroup, servers: newServers };
                const newGroups = groups.map(g => g.id === newGroup.id ? newGroup : g);
                setGroups(newGroups);
                toast.success(`Servidor "${reorderedItem.name}" reordenado`);
            } else {
                const startServers = Array.from(startGroup.servers);
                const [movedItem] = startServers.splice(source.index, 1);

                const finishServers = Array.from(finishGroup.servers);
                finishServers.splice(destination.index, 0, movedItem);

                const newStartGroup = { ...startGroup, servers: startServers };
                const newFinishGroup = { ...finishGroup, servers: finishServers };

                const newGroups = groups.map(g => {
                    if (g.id === newStartGroup.id) return newStartGroup;
                    if (g.id === newFinishGroup.id) return newFinishGroup;
                    return g;
                });
                setGroups(newGroups);
                toast.success(`Servidor "${movedItem.name}" movido para "${finishGroup.groupName}"`);
            }
        } catch (error) {
            console.error('Erro no drag and drop:', error);
            toast.error('Erro ao reorganizar items. Tente novamente.');
        }
    }, [groups, toast, setGroups]);

    useEffect(() => {
        const loadTheme = async () => {
            if (window.api && window.api.getOsTheme) {
                try {
                    const osTheme = await window.api.getOsTheme();
                    setTheme(osTheme);
                } catch (error) {
                    console.error("Não foi possível obter o tema do SO, usando 'dark' como padrão.", error);
                    setTheme('dark');
                }
            } else {
                setTheme('dark');
            }
        };
        loadTheme();
    }, []);

    useEffect(() => {
        if (theme) {
            document.documentElement.setAttribute('data-color-scheme', theme);
        }
    }, [theme]);

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

    const muiTheme = useMemo(() => getTheme(theme || 'light'), [theme]);

    return (
        <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <div className="app">
                {isLoading && <LoadingSpinner />}
                <ToastContainer />
                <header className="app-header">
                    <div className="header-content">
                        <h1>
                            <ComputerIcon sx={{ fontSize: 32, marginRight: 2, verticalAlign: 'middle' }} />
                            Gerenciador RDP/SSH Enterprise
                        </h1>
                        <div className="stats-bar">
                            <div className="stat-item">
                                <LayersIcon sx={{ fontSize: 20, marginRight: 1, verticalAlign: 'middle' }} />
                                Total: {allServers.length}
                            </div>
                            <div className="stat-item active-connections">
                                <CheckCircleOutlineIcon sx={{ fontSize: 20, marginRight: 1, verticalAlign: 'middle' }} />
                                Online: {connectivityStats.online}
                            </div>
                            <div className="stat-item">
                                <CancelIcon sx={{ fontSize: 20, marginRight: 1, verticalAlign: 'middle' }} />
                                Offline: {connectivityStats.offline}
                            </div>
                            <div className="stat-item">
                                <LinkIcon sx={{ fontSize: 20, marginRight: 1, verticalAlign: 'middle' }} />
                                Conexões: {activeConnections.length}
                            </div>
                        </div>
                    </div>
                </header>
                <div className="toolbar">
                    <div className="search-container">
                        <SearchIcon sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: 'text.secondary', pointerEvents: 'none' }} />
                        <input
                            type="text"
                            className="search-input"
                            style={{ paddingLeft: '40px' }}
                            placeholder="Buscar por nome do grupo, servidor ou IP..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="toolbar-actions">
                        <button onClick={() => setShowADModal(true)} className="toolbar-btn secondary" title="Importar do AD">
                            <CloudDownloadIcon sx={{ fontSize: 18, marginRight: 1 }} />
                            Importar AD
                        </button>

                        {/* Toggle View Mode - RDP/SSH */}
                        {activeView === 'RDP/SSH' && (
                            <button
                                onClick={() => setRdpViewMode(rdpViewMode === 'grid' ? 'list' : 'grid')}
                                className="toolbar-btn secondary"
                                title={rdpViewMode === 'grid' ? 'Visualização em Lista' : 'Visualização em Grid'}
                            >
                                {rdpViewMode === 'grid' ?
                                    <ViewListIcon sx={{ fontSize: 18 }} /> :
                                    <GridViewIcon sx={{ fontSize: 18 }} />
                                }
                            </button>
                        )}
                        {/* Toggle View Mode - VNC */}
                        {activeView === 'VNC' && (
                            <button
                                onClick={() => setVncViewMode(vncViewMode === 'grid' ? 'list' : 'grid')}
                                className="toolbar-btn secondary"
                                title={vncViewMode === 'grid' ? 'Visualização em Lista' : 'Visualização em Grid'}
                            >
                                {vncViewMode === 'grid' ?
                                    <ViewListIcon sx={{ fontSize: 18 }} /> :
                                    <GridViewIcon sx={{ fontSize: 18 }} />
                                }
                            </button>
                        )}

                        {isEditModeEnabled && (
                            <button onClick={() => setShowBulkPasswordModal(true)} className="toolbar-btn secondary" title="Alterar Senha Global">
                                <LockIcon sx={{ fontSize: 18, marginRight: 1 }} />
                                Senha Global
                            </button>
                        )}
                        <button onClick={toggleTheme} className="toolbar-btn secondary" title="Alternar Tema">
                            {theme === 'dark' ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
                        </button>
                        <button onClick={() => setShowAddGroupForm(!showAddGroupForm)} className="toolbar-btn">
                            {showAddGroupForm ? (
                                <><CloseIcon sx={{ fontSize: 18, marginRight: 1 }} /> Cancelar</>
                            ) : (
                                <><AddCircleOutlineIcon sx={{ fontSize: 18, marginRight: 1 }} /> Novo Grupo</>
                            )}
                        </button>
                        <label htmlFor="edit-mode-toggle" className="edit-mode-toggle" title="Ativar/Desativar edição">
                            <span>Modo Edição</span>
                            <input
                                id="edit-mode-toggle"
                                type="checkbox"
                                checked={isEditModeEnabled}
                                onChange={() => setIsEditModeEnabled(!isEditModeEnabled)}
                            />
                            <span className="toggle-switch"></span>
                        </label>
                    </div>
                </div>
                <nav className="view-switcher">
                    <button className={`view-tab ${activeView === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveView('Dashboard')}>Dashboard</button>
                    <button className={`view-tab ${activeView === 'RDP/SSH' ? 'active' : ''}`} onClick={() => setActiveView('RDP/SSH')}>RDP/SSH</button>
                    <button className={`view-tab ${activeView === 'VNC' ? 'active' : ''}`} onClick={() => setActiveView('VNC')}>VNC</button>
                    <button className={`view-tab ${activeView === 'VNC Wall' ? 'active' : ''}`} onClick={() => setActiveView('VNC Wall')}>VNC Wall</button>
                </nav>
                <main className="groups-container">
                    <DragDropContext onDragEnd={handleOnDragEnd}>
                        <ADImportModal
                            isOpen={showADModal}
                            onClose={() => setShowADModal(false)}
                            onImport={handleImportFromAD}
                            groups={groups}
                            vncGroups={vncGroups}
                        />
                        <BulkPasswordModal
                            isOpen={showBulkPasswordModal}
                            onClose={() => setShowBulkPasswordModal(false)}
                            onApply={handleBulkPasswordUpdate}
                            groups={groups}
                            vncGroups={vncGroups}
                        />
                        <Modal
                            isOpen={showAddGroupForm}
                            onClose={() => setShowAddGroupForm(false)}
                            title={activeView === 'RDP/SSH' ? 'Criar Novo Grupo RDP/SSH' : 'Criar Novo Grupo VNC'}
                        >
                            <AddGroupForm
                                onAddGroup={activeView === 'RDP/SSH' ? handleAddGroup : handleAddVncGroup}
                                onCancel={() => setShowAddGroupForm(false)}
                                subtitle={activeView === 'RDP/SSH' ? 'Organize seus servidores.' : 'Organize suas conexões.'}
                            />
                        </Modal>
                        <Modal
                            isOpen={!!addingToGroupId}
                            onClose={() => setAddingToGroupId(null)}
                            title={activeView === 'RDP/SSH' ? 'Adicionar Novo Servidor' : 'Adicionar Nova Conexão VNC'}
                        >
                            {activeView === 'RDP/SSH' ? (
                                <AddServerForm
                                    onAddServer={(serverData) => {
                                        handleAddServer(addingToGroupId, serverData);
                                        setAddingToGroupId(null);
                                    }}
                                    onCancel={() => setAddingToGroupId(null)}
                                />
                            ) : (
                                <AddVncConnectionForm
                                    onAddConnection={(connectionData) => {
                                        handleAddVncConnection(addingToGroupId, connectionData);
                                        setAddingToGroupId(null);
                                    }}
                                    onCancel={() => setAddingToGroupId(null)}
                                />
                            )}
                        </Modal>
                        {activeView === 'Dashboard' && (
                            <DashboardView
                                servers={allServers}
                                onTestAll={handleTestAllServers}
                            />
                        )}
                        {activeView === 'RDP/SSH' && (
                            <RdpSshView
                                filteredGroups={filteredGroups}
                                onAddServer={(groupId, serverData) => handleAddServer(groupId, serverData)}
                                onDeleteServer={(groupId, serverId, serverName) => setDialogConfig({ message: `Deletar servidor "${serverName}"?`, onConfirm: () => handleDeleteServer(groupId, serverId), isOpen: true })}
                                onUpdateServer={handleUpdateServer}
                                onDeleteGroup={confirmDeleteGroup}
                                onUpdateGroup={handleUpdateGroup}
                                activeConnections={activeConnections}
                                isEditModeEnabled={isEditModeEnabled}
                                onShowAddGroupForm={() => setShowAddGroupForm(true)}
                                onShowAddServerModal={setAddingToGroupId}
                                viewMode={rdpViewMode}
                            />
                        )}
                        {activeView === 'VNC' && (
                            <VncView
                                vncGroups={filteredVncGroups}
                                onAddGroup={handleAddVncGroup}
                                onAddConnection={(groupId, connectionData) => handleAddVncConnection(groupId, connectionData)}
                                onDeleteConnection={confirmDeleteVncConnection}
                                onDeleteGroup={confirmDeleteVncGroup}
                                onUpdateConnection={handleUpdateVncConnection}
                                onUpdateVncGroup={handleUpdateVncGroup}
                                isEditModeEnabled={isEditModeEnabled}
                                onShowAddConnectionModal={setAddingToGroupId}
                                viewMode={vncViewMode}
                            />
                        )}
                        {activeView === 'VNC Wall' && (
                            <VncWallView
                                vncGroups={vncGroups}
                                activeConnections={activeConnections}
                                setActiveConnections={setActiveConnections}
                            />
                        )}
                    </DragDropContext>
                </main>
                <footer className="app-footer">
                    <div className="footer-content">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <RocketLaunchIcon sx={{ fontSize: 16, marginRight: '8px', color: 'primary.main' }} />
                            Gerenciador Enterprise v4.0
                        </div>
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
        </ThemeProvider>
    );
}

export default App;