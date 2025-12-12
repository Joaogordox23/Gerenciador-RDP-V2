// src/components/apps/AppGroup.js
// Grupo de aplicações colapsável (Feature v4.3)
// v4.3.1: Suporte a Drag & Drop

import React, { useState, useCallback, useEffect } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import {
    ChevronRightIcon,
    AddIcon,
    EditIcon,
    DeleteIcon,
    FolderOpenIcon,
    DragIndicatorIcon
} from '../MuiIcons';
import AppCard from './AppCard';
import './AppGroup.css';

/**
 * Grupo de aplicações com header e lista colapsável
 * Suporta Drag & Drop via react-beautiful-dnd
 * ✨ v4.6: Suporte a forceCollapsed para "colapsar todos"
 */
function AppGroup({
    group,
    index, // Índice para Draggable do grupo
    isEditMode = false,
    defaultCollapsed = false,
    forceCollapsed = null, // ✨ v4.6: Controle externo de collapse
    viewMode = 'grid', // ✨ v4.6: Modo de visualização (grid/list)
    onAddApp,
    onEditApp,
    onDeleteApp,
    onLaunchApp,
    onEditGroup,
    onDeleteGroup,
    dragHandleProps = null, // Props do drag handle do grupo
    isDraggingGroup = false // Se o grupo está sendo arrastado
}) {
    const [localCollapsed, setLocalCollapsed] = useState(defaultCollapsed);

    // ✨ v4.6: Determina se está colapsado com override local
    const [hasLocalOverride, setHasLocalOverride] = useState(false);
    const isCollapsed = hasLocalOverride ? localCollapsed : (forceCollapsed !== null ? forceCollapsed : localCollapsed);

    // Reset override quando forceCollapsed muda
    useEffect(() => {
        if (forceCollapsed !== null) {
            setHasLocalOverride(false);
            setLocalCollapsed(forceCollapsed);
        }
    }, [forceCollapsed]);

    const handleToggleCollapse = useCallback(() => {
        const newState = !isCollapsed;
        setLocalCollapsed(newState);
        setHasLocalOverride(true);
    }, [isCollapsed]);

    const handleAddApp = useCallback((e) => {
        e.stopPropagation();
        if (onAddApp) onAddApp(group.id);
    }, [onAddApp, group.id]);

    const handleEditGroup = useCallback((e) => {
        e.stopPropagation();
        if (onEditGroup) onEditGroup(group);
    }, [onEditGroup, group]);

    const handleDeleteGroup = useCallback((e) => {
        e.stopPropagation();
        if (onDeleteGroup) onDeleteGroup(group.id, group.name);
    }, [onDeleteGroup, group]);

    const apps = group.apps || [];
    const appCount = apps.length;

    return (
        <div className={`app-group ${isCollapsed ? 'collapsed' : ''} ${isDraggingGroup ? 'dragging' : ''}`}>
            {/* Header */}
            <div
                className={`app-group-header ${isEditMode ? 'edit-mode' : ''}`}
                onClick={handleToggleCollapse}
                style={{ '--group-color': group.color || 'var(--color-primary)' }}
            >
                {/* Drag handle do grupo (visível apenas em modo edição) */}
                {isEditMode && dragHandleProps && (
                    <div className="app-group-drag-handle" {...dragHandleProps} onClick={e => e.stopPropagation()}>
                        <DragIndicatorIcon sx={{ fontSize: 18 }} />
                    </div>
                )}

                <div className="app-group-left">
                    <ChevronRightIcon
                        className={`app-group-chevron ${isCollapsed ? '' : 'expanded'}`}
                        sx={{ fontSize: 20 }}
                    />
                    <FolderOpenIcon sx={{ fontSize: 18, color: group.color || 'var(--color-primary)' }} />
                    <span className="app-group-name">{group.name}</span>
                    <span className="app-group-count">{appCount}</span>
                </div>

                {isEditMode && (
                    <div className="app-group-actions" onClick={e => e.stopPropagation()}>
                        <button
                            className="app-group-action-btn add"
                            onClick={handleAddApp}
                            title="Adicionar aplicação"
                        >
                            <AddIcon sx={{ fontSize: 18 }} />
                        </button>
                        <button
                            className="app-group-action-btn edit"
                            onClick={handleEditGroup}
                            title="Editar grupo"
                        >
                            <EditIcon sx={{ fontSize: 16 }} />
                        </button>
                        <button
                            className="app-group-action-btn delete"
                            onClick={handleDeleteGroup}
                            title="Excluir grupo"
                        >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                        </button>
                    </div>
                )}
            </div>

            {/* Cards de aplicações (Droppable) */}
            {!isCollapsed && (
                <Droppable droppableId={`apps-${group.id}`} type="app" direction="horizontal">
                    {(provided, snapshot) => (
                        <div
                            className={`app-group-content ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {apps.length === 0 ? (
                                <div className="app-group-empty">
                                    <span>Nenhuma aplicação neste grupo</span>
                                    {isEditMode && (
                                        <button
                                            className="btn-add-first-app"
                                            onClick={() => onAddApp && onAddApp(group.id)}
                                        >
                                            <AddIcon sx={{ fontSize: 16 }} /> Adicionar
                                        </button>
                                    )}
                                    {provided.placeholder}
                                </div>
                            ) : (
                                <div className={`app-group-grid ${viewMode}`}>
                                    {apps.map((app, appIndex) => (
                                        <Draggable
                                            key={app.id}
                                            draggableId={`app-${app.id}`}
                                            index={appIndex}
                                            isDragDisabled={!isEditMode}
                                        >
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="app-card-wrapper"
                                                >
                                                    <AppCard
                                                        app={app}
                                                        isEditMode={isEditMode}
                                                        onLaunch={onLaunchApp}
                                                        onEdit={onEditApp}
                                                        onDelete={onDeleteApp}
                                                        dragHandleProps={provided.dragHandleProps}
                                                        isDragging={snapshot.isDragging}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </div>
                    )}
                </Droppable>
            )}
        </div>
    );
}

export default React.memo(AppGroup);

