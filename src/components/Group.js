// src/components/Group.js (v4.2: Com DnD de grupos, viewMode e collapse)

import React, { useState, useEffect } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import Server from './Server';
import ServerListItem from './ServerListItem';

const AddIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>);
const EditIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>);
const DeleteIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>);
const SaveIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>);
const CancelIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const ChevronDownIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>);
const ChevronRightIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>);

function Group({
    groupInfo,
    onShowAddServerModal,
    onDeleteServer,
    onUpdateServer,
    onDeleteGroup,
    onUpdateGroup,
    activeConnections,
    isEditModeEnabled,
    isConnectivityEnabled,
    isEditing,
    onStartEdit,
    onCancelEdit,
    index,
    viewMode = 'grid',
    onEditServer,
    onRemoteConnect,
    onOpenInTab, // Nova prop para abrir em nova aba
    forceCollapsed = null // Estado global de colapso (null = usar local, true/false = override)
}) {
    const [newGroupName, setNewGroupName] = useState(groupInfo.groupName);

    // Estado de collapse local com persistência em localStorage
    const [localCollapsed, setLocalCollapsed] = useState(() => {
        const saved = localStorage.getItem(`group-collapsed-${groupInfo.id}`);
        return saved === 'true';
    });

    // Determina se está colapsado: usa forceCollapsed se definido, senão usa local
    const isCollapsed = forceCollapsed !== null ? forceCollapsed : localCollapsed;

    useEffect(() => {
        setNewGroupName(groupInfo.groupName);
    }, [groupInfo.groupName]);

    // Persiste estado de collapse (apenas se não estiver em modo forçado)
    const toggleCollapse = () => {
        if (forceCollapsed === null) {
            const newState = !localCollapsed;
            setLocalCollapsed(newState);
            localStorage.setItem(`group-collapsed-${groupInfo.id}`, newState.toString());
        }
    };

    const handleSaveGroupName = (e) => {
        e.preventDefault();
        onUpdateGroup(groupInfo.id, newGroupName);
    };

    return (
        <Draggable draggableId={`group-${groupInfo.id}`} index={index}>
            {(provided, snapshot) => (
                <div
                    className={`group-container ${snapshot.isDragging ? 'dragging' : ''} ${isCollapsed ? 'collapsed' : ''}`}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                >
                    <div className="group-header">
                        {/* Botão de Collapse/Expand */}
                        <button
                            className="group-collapse-btn"
                            onClick={toggleCollapse}
                            title={isCollapsed ? 'Expandir grupo' : 'Recolher grupo'}
                        >
                            {isCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
                        </button>

                        {/* Handle de arrastar grupo */}
                        <div className="group-drag-handle" {...provided.dragHandleProps} title="Arrastar grupo">
                            <span>⋮⋮</span>
                        </div>

                        <div className="group-title-container">
                            {isEditing && isEditModeEnabled ? (
                                <form onSubmit={handleSaveGroupName} style={{ width: '100%' }}>
                                    <input
                                        type="text"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        onBlur={handleSaveGroupName}
                                        onKeyDown={(e) => { if (e.key === 'Escape') onCancelEdit(); }}
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
                                            {groupInfo.servers?.length || 0}
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
                                            <button className="action-button-icon add" title="Adicionar Servidor" onClick={() => {
                                                console.log('Add Server clicked for group:', groupInfo.id);
                                                onShowAddServerModal(groupInfo.id);
                                            }}><AddIcon /></button>
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
                        <>
                            {viewMode === 'list' ? (
                                <div className="servers-list">
                                    {groupInfo.servers && groupInfo.servers.map((server) => (
                                        <ServerListItem
                                            key={server.id}
                                            serverInfo={server}
                                            onDelete={() => onDeleteServer(groupInfo.id, server.id, server.name)}
                                            onUpdate={(updatedData) => onUpdateServer(groupInfo.id, server.id, updatedData)}
                                            isActive={activeConnections.includes(server.id)}
                                            isEditModeEnabled={isEditModeEnabled}
                                            isConnectivityEnabled={isConnectivityEnabled}
                                            onEdit={() => onEditServer(server, groupInfo.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Droppable droppableId={groupInfo.id.toString()} type="server" direction="horizontal">
                                    {(droppableProvided, droppableSnapshot) => (
                                        <div
                                            className="servers-row"
                                            ref={droppableProvided.innerRef}
                                            {...droppableProvided.droppableProps}
                                            style={{
                                                backgroundColor: droppableSnapshot.isDraggingOver ? 'rgba(0, 217, 181, 0.05)' : 'transparent',
                                                minHeight: '100px',
                                                transition: 'background-color 0.2s ease'
                                            }}
                                        >
                                            {groupInfo.servers && groupInfo.servers.map((server, idx) => (
                                                <Server
                                                    key={server.id}
                                                    serverInfo={server}
                                                    index={idx}
                                                    onDelete={() => onDeleteServer(groupInfo.id, server.id, server.name)}
                                                    onUpdate={(updatedData) => onUpdateServer(groupInfo.id, server.id, updatedData)}
                                                    isActive={activeConnections.includes(server.id)}
                                                    isEditModeEnabled={isEditModeEnabled}
                                                    isConnectivityEnabled={isConnectivityEnabled}
                                                    onEdit={() => onEditServer(server, groupInfo.id)}
                                                    onRemoteConnect={onRemoteConnect}
                                                    onOpenInTab={onOpenInTab}
                                                />
                                            ))}
                                            {droppableProvided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            )}
                        </>
                    )}
                </div>
            )}
        </Draggable>
    );
}

export default React.memo(Group);