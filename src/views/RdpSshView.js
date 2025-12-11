// src/views/RdpSshView.js (v5.0: Layout com Sidebar Premium)

import React, { useState, useRef, useCallback } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import Group from '../components/Group';
import { useUI } from '../contexts/UIContext';
import './RdpSshView.css';

// Icons
const FolderIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
);

const ServerIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="56" height="56">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
        <line x1="6" y1="6" x2="6.01" y2="6"></line>
        <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>
);

const ChevronLeftIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const ChevronRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

const TerminalIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <polyline points="4 17 10 11 4 5"></polyline>
        <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
);

const MonitorIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
);

function RdpSshView({
    filteredGroups,
    onDeleteServer,
    onUpdateServer,
    onDeleteGroup,
    onUpdateGroup,
    activeConnections,
    isEditModeEnabled,
    isConnectivityEnabled,
    onShowAddServerModal,
    viewMode = 'grid',
    onEditServer,
    onRemoteConnect,
    onOpenInTab
}) {
    const { allGroupsCollapsed } = useUI();
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('rdp-ssh-sidebar-collapsed');
        return saved === 'true';
    });

    const groupRefs = useRef({});

    const handleUpdateAndFinishEditing = (groupId, newName) => {
        onUpdateGroup(groupId, newName);
        setEditingGroupId(null);
    };

    const toggleSidebar = useCallback(() => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem('rdp-ssh-sidebar-collapsed', newState.toString());
    }, [sidebarCollapsed]);

    const scrollToGroup = useCallback((groupId) => {
        setSelectedGroupId(groupId);
        const groupElement = groupRefs.current[groupId];
        if (groupElement) {
            groupElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            groupElement.classList.add('rdp-ssh-group-highlighted');
            setTimeout(() => {
                groupElement.classList.remove('rdp-ssh-group-highlighted');
            }, 1000);
        }
    }, []);

    // Calcular estatísticas
    const totalServers = filteredGroups.reduce((acc, g) => acc + (g.servers?.length || 0), 0);
    const rdpCount = filteredGroups.reduce((acc, g) =>
        acc + (g.servers?.filter(s => (s.protocol || 'rdp') === 'rdp').length || 0), 0);
    const sshCount = filteredGroups.reduce((acc, g) =>
        acc + (g.servers?.filter(s => s.protocol === 'ssh').length || 0), 0);

    // Encontrar conexões ativas (simulado por agora - pode ser conectado ao contexto real)
    const activeServersList = filteredGroups
        .flatMap(g => g.servers || [])
        .filter(s => activeConnections.includes(s.id));

    return (
        <div className="rdp-ssh-view-container">
            {/* === SIDEBAR === */}
            <div className={`rdp-ssh-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="rdp-ssh-sidebar-header">
                    <h3>
                        <TerminalIcon />
                        <span>Navegação</span>
                    </h3>
                    <button
                        className="rdp-ssh-sidebar-toggle"
                        onClick={toggleSidebar}
                        title={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                    >
                        {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </button>
                </div>

                {/* Conexões Ativas */}
                {activeServersList.length > 0 && (
                    <div className="rdp-ssh-active-section">
                        <div className="rdp-ssh-active-header">
                            <MonitorIcon />
                            <span>Conexões Ativas</span>
                            <span className="rdp-ssh-active-badge">{activeServersList.length}</span>
                        </div>
                        <div className="rdp-ssh-active-list">
                            {activeServersList.map(server => (
                                <div
                                    key={server.id}
                                    className="rdp-ssh-active-item"
                                    onClick={() => {
                                        const group = filteredGroups.find(g =>
                                            g.servers?.some(s => s.id === server.id)
                                        );
                                        if (group) scrollToGroup(group.id);
                                    }}
                                >
                                    <span className="rdp-ssh-active-status"></span>
                                    <span className="rdp-ssh-active-name">{server.name}</span>
                                    <span className={`rdp-ssh-active-protocol ${server.protocol || 'rdp'}`}>
                                        {(server.protocol || 'rdp').toUpperCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Lista de Grupos */}
                <div className="rdp-ssh-groups-list">
                    {filteredGroups.map(group => (
                        <div
                            key={group.id}
                            className={`rdp-ssh-sidebar-group ${selectedGroupId === group.id ? 'selected' : ''}`}
                            onClick={() => scrollToGroup(group.id)}
                        >
                            <span className="rdp-ssh-sidebar-group-icon">
                                <FolderIcon />
                            </span>
                            <span className="rdp-ssh-sidebar-group-name">{group.groupName}</span>
                            <span className="rdp-ssh-sidebar-group-count">
                                {group.servers?.length || 0}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Estatísticas */}
                <div className="rdp-ssh-sidebar-stats">
                    <div className="rdp-ssh-stats-row">
                        <span>Total de Servidores</span>
                        <span>{totalServers}</span>
                    </div>
                    <div className="rdp-ssh-stats-row">
                        <span>RDP</span>
                        <span>{rdpCount}</span>
                    </div>
                    <div className="rdp-ssh-stats-row">
                        <span>SSH</span>
                        <span>{sshCount}</span>
                    </div>
                </div>
            </div>

            {/* === ÁREA PRINCIPAL === */}
            <div className="rdp-ssh-main">
                <Droppable droppableId="all-groups" type="group">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                            {filteredGroups.length > 0 ? (
                                filteredGroups.map((group, index) => (
                                    <div
                                        key={group.id}
                                        ref={el => groupRefs.current[group.id] = el}
                                    >
                                        <Group
                                            groupInfo={group}
                                            index={index}
                                            onDeleteServer={onDeleteServer}
                                            onUpdateServer={onUpdateServer}
                                            onDeleteGroup={onDeleteGroup}
                                            activeConnections={activeConnections}
                                            isEditModeEnabled={isEditModeEnabled}
                                            isConnectivityEnabled={isConnectivityEnabled}
                                            isEditing={editingGroupId === group.id}
                                            onStartEdit={() => setEditingGroupId(group.id)}
                                            onCancelEdit={() => setEditingGroupId(null)}
                                            onUpdateGroup={handleUpdateAndFinishEditing}
                                            onShowAddServerModal={onShowAddServerModal}
                                            viewMode={viewMode}
                                            onEditServer={onEditServer}
                                            onRemoteConnect={onRemoteConnect}
                                            onOpenInTab={onOpenInTab}
                                            forceCollapsed={allGroupsCollapsed ? true : null}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="rdp-ssh-empty-state">
                                    <div className="rdp-ssh-empty-icon">
                                        <ServerIcon />
                                    </div>
                                    <h3>Nenhum servidor encontrado</h3>
                                    <p>
                                        Ative o "Modo Edição" para adicionar grupos e servidores RDP/SSH.
                                    </p>
                                </div>
                            )}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        </div>
    );
}

export default RdpSshView;
