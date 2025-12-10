import React from 'react';
import EditVncConnectionForm from './EditVncConnectionForm';
import './Modal.css';

function EditVncModal({ connection, groupId, groups, onSave, onCancel }) {
    const handleSave = (updatedData) => {
        // Se newGroupId foi alterado, passa para o handler
        const newGroupId = updatedData.newGroupId;
        delete updatedData.newGroupId; // Remove do objeto de dados

        onSave(groupId, {
            ...connection,
            ...updatedData
        }, newGroupId);
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content edit-vnc-modal" onClick={(e) => e.stopPropagation()}>
                <EditVncConnectionForm
                    connectionInfo={connection}
                    onSave={handleSave}
                    onCancel={onCancel}
                    groups={groups}
                    currentGroupId={groupId}
                />
            </div>
        </div>
    );
}

export default EditVncModal;
