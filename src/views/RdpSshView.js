// src/views/RdpSshView.js

import React, { useState } from 'react';
import Group from '../components/Group';
import AddGroupForm from '../components/AddGroupForm';

function RdpSshView({ 
    filteredGroups, 
    onAddServer, 
    onDeleteServer, 
    onUpdateServer, 
    onDeleteGroup, 
    onUpdateGroup, 
    activeConnections, 
    isEditModeEnabled, 
    isConnectivityEnabled
}) {
    const [showAddGroup, setShowAddGroup] = useState(false);
    
    // Estado para controlar qual grupo RDP/SSH está sendo editado
    const [editingGroupId, setEditingGroupId] = useState(null);

    // Função para salvar e sair do modo de edição
    const handleUpdateAndFinishEditing = (groupId, newName) => {
        onUpdateGroup(groupId, newName);
        setEditingGroupId(null); // Fecha o campo de edição
    };

    return (
        <div>
            {isEditModeEnabled && !showAddGroup && (
                 <div className="toolbar-actions" style={{ justifyContent: 'center', marginBottom: '20px' }}>
                    <button onClick={() => setShowAddGroup(true)} className="toolbar-btn">
                        ➕ Novo Grupo RDP/SSH
                    </button>
                </div>
            )}

            {showAddGroup && (
                <AddGroupForm
                    onAddGroup={(name) => {
                        // Simula a adição de grupo que pode estar no App.js
                        console.log("Adicionar grupo:", name); 
                        setShowAddGroup(false);
                    }}
                    onCancel={() => setShowAddGroup(false)}
                    title="Criar Novo Grupo RDP/SSH"
                    subtitle="Organize seus servidores RDP e SSH."
                />
            )}

            {filteredGroups.length > 0 ? (
                filteredGroups.map(group => (
                    <Group
                        key={group.id}
                        groupInfo={group}
                        onAddServer={onAddServer}
                        onDeleteServer={onDeleteServer}
                        onUpdateServer={onUpdateServer}
                        onDeleteGroup={onDeleteGroup}
                        activeConnections={activeConnections}
                        isEditModeEnabled={isEditModeEnabled}
                        isConnectivityEnabled={isConnectivityEnabled}
                        // Novas props para o estado de edição
                        isEditing={editingGroupId === group.id}
                        onStartEdit={() => setEditingGroupId(group.id)}
                        onCancelEdit={() => setEditingGroupId(null)}
                        onUpdateGroup={handleUpdateAndFinishEditing}
                    />
                ))
            ) : (
                <div className="empty-state">
                    <h3>Nenhum grupo encontrado.</h3>
                    <p>Crie um novo grupo para adicionar seus servidores.</p>
                </div>
            )}
        </div>
    );
}

export default RdpSshView;