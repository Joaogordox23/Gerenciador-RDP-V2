import React from 'react';
import EditServerForm from './EditServerForm';
import './Modal.css';

function EditServerModal({ server, onSave, onCancel }) {
    const handleSave = (updatedData) => {
        onSave({
            ...server,
            ...updatedData
        });
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content edit-server-modal" onClick={(e) => e.stopPropagation()}>
                <EditServerForm
                    serverInfo={server}
                    onSave={handleSave}
                    onCancel={onCancel}
                />
            </div>
        </div>
    );
}

export default EditServerModal;
