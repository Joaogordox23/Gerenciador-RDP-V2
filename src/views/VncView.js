// src/views/VncView.js - Vista principal para gerir conexões VNC

import React, { useState } from 'react';
import AddGroupForm from '../components/AddGroupForm';
import VncGroup from '../components/VncGroup';

function VncView({ 
    vncGroups, 
    onAddGroup, 
    onAddConnection, 
    onDeleteConnection, 
    onDeleteGroup, 
    isEditModeEnabled 
}) {
    const [showAddGroup, setShowAddGroup] = useState(false);

    const handleGroupAdded = (groupName) => {
        onAddGroup(groupName);
        setShowAddGroup(false);
    };
    
    return (
        <>
            {showAddGroup && (
                <AddGroupForm
                    onAddGroup={handleGroupAdded}
                    onCancel={() => setShowAddGroup(false)}
                />
            )}

            {(vncGroups && vncGroups.length > 0) ? (
                vncGroups.map(group => (
                    <VncGroup
                        key={group.id}
                        groupInfo={group}
                        isEditModeEnabled={isEditModeEnabled}
                        onAddConnection={onAddConnection}
                        onDeleteConnection={onDeleteConnection}
                        onDeleteGroup={onDeleteGroup}
                    />
                ))
            ) : (
                <div className="empty-state">
                    <h3>🖥️ Nenhum Grupo VNC Criado</h3>
                    <p>Comece criando o seu primeiro grupo para adicionar conexões VNC.</p>
                    <button
                        onClick={() => setShowAddGroup(true)}
                        className="toolbar-btn"
                        style={{ marginTop: '1rem' }}
                    >
                        ➕ Criar Primeiro Grupo VNC
                    </button>
                </div>
            )}
        </>
    );
}

export default VncView;
