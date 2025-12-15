// src/components/apps/AppGroup.js
// ✨ v4.9: Suporte a modo lista com AppListItem
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
import AppListItem from './AppListItem';

function AppGroup({
    group,
    index,
    isEditMode = false,
    defaultCollapsed = false,
    forceCollapsed = null,
    viewMode = 'grid',
    onAddApp,
    onEditApp,
    onDeleteApp,
    onLaunchApp,
    onEditGroup,
    onDeleteGroup,
    dragHandleProps = null,
    isDraggingGroup = false
}) {
    const [localCollapsed, setLocalCollapsed] = useState(defaultCollapsed);
    const [hasLocalOverride, setHasLocalOverride] = useState(false);
    const isCollapsed = hasLocalOverride ? localCollapsed : (forceCollapsed !== null ? forceCollapsed : localCollapsed);

    useEffect(() => {
        if (forceCollapsed !== null) {
            setHasLocalOverride(false);
            setLocalCollapsed(forceCollapsed);
        } else {
            // Quando forceCollapsed volta para null (após changeView), expande os grupos
            setHasLocalOverride(false);
            setLocalCollapsed(false);
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
    const isListView = viewMode === 'list';

    const actionBtn = "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer";

    return (
        <div className={`bg-cream-100 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 
            rounded-xl overflow-hidden shadow-md transition-all duration-200
            ${isDraggingGroup ? 'shadow-2xl ring-2 ring-primary' : ''}`}>
            {/* Header */}
            <div
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer
                    bg-cream-50/50 dark:bg-dark-bg/50 border-b border-gray-200 dark:border-gray-700
                    transition-all hover:bg-primary/5`}
                onClick={handleToggleCollapse}
            >
                {/* Drag handle */}
                {isEditMode && dragHandleProps && (
                    <div className="p-1.5 text-gray-400 hover:text-primary cursor-grab"
                        {...dragHandleProps} onClick={e => e.stopPropagation()}>
                        <DragIndicatorIcon sx={{ fontSize: 18 }} />
                    </div>
                )}

                <div className="flex items-center gap-2 flex-1">
                    <ChevronRightIcon
                        className={`text-gray-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
                        sx={{ fontSize: 20 }}
                    />
                    <FolderOpenIcon sx={{ fontSize: 18 }} style={{ color: group.color || 'var(--color-primary)' }} />
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">{group.name}</span>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                        {appCount}
                    </span>
                </div>

                {isEditMode && (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button type="button" className={`${actionBtn} bg-primary/10 text-primary hover:bg-primary hover:text-white`}
                            onClick={handleAddApp} title="Adicionar"><AddIcon sx={{ fontSize: 18 }} /></button>
                        <button type="button" className={`${actionBtn} bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white`}
                            onClick={handleEditGroup} title="Editar"><EditIcon sx={{ fontSize: 16 }} /></button>
                        <button type="button" className={`${actionBtn} bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white`}
                            onClick={handleDeleteGroup} title="Excluir"><DeleteIcon sx={{ fontSize: 16 }} /></button>
                    </div>
                )}
            </div>

            {/* Content */}
            {!isCollapsed && (
                <Droppable
                    droppableId={`apps-${group.id}`}
                    type="app"
                    direction={isListView ? 'vertical' : 'horizontal'}
                >
                    {(provided, snapshot) => (
                        <div
                            className={`p-4 min-h-[80px] transition-colors duration-200
                                ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {apps.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-sm">
                                    <span>Nenhuma aplicação neste grupo</span>
                                    {isEditMode && (
                                        <button
                                            type="button"
                                            className="flex items-center gap-2 mt-3 px-4 py-2 
                                                bg-primary/10 text-primary rounded-lg font-semibold
                                                transition-all hover:bg-primary hover:text-white cursor-pointer"
                                            onClick={() => onAddApp && onAddApp(group.id)}
                                        >
                                            <AddIcon sx={{ fontSize: 16 }} /> Adicionar
                                        </button>
                                    )}
                                    {provided.placeholder}
                                </div>
                            ) : (
                                <div className={isListView ? 'flex flex-col gap-2' : 'flex flex-wrap gap-4'}>
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
                                                >
                                                    {isListView ? (
                                                        <AppListItem
                                                            app={app}
                                                            isEditMode={isEditMode}
                                                            onLaunch={onLaunchApp}
                                                            onEdit={onEditApp}
                                                            onDelete={onDeleteApp}
                                                            dragHandleProps={provided.dragHandleProps}
                                                            isDragging={snapshot.isDragging}
                                                        />
                                                    ) : (
                                                        <AppCard
                                                            app={app}
                                                            isEditMode={isEditMode}
                                                            onLaunch={onLaunchApp}
                                                            onEdit={onEditApp}
                                                            onDelete={onDeleteApp}
                                                            dragHandleProps={provided.dragHandleProps}
                                                            isDragging={snapshot.isDragging}
                                                        />
                                                    )}
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
