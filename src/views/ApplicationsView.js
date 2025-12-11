// src/views/ApplicationsView.js
// View principal de Aplicações (Feature v4.3)
// v4.3.1: Suporte a Drag & Drop

import React, { useState, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useApps } from '../hooks/useApps';
import { useToast } from '../hooks/useToast';
import { useUI } from '../contexts/UIContext';
import { useModals } from '../contexts/ModalContext';
import AppGroup from '../components/apps/AppGroup';
import EditAppModal from '../components/apps/EditAppModal';
import {
    AddIcon,
    RefreshIcon,
    FolderOpenIcon
} from '../components/MuiIcons';
import './ApplicationsView.css';

/**
 * View de gerenciamento de aplicações
 */
function ApplicationsView() {
    const { toast } = useToast();
    const { isEditModeEnabled, searchTerm, setSearchTerm } = useUI();
    const { showConfirmDialog } = useModals();

    // Hook de aplicações
    const {
        appGroups,
        isLoading,
        totalApps,
        handleAddAppGroup,
        handleUpdateAppGroup,
        handleDeleteAppGroup,
        handleAddApp,
        handleUpdateApp,
        handleDeleteApp,
        handleLaunchApp,
        selectFile,
        reloadApps,
        // Drag & Drop
        reorderAppGroups,
        reorderAppsInGroup,
        moveAppToGroup
    } = useApps(toast);

    // Estados locais
    const [showAddGroupForm, setShowAddGroupForm] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [editingApp, setEditingApp] = useState(null);
    const [addingToGroupId, setAddingToGroupId] = useState(null);

    // Filtra grupos por busca
    const filteredGroups = useMemo(() => {
        if (!searchTerm) return appGroups;

        const term = searchTerm.toLowerCase();
        return appGroups
            .map(group => ({
                ...group,
                apps: (group.apps || []).filter(app =>
                    app.name.toLowerCase().includes(term) ||
                    (app.description && app.description.toLowerCase().includes(term))
                )
            }))
            .filter(group =>
                group.name.toLowerCase().includes(term) ||
                group.apps.length > 0
            );
    }, [appGroups, searchTerm]);

    // Handlers
    const handleAddGroup = useCallback(async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        await handleAddAppGroup({ name: newGroupName.trim() });
        setNewGroupName('');
        setShowAddGroupForm(false);
    }, [newGroupName, handleAddAppGroup]);

    // ==============================
    // DRAG & DROP Handler
    // ==============================
    const handleOnDragEnd = useCallback((result) => {
        const { destination, source, type, draggableId } = result;

        // Sem destino = cancelado
        if (!destination) return;

        // Mesma posição = nada a fazer
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        try {
            // Reordenação de grupos
            if (type === 'app-group') {
                const newGroups = Array.from(appGroups);
                const [reorderedItem] = newGroups.splice(source.index, 1);
                newGroups.splice(destination.index, 0, reorderedItem);
                reorderAppGroups(newGroups);
                toast.success(`Grupo "${reorderedItem.name}" reordenado`);
                return;
            }

            // Reordenação/movimento de apps
            if (type === 'app') {
                const sourceGroupId = parseInt(source.droppableId.replace('apps-', ''));
                const destGroupId = parseInt(destination.droppableId.replace('apps-', ''));
                const appId = parseInt(draggableId.replace('app-', ''));

                const sourceGroup = appGroups.find(g => g.id === sourceGroupId);
                const destGroup = appGroups.find(g => g.id === destGroupId);

                if (!sourceGroup || !destGroup) return;

                // Mesmo grupo = reordenação interna
                if (sourceGroupId === destGroupId) {
                    const newApps = Array.from(sourceGroup.apps || []);
                    const [movedApp] = newApps.splice(source.index, 1);
                    newApps.splice(destination.index, 0, movedApp);
                    reorderAppsInGroup(sourceGroupId, newApps);
                    toast.success(`"${movedApp.name}" reordenado`);
                } else {
                    // Grupos diferentes = mover app
                    const movedApp = sourceGroup.apps[source.index];
                    moveAppToGroup(appId, sourceGroupId, destGroupId, destination.index);
                    toast.success(`"${movedApp.name}" movido para "${destGroup.name}"`);
                }
            }
        } catch (error) {
            console.error('❌ DnD Erro:', error);
            toast.error('Erro ao reorganizar. Tente novamente.');
        }
    }, [appGroups, toast, reorderAppGroups, reorderAppsInGroup, moveAppToGroup]);

    const handleEditGroup = useCallback((group) => {
        const newName = prompt('Novo nome do grupo:', group.name);
        if (newName && newName.trim() !== group.name) {
            handleUpdateAppGroup(group.id, { name: newName.trim() });
        }
    }, [handleUpdateAppGroup]);

    const handleConfirmDeleteGroup = useCallback((groupId, groupName) => {
        showConfirmDialog({
            message: `Tem certeza que deseja excluir o grupo "${groupName}" e todas as suas aplicações?`,
            onConfirm: () => handleDeleteAppGroup(groupId)
        });
    }, [showConfirmDialog, handleDeleteAppGroup]);

    const handleOpenAddAppModal = useCallback((groupId) => {
        setAddingToGroupId(groupId);
        setEditingApp(null);
    }, []);

    const handleOpenEditAppModal = useCallback((app) => {
        setEditingApp(app);
        setAddingToGroupId(null);
    }, []);

    const handleConfirmDeleteApp = useCallback((appId) => {
        showConfirmDialog({
            message: 'Tem certeza que deseja excluir esta aplicação?',
            onConfirm: () => handleDeleteApp(appId)
        });
    }, [showConfirmDialog, handleDeleteApp]);

    const handleSaveApp = useCallback(async (appId, data, groupId) => {
        if (appId) {
            // Editando
            await handleUpdateApp(appId, data);
        } else {
            // Criando
            await handleAddApp(groupId, data);
        }
        setEditingApp(null);
        setAddingToGroupId(null);
    }, [handleAddApp, handleUpdateApp]);

    const handleCloseModal = useCallback(() => {
        setEditingApp(null);
        setAddingToGroupId(null);
    }, []);

    // Loading state
    if (isLoading) {
        return (
            <div className="apps-view loading">
                <div className="loading-spinner" />
                <span>Carregando aplicações...</span>
            </div>
        );
    }

    return (
        <div className="apps-view">
            {/* Barra de ações (sem duplicar header) */}
            <div className="apps-toolbar">
                <span className="apps-count">
                    {totalApps} {totalApps === 1 ? 'aplicação' : 'aplicações'} em {appGroups.length} {appGroups.length === 1 ? 'grupo' : 'grupos'}
                </span>

                <div className="apps-toolbar-actions">
                    <button
                        className="apps-action-btn"
                        onClick={reloadApps}
                        title="Recarregar"
                    >
                        <RefreshIcon sx={{ fontSize: 18 }} />
                    </button>

                    {isEditModeEnabled && (
                        <button
                            className="apps-add-btn"
                            onClick={() => setShowAddGroupForm(true)}
                        >
                            <AddIcon sx={{ fontSize: 18 }} />
                            <span>Novo Grupo</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Form de novo grupo */}
            {showAddGroupForm && (
                <form className="apps-add-group-form" onSubmit={handleAddGroup}>
                    <input
                        type="text"
                        placeholder="Nome do novo grupo..."
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" className="btn-submit">Criar</button>
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => setShowAddGroupForm(false)}
                    >
                        Cancelar
                    </button>
                </form>
            )}

            {/* Lista de grupos */}
            <div className="apps-content">
                {filteredGroups.length === 0 ? (
                    <div className="apps-empty-state">
                        <FolderOpenIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                        <h3>
                            {searchTerm ? 'Nenhuma aplicação encontrada' : 'Nenhuma aplicação cadastrada'}
                        </h3>
                        <p>
                            {searchTerm
                                ? 'Tente buscar por outro termo'
                                : 'Ative o modo de edição e crie seu primeiro grupo de aplicações'
                            }
                        </p>
                        {!searchTerm && isEditModeEnabled && (
                            <button
                                className="btn-create-first"
                                onClick={() => setShowAddGroupForm(true)}
                            >
                                <AddIcon sx={{ fontSize: 18 }} />
                                Criar primeiro grupo
                            </button>
                        )}
                    </div>
                ) : (
                    <DragDropContext onDragEnd={handleOnDragEnd}>
                        <Droppable droppableId="app-groups-list" type="app-group">
                            {(provided) => (
                                <div
                                    className="apps-groups-list"
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                    {filteredGroups.map((group, index) => (
                                        <Draggable
                                            key={group.id}
                                            draggableId={`group-${group.id}`}
                                            index={index}
                                            isDragDisabled={!isEditModeEnabled}
                                        >
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                >
                                                    <AppGroup
                                                        group={group}
                                                        index={index}
                                                        isEditMode={isEditModeEnabled}
                                                        onAddApp={handleOpenAddAppModal}
                                                        onEditApp={handleOpenEditAppModal}
                                                        onDeleteApp={handleConfirmDeleteApp}
                                                        onLaunchApp={handleLaunchApp}
                                                        onEditGroup={handleEditGroup}
                                                        onDeleteGroup={handleConfirmDeleteGroup}
                                                        dragHandleProps={provided.dragHandleProps}
                                                        isDraggingGroup={snapshot.isDragging}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                )}
            </div>

            {/* Modal de edição/criação */}
            <EditAppModal
                isOpen={!!(editingApp || addingToGroupId)}
                onClose={handleCloseModal}
                onSave={handleSaveApp}
                app={editingApp}
                groupId={addingToGroupId || editingApp?.groupId}
                groups={appGroups}
                selectFile={selectFile}
            />
        </div>
    );
}

export default ApplicationsView;
