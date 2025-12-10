import React from 'react';
import EditServerForm from './EditServerForm';
import './Modal.css';

function EditServerModal({ server, groupId, groups, onSave, onCancel }) {
    const handleSave = (updatedData) => {
        // Se newGroupId foi alterado, passa para o handler
        const newGroupId = updatedData.newGroupId;
        delete updatedData.newGroupId; // Remove do objeto de dados

        onSave(groupId, {
            ...server,
            ...updatedData
        }, newGroupId);
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
