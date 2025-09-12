// src/components/VncGroup.js - Componente para agrupar conexões VNC

import React, { useState } from 'react';
import VncConnection from './VncConnection';
import AddVncConnectionForm from './AddVncConnectionForm';

function VncGroup({ groupInfo, isEditModeEnabled, onAddConnection, onDeleteConnection, onDeleteGroup }) {
    const [isAddingConnection, setIsAddingConnection] = useState(false);

    const handleConnectionAdded = (connectionData) => {
        onAddConnection(groupInfo.id, connectionData);
        setIsAddingConnection(false); // Fecha o formulário
    };

    return (
        <div className="group-container">
            <div className="group-header">
                <h2 className="group-title">{groupInfo.groupName}</h2>
                {isEditModeEnabled && (
                    <div className="group-header-buttons">
                        <button className="add-server-button" title="Adicionar Conexão VNC" onClick={() => setIsAddingConnection(true)}>+</button>
                        <button className="edit-button" title="Editar Grupo VNC">&#9998;</button>
                        <button className="delete-button group-delete-button" title="Deletar Grupo" onClick={() => onDeleteGroup(groupInfo.id, groupInfo.groupName)}>
                            &times;
                        </button>
                    </div>
                )}
            </div>

            <div className="servers-row">
                {Array.isArray(groupInfo.connections) && groupInfo.connections.map(conn => (
                    <VncConnection
                        key={conn.id}
                        connectionInfo={conn}
                        isEditModeEnabled={isEditModeEnabled}
                        onDelete={() => onDeleteConnection(groupInfo.id, conn.id, conn.name)}
                    />
                ))}
            </div>

            {isAddingConnection && (
                <div className="add-server-form-container">
                    <AddVncConnectionForm 
                        onAddConnection={handleConnectionAdded}
                        onCancel={() => setIsAddingConnection(false)}
                    />
                </div>
            )}
        </div>
    );
}

export default VncGroup;
