// src/views/VncView.js

import React, { useState } from 'react';
import VncGroup from '../components/VncGroup';
import AddGroupForm from '../components/AddGroupForm';

// Recebemos a nova propriedade 'onUpdateVncGroup' do App.js
function VncView({ vncGroups, onAddGroup, isEditModeEnabled, onUpdateVncGroup, ...groupProps }) {
    const [showAddGroup, setShowAddGroup] = useState(false);
    
    // Estado para controlar qual grupo está sendo editado
    const [editingGroupId, setEditingGroupId] = useState(null);

    const handleGroupAdded = (groupName) => {
        onAddGroup(groupName);
        setShowAddGroup(false);
    };
    
    // Função para salvar e sair do modo de edição
    const handleUpdateAndFinishEditing = (groupId, newName) => {
        onUpdateVncGroup(groupId, newName);
        setEditingGroupId(null); // Fecha o campo de edição
    };

    return (
        <div>
            {isEditModeEnabled && !showAddGroup && (
                <div className="toolbar-actions" style={{ justifyContent: 'center', marginBottom: '20px' }}>
                    <button onClick={() => setShowAddGroup(true)} className="toolbar-btn">
                        ➕ Novo Grupo VNC
                    </button>
                </div>
            )}

            {showAddGroup && (
                <AddGroupForm
                    onAddGroup={handleGroupAdded}
                    onCancel={() => setShowAddGroup(false)}
                    title="Criar Novo Grupo VNC"
                    subtitle="Organize suas conexões VNC em grupos."
                />
            )}
            
            {Array.isArray(vncGroups) && vncGroups.length > 0 ? (
                vncGroups.map(group => (
                    <VncGroup
                        key={group.id}
                        groupInfo={group}
                        isEditModeEnabled={isEditModeEnabled}
                        // Propriedades para o estado de edição do grupo
                        isEditing={editingGroupId === group.id}
                        onStartEdit={() => setEditingGroupId(group.id)}
                        onCancelEdit={() => setEditingGroupId(null)}
                        onUpdateVncGroup={handleUpdateAndFinishEditing}
                        // Passa as outras props necessárias (onAddConnection, onDeleteConnection, etc.)
                        {...groupProps}
                    />
                ))
            ) : (
                <div className="empty-state">
                    <h3>Nenhum grupo VNC encontrado.</h3>
                    <p>Clique em "Novo Grupo VNC" para começar a adicionar suas conexões.</p>
                </div>
            )}
        </div>
    );
}

export default VncView;