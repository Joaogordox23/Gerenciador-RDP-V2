import React from 'react';
import EditVncConnectionForm from './EditVncConnectionForm';

function EditVncModal({ connection, groupId, onSave, onCancel }) {
    const handleSave = (updatedData) => {
        onSave(groupId, {
            ...connection,
            ...updatedData
        });
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content edit-vnc-modal" onClick={(e) => e.stopPropagation()}>
                <EditVncConnectionForm
                    connectionInfo={connection}
                    onSave={handleSave}
                    onCancel={onCancel}
                />
            </div>
        </div>
    );
}

export default EditVncModal;
