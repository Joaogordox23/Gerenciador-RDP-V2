// src/components/VncGroup.js (v2.0: Com collapse/expand)

import React, { useState, useEffect } from 'react';
import VncConnection from './VncConnection';
import VncListItem from './VncListItem';

// Ícones
const AddIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>);
const EditIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>);
const DeleteIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>);
const SaveIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>);
const CancelIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const ChevronDownIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>);
const ChevronRightIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>);

function VncGroup({
    groupInfo,
    isEditModeEnabled,
    onShowAddConnectionModal,
    onDeleteConnection,
    onDeleteGroup,
    onUpdateConnection,
    onVncConnect,
    isEditing,
    onStartEdit,
    onCancelEdit,
    onUpdateVncGroup,
    onEditVnc,
    viewMode = 'grid',
    forceCollapsed = null,
    openConnectionIds = new Set() // IDs das conexões abertas em abas
}) {
    const [newGroupName, setNewGroupName] = useState(groupInfo.groupName);

    // Estado de collapse local com persistência em localStorage
    const [localCollapsed, setLocalCollapsed] = useState(() => {
        const saved = localStorage.getItem(`vnc-group-collapsed-${groupInfo.id}`);
        return saved === 'true';
    });

    // Determina se está colapsado: usa override local se o usuário clicou após forceCollapsed
    const [hasLocalOverride, setHasLocalOverride] = useState(false);
    const isCollapsed = hasLocalOverride ? localCollapsed : (forceCollapsed !== null ? forceCollapsed : localCollapsed);

    // Reset override quando forceCollapsed muda
    useEffect(() => {
        if (forceCollapsed !== null) {
            setHasLocalOverride(false);
            setLocalCollapsed(forceCollapsed);
        }
    }, [forceCollapsed]);

    useEffect(() => {
        setNewGroupName(groupInfo.groupName);
    }, [groupInfo.groupName]);

    // Persiste estado de collapse e marca override local
    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setLocalCollapsed(newState);
        setHasLocalOverride(true);
        localStorage.setItem(`vnc-group-collapsed-${groupInfo.id}`, newState.toString());
    };

    const handleSaveGroupName = (e) => {
        e.preventDefault();
        onUpdateVncGroup(groupInfo.id, newGroupName);
    };

    return (
        <div className={`group-container ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="group-header">
                {/* Botão de Collapse/Expand */}
                <button
                    className="group-collapse-btn"
                    onClick={toggleCollapse}
                    title={isCollapsed ? 'Expandir grupo' : 'Recolher grupo'}
                >
                    {isCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
                </button>

                <div className="group-title-container">
                    {isEditing && isEditModeEnabled ? (
                        <form onSubmit={handleSaveGroupName} style={{ width: '100%' }}>
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                onBlur={handleSaveGroupName}
                                onKeyDown={(e) => e.key === 'Escape' && onCancelEdit()}
                                className="group-title-edit-input"
                                autoFocus
                                onFocus={(e) => e.target.select()}
                            />
                        </form>
                    ) : (
                        <h2 className="group-title">
                            {groupInfo.groupName}
                            {isCollapsed && (
                                <span className="group-count-badge">
                                    {groupInfo.connections?.length || 0}
                                </span>
                            )}
                        </h2>
                    )}
                </div>

                <div className="group-actions">
                    {isEditModeEnabled && (
                        <>
                            {isEditing ? (
                                <>
                                    <button className="action-button-icon save" title="Salvar Nome" onClick={handleSaveGroupName}><SaveIcon /></button>
                                    <button className="action-button-icon cancel" title="Cancelar Edição" onClick={onCancelEdit}><CancelIcon /></button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className="action-button-icon add"
                                        title="Adicionar Conexão VNC"
                                        onClick={() => onShowAddConnectionModal(groupInfo.id)}
                                    >
                                        <AddIcon />
                                    </button>
                                    <button className="action-button-icon edit" title="Editar Nome do Grupo" onClick={onStartEdit}><EditIcon /></button>
                                    <button className="action-button-icon delete" title="Deletar Grupo" onClick={() => onDeleteGroup(groupInfo.id, groupInfo.groupName)}><DeleteIcon /></button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Renderização condicional - só mostra se não estiver colapsado */}
            {!isCollapsed && (
                <div className={viewMode === 'list' ? 'servers-list' : 'servers-row'}>
                    {Array.isArray(groupInfo.connections) && groupInfo.connections.map(conn => (
                        viewMode === 'list' ? (
                            <VncListItem
                                key={conn.id}
                                connection={{ ...conn, groupName: groupInfo.groupName }}
                                isEditModeEnabled={isEditModeEnabled}
                                onDelete={() => onDeleteConnection(groupInfo.id, conn.id, conn.name)}
                                onEdit={() => onEditVnc(conn, groupInfo.id)}
                                onConnect={onVncConnect}
                            />
                        ) : (
                            <VncConnection
                                key={conn.id}
                                connectionInfo={conn}
                                isEditModeEnabled={isEditModeEnabled}
                                onDelete={() => onDeleteConnection(groupInfo.id, conn.id, conn.name)}
                                onEdit={() => onEditVnc(conn, groupInfo.id)}
                                onConnect={onVncConnect}
                                isOpen={openConnectionIds.has(conn.id)}
                            />
                        )
                    ))}
                </div>
            )}
        </div>
    );
}

export default VncGroup;