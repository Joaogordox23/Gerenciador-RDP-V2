import React, { useState } from 'react';
import VncGroup from '../components/VncGroup';
import AddGroupForm from '../components/AddGroupForm';

// Recebemos a nova propriedade 'onUpdateVncGroup' do App.js
function VncView({ vncGroups, onAddGroup, isEditModeEnabled, onUpdateVncGroup, ...groupProps }) {
    // O estado 'showAddGroupForm' é agora controlado pelo App.js, removemos o local.
    
    // Estado para controlar qual grupo está sendo editado
    const [editingGroupId, setEditingGroupId] = useState(null);
    
    // Função para salvar e sair do modo de edição
    const handleUpdateAndFinishEditing = (groupId, newName) => {
        onUpdateVncGroup(groupId, newName);
        setEditingGroupId(null); // Fecha o campo de edição
    };

    return (
        <div>
            {/* O formulário de adicionar grupo agora é renderizado no App.js */}
            
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
                    {!isEditModeEnabled ? <p>Ative o "Modo Edição" para adicionar um novo grupo.</p> : <p>Clique em "Novo Grupo" para começar.</p>}
                </div>
            )}
        </div>
    );
}

export default VncView;
