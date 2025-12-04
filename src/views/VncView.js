// src/views/VncView.js (v4.1: Com suporte a viewMode)

import React, { useState } from 'react';
import VncGroup from '../components/VncGroup';

function VncView({
    vncGroups,
    onAddGroup,
    isEditModeEnabled,
    onUpdateVncGroup,
    onVncConnect,
    onShowAddConnectionModal,
    viewMode = 'grid', // v4.1: Prop viewMode (grid ou list)
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
                        onShowAddConnectionModal={onShowAddConnectionModal}
                        viewMode={viewMode} // v4.1: Passando viewMode para VncGroup
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