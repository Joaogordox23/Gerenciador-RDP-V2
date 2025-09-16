// src/views/RdpSshView.js (VERSÃO CORRIGIDA)

import React, { useState } from 'react';
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
        <div>
            {filteredGroups.length > 0 ? (
                filteredGroups.map(group => (
                    <Group
                        key={group.id}
                        groupInfo={group}
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
        </div>
    );
}

export default RdpSshView;