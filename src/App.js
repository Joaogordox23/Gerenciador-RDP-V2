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
import Footer from './components/layout/Footer';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme/AppTheme';
import VncViewerModal from './components/VncViewerModal';
import ConnectionViewerModal from './components/ConnectionViewerModal';
import ConnectionTabsContainer from './components/ConnectionTabsContainer';
import QuickConnectVncModal from './components/QuickConnectVncModal';

// Lazy loading de views
const RdpSshView = lazy(() => import('./views/RdpSshView'));
const VncView = lazy(() => import('./views/VncView'));
const VncWallView = lazy(() => import('./views/VncWallView'));
const DashboardView = lazy(() => import('./views/DashboardView'));
const ApplicationsView = lazy(() => import('./views/ApplicationsView'));
const AnyDeskView = lazy(() => import('./views/AnyDeskView'));

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
        appsViewMode,
        isEditModeEnabled,
        searchTerm,
        allGroupsCollapsed,
        setRdpViewMode,
        setVncViewMode,
        setAppsViewMode,
        setSearchTerm,
        toggleTheme,
        toggleSidebar,
        toggleEditMode,
        toggleAllCollapsed,
        changeView
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
        tabConnections,
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
        closeDialog,
        addTabConnection
    } = useModals();

    const {
        groups,
        setGroups,
        vncGroups,
        setVncGroups,
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
        isLoading,
        // DnD functions
        reorderGroups,
        reorderServersInGroup,
        moveServerToGroup
    } = useGroups(toast);

    // Handler para atualizar dados após sincronização manual
    const handleSyncComplete = useCallback((newGroups, newVncGroups) => {
        console.log('🔄 Atualizando dados após sincronização...');
        console.log(`   Recebido: ${newGroups.length} grupos RDP, ${newVncGroups.length} grupos VNC`);
        setGroups(newGroups);
        setVncGroups(newVncGroups);
        toast.success(`Sincronização concluída! ${newGroups.length} RDP, ${newVncGroups.length} VNC`);
    }, [setGroups, setVncGroups, toast]);

    const [activeConnections, setActiveConnections] = useState([]);

    // Estado para modal de configuração do Guacamole
    const [showGuacamoleConfig, setShowGuacamoleConfig] = useState(false);
    const [showQuickConnectModal, setShowQuickConnectModal] = useState(false);
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

    // Handler para Importação do AD (com verificação de duplicatas)
    const handleImportFromAD = useCallback(async (targetGroupId, servers, type) => {
        // Usa o novo handler de importação em massa que verifica duplicatas
        if (window.api && window.api.db && window.api.db.importBulk) {
            try {
                const result = await window.api.db.importBulk(targetGroupId, servers, type);

                // Exibe feedback detalhado
                if (result.imported > 0) {
                    toast.success(`✅ ${result.imported} computador(es) importado(s) com sucesso!`);
                }
                if (result.skipped > 0) {
                    toast.warning(`⏭️ ${result.skipped} duplicado(s) ignorado(s): ${result.skippedNames.slice(0, 3).join(', ')}${result.skippedNames.length > 3 ? '...' : ''}`);
                }
                if (result.failed > 0) {
                    toast.error(`❌ ${result.failed} falha(s) na importação`);
                }

                // Recarrega dados do backend para atualizar a UI
                if (result.imported > 0) {
                    const data = await window.api.db.requestInitialData?.();
                    if (data && data.groups) {
                        setGroups(data.groups);
                        if (data.vncGroups) setVncGroups(data.vncGroups);
                    }
                }
            } catch (error) {
                console.error('Erro na importação do AD:', error);
                toast.error(`Erro na importação: ${error.message}`);
            }
        } else {
            // Fallback para método antigo (sem verificação de duplicatas)
            if (type === 'rdp') {
                servers.forEach(server => handleAddServer(targetGroupId, server));
            } else {
                servers.forEach(server => handleAddVncConnection(targetGroupId, server));
            }
            showSuccess(`${servers.length} computadores importados com sucesso!`);
        }
    }, [handleAddServer, handleAddVncConnection, showSuccess, toast, setGroups, setVncGroups]);

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

                // Atualiza os dados na UI com os dados retornados do backend
                if (result.groups && result.vncGroups) {
                    setGroups(result.groups);
                    setVncGroups(result.vncGroups);
                    console.log('🔄 UI atualizada após alteração de senhas em massa');
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar senhas em massa:', error);
            toast.error(`Erro ao atualizar senhas: ${error.message}`);
        }
    }, [toast, setGroups, setVncGroups]);

    // Handler para Salvar Edição de Servidor RDP/SSH
    const handleSaveEditedServer = useCallback((currentGroupId, updatedServer, newGroupId = null) => {
        handleUpdateServer(currentGroupId, updatedServer.id, updatedServer, newGroupId);
        closeEditServer();
        if (newGroupId && newGroupId !== currentGroupId) {
            toast.success(`Servidor "${updatedServer.name}" movido para outro grupo!`);
        } else {
            toast.success(`Servidor "${updatedServer.name}" atualizado com sucesso!`);
        }
    }, [handleUpdateServer, toast, closeEditServer]);

    // Handler para Salvar Edição de Conexão VNC
    const handleSaveEditedVnc = useCallback((currentGroupId, updatedConnection, newGroupId = null) => {
        // Passa (groupId, connectionId, updatedData, newGroupId) conforme esperado pelo useGroups
        handleUpdateVncConnection(currentGroupId, updatedConnection.id, updatedConnection, newGroupId);
        closeEditVncConnection();
        if (newGroupId && newGroupId !== currentGroupId) {
            toast.success(`Conexão VNC "${updatedConnection.name}" movida para outro grupo!`);
        } else {
            toast.success(`Conexão VNC "${updatedConnection.name}" atualizada com sucesso!`);
        }
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
        const term = searchTerm.toLowerCase();

        return groups
            .map(group => {
                const groupNameMatches = group.groupName.toLowerCase().includes(term);

                // Se o nome do grupo corresponde, mostra todos os servidores
                if (groupNameMatches) return group;

                // Caso contrário, filtra apenas os servidores que correspondem
                const filteredServers = (group.servers || []).filter(server =>
                    server.name.toLowerCase().includes(term) ||
                    server.ipAddress.toLowerCase().includes(term)
                );

                // Retorna grupo com servidores filtrados (ou null se vazio)
                if (filteredServers.length > 0) {
                    return { ...group, servers: filteredServers };
                }
                return null;
            })
            .filter(Boolean); // Remove grupos vazios
    }, [groups, searchTerm]);

    const filteredVncGroups = useMemo(() => {
        if (!searchTerm) return vncGroups;
        const term = searchTerm.toLowerCase();

        return vncGroups
            .map(group => {
                const groupNameMatches = group.groupName.toLowerCase().includes(term);

                // Se o nome do grupo corresponde, mostra todas as conexões
                if (groupNameMatches) return group;

                // Caso contrário, filtra apenas as conexões que correspondem
                const filteredConnections = (group.connections || []).filter(conn =>
                    conn.name.toLowerCase().includes(term) ||
                    conn.ipAddress.toLowerCase().includes(term)
                );

                // Retorna grupo com conexões filtradas (ou null se vazio)
                if (filteredConnections.length > 0) {
                    return { ...group, connections: filteredConnections };
                }
                return null;
            })
            .filter(Boolean); // Remove grupos vazios
    }, [vncGroups, searchTerm]);

    const handleOnDragEnd = useCallback((result) => {
        console.log('🔄 DnD: handleOnDragEnd chamado', result);
        const { destination, source, type, draggableId } = result;

        if (!destination) {
            console.log('🔄 DnD: Sem destino, ignorando');
            return;
        }
        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            console.log('🔄 DnD: Mesma posição, ignorando');
            return;
        }

        try {
            // Reordenação de grupos
            if (type === 'group') {
                console.log('🔄 DnD: Reordenando grupo', { source: source.index, dest: destination.index });
                const newGroups = Array.from(groups);
                const [reorderedItem] = newGroups.splice(source.index, 1);
                newGroups.splice(destination.index, 0, reorderedItem);
                console.log('🔄 DnD: Novos grupos:', newGroups.map(g => g.groupName));
                reorderGroups(newGroups); // Usa função que pula sync
                toast.success(`Grupo "${reorderedItem.groupName}" reordenado`);
                return;
            }

            const startGroupId = source.droppableId;
            const finishGroupId = destination.droppableId;
            const startGroup = groups.find(g => g.id.toString() === startGroupId.toString());
            const finishGroup = groups.find(g => g.id.toString() === finishGroupId.toString());

            console.log('🔄 DnD: Movendo servidor', { startGroupId, finishGroupId, startGroup: startGroup?.groupName, finishGroup: finishGroup?.groupName });

            if (!startGroup || !finishGroup) {
                console.error('🔄 DnD: Grupo não encontrado');
                toast.error('Erro ao mover item: Grupo não encontrado.');
                return;
            }

            // Reordenação dentro do mesmo grupo
            if (startGroup === finishGroup) {
                const newServers = Array.from(startGroup.servers);
                const [reorderedItem] = newServers.splice(source.index, 1);
                newServers.splice(destination.index, 0, reorderedItem);
                console.log('🔄 DnD: Servidor reordenado no mesmo grupo');
                reorderServersInGroup(startGroup.id, newServers); // Usa função que pula sync
                toast.success(`Servidor "${reorderedItem.name}" reordenado`);
            } else {
                // Mover servidor para outro grupo
                const serverToMove = startGroup.servers[source.index];
                if (serverToMove) {
                    console.log('🔄 DnD: Movendo servidor para outro grupo');
                    moveServerToGroup(serverToMove.id, startGroupId, finishGroupId, destination.index);
                    toast.success(`Servidor "${serverToMove.name}" movido para "${finishGroup.groupName}"`);
                }
            }
        } catch (error) {
            console.error('❌ DnD Erro:', error);
            toast.error('Erro ao reorganizar items. Tente novamente.');
        }
    }, [groups, toast, reorderGroups, reorderServersInGroup, moveServerToGroup]);


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
                    onViewChange={changeView}
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
                    viewMode={activeView === 'RDP/SSH' ? rdpViewMode : activeView === 'VNC' ? vncViewMode : appsViewMode}
                    onToggleViewMode={() => {
                        if (activeView === 'RDP/SSH') {
                            setRdpViewMode(rdpViewMode === 'grid' ? 'list' : 'grid');
                        } else if (activeView === 'VNC') {
                            setVncViewMode(vncViewMode === 'grid' ? 'list' : 'grid');
                        } else if (activeView === 'Aplicações') {
                            setAppsViewMode(appsViewMode === 'grid' ? 'list' : 'grid');
                        }
                    }}
                    onShowGuacamoleConfig={() => setShowGuacamoleConfig(true)}
                    allGroupsCollapsed={allGroupsCollapsed}
                    onToggleAllCollapsed={toggleAllCollapsed}
                    onShowQuickConnect={() => setShowQuickConnectModal(true)}
                    isSidebarCollapsed={isSidebarCollapsed}
                />
                {/* Main Content Area */}
                <main className="app-main-content">
                    <DragDropContext
                        onDragStart={(start) => console.log('🔄 DnD: onDragStart', start)}
                        onDragEnd={handleOnDragEnd}
                    >
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
                                    onOpenInTab={addTabConnection}
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
                                    onVncConnect={(conn) => addTabConnection(conn, 'vnc')}
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
                            {activeView === 'Aplicações' && (
                                <ApplicationsView />
                            )}
                            {activeView === 'AnyDesk' && (
                                <AnyDeskView />
                            )}

                        </Suspense>
                    </DragDropContext>
                </main>
                <footer className="app-footer">
                    <div className="footer-content">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <RocketLaunchIcon sx={{ fontSize: 16, marginRight: '8px', color: 'primary.main' }} />
                            Gerenciador Enterprise v5.8.0
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
                        groupId={editingServer.groupId}
                        groups={groups}
                        onSave={handleSaveEditedServer}
                        onCancel={closeEditServer}
                    />
                )}

                {editingVncConnection && (
                    <EditVncModal
                        connection={editingVncConnection.connection}
                        groupId={editingVncConnection.groupId}
                        groups={vncGroups}
                        onSave={handleSaveEditedVnc}
                        onCancel={closeEditVncConnection}
                    />
                )}

                {/* ✅ v5.11: Modal legado VNC removido - agora usa ConnectionTabsContainer */}
                {/* VNC connections são gerenciadas pelo sistema de abas */}

                {/* Modal de conexão remota (Guacamole) */}
                {activeRemoteConnection && (
                    <ConnectionViewerModal
                        connectionInfo={activeRemoteConnection}
                        onClose={closeRemoteConnection}
                    />
                )}

                {/* Gerenciador de Múltiplas Conexões em Abas */}
                {tabConnections.length > 0 && (
                    <ConnectionTabsContainer />
                )}

                {/* Modal de Quick Connect VNC */}
                <QuickConnectVncModal
                    isOpen={showQuickConnectModal}
                    onClose={() => setShowQuickConnectModal(false)}
                    vncGroups={vncGroups}
                    onSaveConnection={handleAddVncConnection}
                    onVncConnect={(conn) => addTabConnection(conn, 'vnc')}
                />

                {/* Modal de Configuração do Servidor Guacamole */}
                <GuacamoleServerConfigModal
                    isOpen={showGuacamoleConfig}
                    onClose={() => setShowGuacamoleConfig(false)}
                    onSave={handleSaveGuacamoleConfig}
                    initialConfig={guacamoleConfig}
                />

                {/* Footer com botão de sincronização */}
                <Footer onSyncComplete={handleSyncComplete} isSidebarCollapsed={isSidebarCollapsed} />
            </div>
        </ThemeProvider >
    );
}

export default App;