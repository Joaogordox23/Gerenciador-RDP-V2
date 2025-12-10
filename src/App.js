import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import './styles/index.css'; // Sistema CSS modular
import ConfirmationDialog from './components/ConfirmationDialog';
import { useConnectivity, ConnectivityProvider } from './hooks/useConnectivity';
import AddGroupForm from './components/AddGroupForm';
import Modal from './components/Modal';
import AddServerForm from './components/AddServerForm';
import AddVncConnectionForm from './components/AddVncConnectionForm';
import { DragDropContext } from 'react-beautiful-dnd';

import { RocketLaunchIcon } from './components/MuiIcons';

// Sistema de Toasts
import { ToastProvider, useToast } from './hooks/useToast';
import ToastContainer from './components/toast/ToastContainer';

// Hook de Grupos
import { useGroups } from './hooks/useGroups';

// Contexts
import { UIProvider, useUI } from './contexts/UIContext';
import { ModalProvider, useModals } from './contexts/ModalContext';

// Modal de Importação do AD
import ADImportModal from './components/ADImportModal';

// Modal de Alteração de Senha Global
import BulkPasswordModal from './components/BulkPasswordModal';

// Modais de Edição
import EditServerModal from './components/EditServerModal';
import EditVncModal from './components/EditVncModal';

// Modal de Configuração do Servidor Guacamole
import GuacamoleServerConfigModal from './components/GuacamoleServerConfigModal';

// Tela de Loading
import LoadingSpinner from './components/LoadingSpinner';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme/AppTheme';
import VncViewerModal from './components/VncViewerModal';
import ConnectionViewerModal from './components/ConnectionViewerModal';

// Lazy loading de views
const RdpSshView = lazy(() => import('./views/RdpSshView'));
const VncView = lazy(() => import('./views/VncView'));
const VncWallView = lazy(() => import('./views/VncWallView'));
const DashboardView = lazy(() => import('./views/DashboardView'));

function App() {
    return (
        <ToastProvider>
            <ConnectivityProvider>
                <UIProvider>
                    <ModalProvider>
                        <AppContent />
                    </ModalProvider>
                </UIProvider>
            </ConnectivityProvider>
        </ToastProvider>
    );
}

function AppContent() {
    const { toast } = useToast();
    const { testAllServers } = useConnectivity();

    // Estados de UI do UIContext
    const {
        theme,
        activeView,
        isSidebarCollapsed,
        rdpViewMode,
        vncViewMode,
        isEditModeEnabled,
        searchTerm,
        setActiveView,
        setRdpViewMode,
        setVncViewMode,
        setSearchTerm,
        toggleTheme,
        toggleSidebar,
        toggleEditMode
    } = useUI();

    // Estados de Modais do ModalContext
    const {
        showAddGroupForm,
        addingToGroupId,
        showADModal,
        showBulkPasswordModal,
        editingServer,
        editingVncConnection,
        activeVncConnection,
        activeRemoteConnection,
        dialogConfig,
        openAddGroupForm,
        closeAddGroupForm,
        openAddServerToGroup,
        closeAddServerToGroup,
        openADModal,
        closeADModal,
        openBulkPasswordModal,
        closeBulkPasswordModal,
        startEditServer,
        closeEditServer,
        startEditVncConnection,
        closeEditVncConnection,
        openVncConnection,
        closeVncConnection,
        openRemoteConnection,
        closeRemoteConnection,
        showConfirmDialog,
        closeDialog
    } = useModals();

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

    const [activeConnections, setActiveConnections] = useState([]);

    // Estado para modal de configuração do Guacamole
    const [showGuacamoleConfig, setShowGuacamoleConfig] = useState(false);
    const [guacamoleConfig, setGuacamoleConfig] = useState(null);

    // Carrega configuração do Guacamole ao iniciar
    useEffect(() => {
        const loadGuacamoleConfig = async () => {
            try {
                if (window.api && window.api.config) {
                    const config = await window.api.config.getGuacamole();
                    setGuacamoleConfig(config);
                }
            } catch (error) {
                console.error('Erro ao carregar config Guacamole:', error);
            }
        };
        loadGuacamoleConfig();
    }, []);

    // Handler para salvar configuração do Guacamole
    const handleSaveGuacamoleConfig = useCallback(async (config) => {
        try {
            if (window.api && window.api.config) {
                await window.api.config.setGuacamole(config);
                setGuacamoleConfig(config);
                toast.success('Configuração do servidor Guacamole salva!');
            }
        } catch (error) {
            console.error('Erro ao salvar config Guacamole:', error);
            toast.error('Erro ao salvar configuração');
        }
    }, [toast]);

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
                window.location.reload();
            }
        } catch (error) {
            console.error('Erro ao atualizar senhas em massa:', error);
            toast.error(`Erro ao atualizar senhas: ${error.message}`);
        }
    }, [toast]);

    // Handler para Salvar Edição de Servidor RDP/SSH
    const handleSaveEditedServer = useCallback((updatedServer) => {
        if (editingServer && editingServer.groupId) {
            handleUpdateServer(editingServer.groupId, updatedServer.id, updatedServer);
            closeEditServer();
            toast.success(`Servidor "${updatedServer.name}" atualizado com sucesso!`);
        }
    }, [editingServer, handleUpdateServer, toast, closeEditServer]);

    // Handler para Salvar Edição de Conexão VNC
    const handleSaveEditedVnc = useCallback((groupId, updatedConnection) => {
        // Passa (groupId, connectionId, updatedData) conforme esperado pelo useGroups
        handleUpdateVncConnection(groupId, updatedConnection.id, updatedConnection);
        closeEditVncConnection();
        toast.success(`Conexão VNC "${updatedConnection.name}" atualizada com sucesso!`);
    }, [handleUpdateVncConnection, toast, closeEditVncConnection]);


    // Wrappers para deletar com confirmação
    const confirmDeleteGroup = useCallback((groupId, groupName) => {
        showConfirmDialog({
            message: `Tem certeza que deseja deletar o grupo "${groupName}"?`,
            onConfirm: () => handleDeleteGroup(groupId)
        });
    }, [handleDeleteGroup, showConfirmDialog]);

    const confirmDeleteVncGroup = useCallback((groupId, groupName) => {
        showConfirmDialog({
            message: `Tem certeza que deseja deletar o grupo VNC "${groupName}" e todas as suas conexões?`,
            onConfirm: () => handleDeleteVncGroup(groupId, groupName)
        });
    }, [handleDeleteVncGroup, showConfirmDialog]);

    const confirmDeleteVncConnection = useCallback((groupId, connectionId, connectionName) => {
        showConfirmDialog({
            message: `Tem certeza que deseja deletar a conexão VNC "${connectionName}"?`,
            onConfirm: () => handleDeleteVncConnection(groupId, connectionId, connectionName)
        });
    }, [handleDeleteVncConnection, showConfirmDialog]);

    const handleConfirmDelete = useCallback(() => {
        if (dialogConfig && typeof dialogConfig.onConfirm === 'function') {
            dialogConfig.onConfirm();
        }
        closeDialog();
    }, [dialogConfig, closeDialog]);

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
            <div className={`App ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} data-color-scheme={theme || 'light'}>
                {isLoading && <LoadingSpinner />}
                <ToastContainer />

                {/* Phase 1 - Sidebar */}
                <Sidebar
                    activeView={activeView}
                    onViewChange={setActiveView}
                    theme={theme}
                    onThemeToggle={toggleTheme}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={toggleSidebar}
                />

                {/* Phase 1 - Header */}
                <Header
                    activeView={activeView}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    isEditModeEnabled={isEditModeEnabled}
                    onToggleEditMode={toggleEditMode}
                    onTestConnectivity={handleTestAllServers}
                    onShowImportAD={openADModal}
                    onShowAddGroup={openAddGroupForm}
                    onShowBulkPassword={openBulkPasswordModal}
                    viewMode={activeView === 'RDP/SSH' ? rdpViewMode : vncViewMode}
                    onToggleViewMode={() => {
                        if (activeView === 'RDP/SSH') {
                            setRdpViewMode(rdpViewMode === 'grid' ? 'list' : 'grid');
                        } else if (activeView === 'VNC') {
                            setVncViewMode(vncViewMode === 'grid' ? 'list' : 'grid');
                        }
                    }}
                    onShowGuacamoleConfig={() => setShowGuacamoleConfig(true)}
                />
                {/* Main Content Area */}
                <main className="app-main-content">
                    <DragDropContext onDragEnd={handleOnDragEnd}>
                        <ADImportModal
                            isOpen={showADModal}
                            onClose={closeADModal}
                            onImport={handleImportFromAD}
                            groups={groups}
                            vncGroups={vncGroups}
                        />
                        <BulkPasswordModal
                            isOpen={showBulkPasswordModal}
                            onClose={closeBulkPasswordModal}
                            onApply={handleBulkPasswordUpdate}
                            groups={groups}
                            vncGroups={vncGroups}
                        />
                        <Modal
                            isOpen={showAddGroupForm}
                            onClose={closeAddGroupForm}
                            title={activeView === 'RDP/SSH' ? 'Criar Novo Grupo RDP/SSH' : 'Criar Novo Grupo VNC'}
                        >
                            <AddGroupForm
                                onAddGroup={activeView === 'RDP/SSH' ? handleAddGroup : handleAddVncGroup}
                                onCancel={closeAddGroupForm}
                                subtitle={activeView === 'RDP/SSH' ? 'Organize seus servidores.' : 'Organize suas conexões.'}
                            />
                        </Modal>
                        <Modal
                            isOpen={!!addingToGroupId}
                            onClose={closeAddServerToGroup}
                            title={activeView === 'RDP/SSH' ? 'Adicionar Novo Servidor' : 'Adicionar Nova Conexão VNC'}
                        >
                            {activeView === 'RDP/SSH' ? (
                                <AddServerForm
                                    onAddServer={(serverData) => {
                                        handleAddServer(addingToGroupId, serverData);
                                        closeAddServerToGroup();
                                    }}
                                    onCancel={closeAddServerToGroup}
                                />
                            ) : (
                                <AddVncConnectionForm
                                    onAddConnection={(connectionData) => {
                                        handleAddVncConnection(addingToGroupId, connectionData);
                                        closeAddServerToGroup();
                                    }}
                                    onCancel={closeAddServerToGroup}
                                />
                            )}
                        </Modal>
                        <Suspense fallback={<LoadingSpinner />}>
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
                                    onDeleteServer={(groupId, serverId, serverName) => showConfirmDialog({ message: `Deletar servidor "${serverName}"?`, onConfirm: () => handleDeleteServer(groupId, serverId) })}
                                    onUpdateServer={handleUpdateServer}
                                    onEditServer={(server, groupId) => startEditServer({ server, groupId })}
                                    onDeleteGroup={confirmDeleteGroup}
                                    onUpdateGroup={handleUpdateGroup}
                                    activeConnections={activeConnections}
                                    isEditModeEnabled={isEditModeEnabled}
                                    onShowAddGroupForm={openAddGroupForm}
                                    onShowAddServerModal={openAddServerToGroup}
                                    onRemoteConnect={openRemoteConnection}
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
                                    onEditVnc={(connection, groupId) => startEditVncConnection({ connection, groupId })}
                                    onUpdateVncGroup={handleUpdateVncGroup}
                                    isEditModeEnabled={isEditModeEnabled}
                                    onShowAddConnectionModal={openAddServerToGroup}
                                    viewMode={vncViewMode}
                                    onVncConnect={openVncConnection}
                                />
                            )}
                            {activeView === 'VNC Wall' && (
                                <VncWallView
                                    vncGroups={vncGroups}
                                    activeConnections={activeConnections}
                                    setActiveConnections={setActiveConnections}
                                    searchTerm={searchTerm}
                                />
                            )}

                        </Suspense>
                    </DragDropContext>
                </main>
                <footer className="app-footer">
                    <div className="footer-content">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <RocketLaunchIcon sx={{ fontSize: 16, marginRight: '8px', color: 'primary.main' }} />
                            Gerenciador Enterprise v4.2.0
                        </div>
                        <div>{groups.length + vncGroups.length} grupo(s) {allServers.length + allVncConnections.length} item(ns)</div>
                    </div>
                </footer>
                {dialogConfig && dialogConfig.isOpen && (
                    <ConfirmationDialog
                        isOpen={dialogConfig.isOpen}
                        message={dialogConfig.message}
                        onConfirm={handleConfirmDelete}
                        onCancel={closeDialog}
                    />
                )}

                {/* Modais de Edição */}
                {editingServer && (
                    <EditServerModal
                        server={editingServer.server}
                        onSave={handleSaveEditedServer}
                        onCancel={closeEditServer}
                    />
                )}

                {editingVncConnection && (
                    <EditVncModal
                        connection={editingVncConnection.connection}
                        groupId={editingVncConnection.groupId}
                        onSave={handleSaveEditedVnc}
                        onCancel={closeEditVncConnection}
                    />
                )}

                {/* Modal de conexão VNC (noVNC) */}
                {activeVncConnection && (
                    <VncViewerModal
                        connectionInfo={activeVncConnection}
                        onClose={closeVncConnection}
                    />
                )}

                {/* Modal de conexão remota (Guacamole) */}
                {activeRemoteConnection && (
                    <ConnectionViewerModal
                        connectionInfo={activeRemoteConnection}
                        onClose={closeRemoteConnection}
                    />
                )}

                {/* Modal de Configuração do Servidor Guacamole */}
                <GuacamoleServerConfigModal
                    isOpen={showGuacamoleConfig}
                    onClose={() => setShowGuacamoleConfig(false)}
                    onSave={handleSaveGuacamoleConfig}
                    initialConfig={guacamoleConfig}
                />
            </div>
        </ThemeProvider >
    );
}

export default App;