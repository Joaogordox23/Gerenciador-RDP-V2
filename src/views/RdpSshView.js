// src/views/RdpSshView.js (VERSÃO CORRIGIDA)

import React, { useState } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import Group from '../components/Group';

// CORREÇÃO: Recebendo a prop onShowAddServerModal
function RdpSshView({ 
    filteredGroups, 
    onDeleteServer, 
    onUpdateServer, 
    onDeleteGroup, 
    onUpdateGroup, 
    activeConnections, 
    isEditModeEnabled, 
    isConnectivityEnabled,
    onShowAddServerModal
}) {
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
                        filteredGroups.map((group, index) => ( // Adicionamos 'index' aqui
                            <Group
                                key={group.id}
                                groupInfo={group}
                                index={index} // Passamos o index para o Group
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
                                // CORREÇÃO: Passando a função para o componente Group
                                onShowAddServerModal={onShowAddServerModal}
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

