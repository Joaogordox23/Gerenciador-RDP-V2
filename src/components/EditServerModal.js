import React from 'react';
import EditServerForm from './EditServerForm';
import './Modal.css';

function EditServerModal({ server, groupId, groups, onSave, onCancel }) {
    const handleSave = (updatedData) => {
        // Preserva o ID original do servidor
        const serverWithId = {
            ...server,
            ...updatedData,
            id: server.id // Garante que o ID nunca seja undefined
        };

        // Se newGroupId foi alterado, passa para o handler
        const newGroupId = updatedData.newGroupId;
        delete serverWithId.newGroupId; // Remove do objeto de dados

        console.log('📝 EditServerModal.handleSave:', {
            serverId: server.id,
            groupId,
            newGroupId,
            finalData: serverWithId
        });

        onSave(groupId, serverWithId, newGroupId);
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content edit-server-modal" onClick={(e) => e.stopPropagation()}>
                <EditServerForm
                    serverInfo={server}
                    onSave={handleSave}
                    onCancel={onCancel}
                    groups={groups}
                    currentGroupId={groupId}
                />
            </div>
        </div>
    );
}

export default EditServerModal;
