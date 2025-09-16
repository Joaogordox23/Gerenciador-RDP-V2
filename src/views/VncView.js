// src/views/VncView.js (VERSÃO CORRIGIDA)

import React, { useState } from 'react';
import VncGroup from '../components/VncGroup';

// CORREÇÃO: Recebendo onShowAddConnectionModal
function VncView({ 
    vncGroups, 
    onAddGroup, 
    isEditModeEnabled, 
    onUpdateVncGroup, 
    onVncConnect, 
    onShowAddConnectionModal,
    ...groupProps 
}) {
    const [editingGroupId, setEditingGroupId] = useState(null);
    
    const handleUpdateAndFinishEditing = (groupId, newName) => {
        onUpdateVncGroup(groupId, newName);
        setEditingGroupId(null);
    };

    return (
        <div>
            {Array.isArray(vncGroups) && vncGroups.length > 0 ? (
                vncGroups.map(group => (
                    <VncGroup
                        key={group.id}
                        groupInfo={group}
                        isEditModeEnabled={isEditModeEnabled}
                        isEditing={editingGroupId === group.id}
                        onStartEdit={() => setEditingGroupId(group.id)}
                        onCancelEdit={() => setEditingGroupId(null)}
                        onUpdateVncGroup={handleUpdateAndFinishEditing}
                        onVncConnect={onVncConnect}
                        // CORREÇÃO: Passando a função para o componente VncGroup
                        onShowAddConnectionModal={onShowAddConnectionModal}
                        {...groupProps}
                    />
                ))
            ) : (
                <div className="empty-state">
                    <h3>Nenhum grupo VNC encontrado.</h3>
                    <p>Ative o "Modo Edição" para usar o botão "Novo Grupo" na barra de ferramentas e começar.</p>
                </div>
            )}
        </div>
    );
}

export default VncView;