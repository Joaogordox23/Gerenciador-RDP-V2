// src/views/VncView.js (v4.5: Com Conexões Ativas e Botão Fechar Todas)

import React, { useState, useMemo, useRef, useCallback } from 'react';
import VncGroup from '../components/VncGroup';
import { useUI } from '../contexts/UIContext';
import { useModals } from '../contexts/ModalContext';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    FolderIcon,
    MonitorIcon,
    CloseIcon
} from '../components/MuiIcons';
import './VncView.css';

function VncView({
    vncGroups,
    onAddGroup,
    isEditModeEnabled,
    onUpdateVncGroup,
    onVncConnect,
    onShowAddConnectionModal,
    viewMode = 'grid',
    ...groupProps
}) {
    const { allGroupsCollapsed } = useUI();
    const { tabConnections, removeTabConnection, switchToTab } = useModals();
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState(null);

    // Ref para área principal (scroll)
    const mainAreaRef = useRef(null);
    // Refs para cada grupo
    const groupRefs = useRef({});

    // Filtra apenas conexões VNC ativas
    const activeVncConnections = useMemo(() =>
        tabConnections.filter(tab => tab.type === 'vnc'),
        [tabConnections]
    );

    // IDs das conexões abertas para highlight
    const openConnectionIds = useMemo(() =>
        new Set(activeVncConnections.map(tab => tab.info?.id)),
        [activeVncConnections]
    );

    const handleUpdateAndFinishEditing = (groupId, newName) => {
        onUpdateVncGroup(groupId, newName);
        setEditingGroupId(null);
    };

    // Navegar para grupo específico
    const scrollToGroup = useCallback((groupId) => {
        setSelectedGroupId(groupId);
        const groupElement = groupRefs.current[groupId];
        if (groupElement) {
            groupElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, []);

    // Fechar todas as conexões VNC
    const handleCloseAllVnc = useCallback(() => {
        activeVncConnections.forEach(tab => {
            removeTabConnection(tab.id);
        });
    }, [activeVncConnections, removeTabConnection]);

    // Contagem total de conexões cadastradas
    const totalConnections = useMemo(() => {
        return vncGroups.reduce((acc, g) => acc + (g.connections?.length || 0), 0);
    }, [vncGroups]);

    return (
        <div className="vnc-view-container">
            {/* Sidebar de Navegação Rápida */}
            <div className={`vnc-view-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="vnc-view-sidebar-header">
                    <h3>Grupos VNC ({totalConnections})</h3>
                    <button
                        className="vnc-sidebar-toggle-btn"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        title={isSidebarCollapsed ? 'Expandir' : 'Recolher'}
                    >
                        {isSidebarCollapsed ?
                            <ChevronRightIcon sx={{ fontSize: 16 }} /> :
                            <ChevronLeftIcon sx={{ fontSize: 16 }} />
                        }
                    </button>
                </div>

                {/* Seção de Conexões Ativas */}
                {activeVncConnections.length > 0 && (
                    <div className="vnc-sidebar-active-section">
                        <div className="vnc-sidebar-active-header">
                            <span className="active-count-badge">{activeVncConnections.length}</span>
                            <span>Conexões Ativas</span>
                            <button
                                className="btn-close-all-vnc"
                                onClick={handleCloseAllVnc}
                                title="Fechar todas as conexões"
                            >
                                <CloseIcon sx={{ fontSize: 14 }} />
                                Fechar Todas
                            </button>
                        </div>
                        <div className="vnc-sidebar-active-list">
                            {activeVncConnections.map(tab => (
                                <div
                                    key={tab.id}
                                    className="vnc-sidebar-active-item"
                                    onClick={() => switchToTab(tab.id)}
                                    title={`Ir para ${tab.info?.name}`}
                                >
                                    <span className={`active-status ${tab.status}`}></span>
                                    <MonitorIcon sx={{ fontSize: 14 }} />
                                    <span className="active-name">{tab.info?.name}</span>
                                    <button
                                        className="active-close-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeTabConnection(tab.id);
                                        }}
                                    >
                                        <CloseIcon sx={{ fontSize: 12 }} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="vnc-sidebar-groups">
                    {vncGroups.map(group => (
                        <div
                            key={group.id}
                            className={`vnc-sidebar-group-item ${selectedGroupId === group.id ? 'selected' : ''}`}
                            onClick={() => scrollToGroup(group.id)}
                            title={`Ir para ${group.groupName}`}
                        >
                            <FolderIcon sx={{ fontSize: 16 }} className="vnc-sidebar-group-icon" />
                            <span className="vnc-sidebar-group-name">{group.groupName}</span>
                            <span className="vnc-sidebar-group-count">
                                {group.connections?.length || 0}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Área Principal com Grupos */}
            <div className="vnc-view-main" ref={mainAreaRef}>
                {Array.isArray(vncGroups) && vncGroups.length > 0 ? (
                    vncGroups.map(group => (
                        <div
                            key={group.id}
                            ref={el => groupRefs.current[group.id] = el}
                            className={selectedGroupId === group.id ? 'vnc-group-highlighted' : ''}
                        >
                            <VncGroup
                                groupInfo={group}
                                isEditModeEnabled={isEditModeEnabled}
                                isEditing={editingGroupId === group.id}
                                onStartEdit={() => setEditingGroupId(group.id)}
                                onCancelEdit={() => setEditingGroupId(null)}
                                onUpdateVncGroup={handleUpdateAndFinishEditing}
                                onVncConnect={onVncConnect}
                                onShowAddConnectionModal={onShowAddConnectionModal}
                                viewMode={viewMode}
                                forceCollapsed={allGroupsCollapsed ? true : null}
                                openConnectionIds={openConnectionIds}
                                {...groupProps}
                            />
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <h3>Nenhum grupo VNC encontrado.</h3>
                        <p>Ative o "Modo Edição" para usar o botão "Novo Grupo" na barra de ferramentas e começar.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default VncView;