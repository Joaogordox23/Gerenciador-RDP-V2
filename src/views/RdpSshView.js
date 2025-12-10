// src/views/RdpSshView.js (v4.3: Com suporte a collapse global e abas)

import React, { useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import Group from '../components/Group';
import { useUI } from '../contexts/UIContext';

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
    onOpenInTab // Nova prop para abrir em nova aba
}) {
    const { allGroupsCollapsed } = useUI();
    const [editingGroupId, setEditingGroupId] = useState(null);

    const handleUpdateAndFinishEditing = (groupId, newName) => {
        onUpdateGroup(groupId, newName);
        setEditingGroupId(null);
    };

    return (
        <Droppable droppableId="all-groups" type="group">
            {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {filteredGroups.length > 0 ? (
                        filteredGroups.map((group, index) => (
                            <Group
                                key={group.id}
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
                        ))
                    ) : (
                        <div className="empty-state">
                            <h3>Nenhum grupo encontrado.</h3>
                            <p>Ative o "Modo Edição" para usar o botão "Novo Grupo" na barra de ferramentas e começar.</p>
                        </div>
                    )}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
}

export default RdpSshView;
