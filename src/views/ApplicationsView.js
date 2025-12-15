// src/views/ApplicationsView.js
// ✨ v4.8: Migrado para Tailwind CSS
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

function ApplicationsView() {
    const { toast } = useToast();
    const { isEditModeEnabled, searchTerm, setSearchTerm, allGroupsCollapsed, appsViewMode } = useUI();
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
            .map(group => {
                const groupNameMatches = group.name.toLowerCase().includes(term);

                // Se o nome do grupo corresponde, mostra todas as apps
                if (groupNameMatches) return group;

                // Caso contrário, filtra apenas as apps que correspondem
                const filteredApps = (group.apps || []).filter(app =>
                    app.name.toLowerCase().includes(term) ||
                    (app.description && app.description.toLowerCase().includes(term))
                );

                // Retorna grupo com apps filtradas (ou null se vazio)
                if (filteredApps.length > 0) {
                    return { ...group, apps: filteredApps };
                }
                return null;
            })
            .filter(Boolean); // Remove grupos vazios
    }, [appGroups, searchTerm]);

    // Handlers
    const handleAddGroup = useCallback(async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        await handleAddAppGroup({ name: newGroupName.trim() });
        setNewGroupName('');
        setShowAddGroupForm(false);
    }, [newGroupName, handleAddAppGroup]);

    // Drag & Drop Handler
    const handleOnDragEnd = useCallback((result) => {
        const { destination, source, type, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        try {
            if (type === 'app-group') {
                const newGroups = Array.from(appGroups);
                const [reorderedItem] = newGroups.splice(source.index, 1);
                newGroups.splice(destination.index, 0, reorderedItem);
                reorderAppGroups(newGroups);
                toast.success(`Grupo "${reorderedItem.name}" reordenado`);
                return;
            }

            if (type === 'app') {
                const sourceGroupId = parseInt(source.droppableId.replace('apps-', ''));
                const destGroupId = parseInt(destination.droppableId.replace('apps-', ''));
                const appId = parseInt(draggableId.replace('app-', ''));

                const sourceGroup = appGroups.find(g => g.id === sourceGroupId);
                const destGroup = appGroups.find(g => g.id === destGroupId);

                if (!sourceGroup || !destGroup) return;

                if (sourceGroupId === destGroupId) {
                    const newApps = Array.from(sourceGroup.apps || []);
                    const [movedApp] = newApps.splice(source.index, 1);
                    newApps.splice(destination.index, 0, movedApp);
                    reorderAppsInGroup(sourceGroupId, newApps);
                    toast.success(`"${movedApp.name}" reordenado`);
                } else {
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
            await handleUpdateApp(appId, data);
        } else {
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
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-500">Carregando aplicações...</span>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            {/* Barra de ações */}
            <div className="flex items-center justify-between bg-cream-100 dark:bg-dark-surface 
                border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-500">
                    {totalApps} {totalApps === 1 ? 'aplicação' : 'aplicações'} em {appGroups.length} {appGroups.length === 1 ? 'grupo' : 'grupos'}
                </span>

                <div className="flex items-center gap-2">
                    <button
                        className="p-2 rounded-lg bg-cream-50 dark:bg-dark-bg 
                            border border-gray-200 dark:border-gray-700 
                            text-gray-500 transition-all duration-200
                            hover:border-primary hover:text-primary"
                        onClick={reloadApps}
                        title="Recarregar"
                    >
                        <RefreshIcon sx={{ fontSize: 18 }} />
                    </button>

                    {isEditModeEnabled && (
                        <button
                            className="flex items-center gap-2 px-4 py-2
                                bg-gradient-to-br from-primary to-primary-hover
                                text-white font-semibold rounded-lg
                                shadow-md shadow-primary/30
                                transition-all duration-200
                                hover:-translate-y-0.5 hover:shadow-lg"
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
                <form className="flex items-center gap-3 bg-cream-100 dark:bg-dark-surface 
                    border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3"
                    onSubmit={handleAddGroup}
                >
                    <input
                        type="text"
                        placeholder="Nome do novo grupo..."
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        autoFocus
                        className="flex-1 px-4 py-2 bg-cream-50 dark:bg-dark-bg 
                            border border-gray-200 dark:border-gray-700 rounded-lg
                            text-sm text-slate-900 dark:text-white
                            placeholder:text-gray-400 outline-none
                            focus:border-primary"
                    />
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-semibold
                        transition-all hover:bg-primary-hover">
                        Criar
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 
                            rounded-lg font-semibold transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                        onClick={() => setShowAddGroupForm(false)}
                    >
                        Cancelar
                    </button>
                </form>
            )}

            {/* Lista de grupos */}
            <div className="space-y-4">
                {filteredGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <FolderOpenIcon sx={{ fontSize: 64 }} className="text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                            {searchTerm ? 'Nenhuma aplicação encontrada' : 'Nenhuma aplicação cadastrada'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4 max-w-sm">
                            {searchTerm
                                ? 'Tente buscar por outro termo'
                                : 'Ative o modo de edição e crie seu primeiro grupo de aplicações'
                            }
                        </p>
                        {searchTerm && (
                            <button
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 
                                    rounded-lg font-semibold transition-all hover:bg-gray-300"
                                onClick={() => setSearchTerm('')}
                            >
                                Limpar busca
                            </button>
                        )}
                        {!searchTerm && isEditModeEnabled && (
                            <button
                                className="flex items-center gap-2 px-4 py-2
                                    bg-gradient-to-br from-primary to-primary-hover
                                    text-white font-semibold rounded-lg
                                    shadow-md shadow-primary/30
                                    transition-all duration-200
                                    hover:-translate-y-0.5"
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
                                    className="space-y-4"
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
                                                        forceCollapsed={allGroupsCollapsed}
                                                        viewMode={appsViewMode}
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
