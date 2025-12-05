// src/components/VncConnection.js (Versão para RealVNC)
import React from 'react';
import {
    EditIcon,
    DeleteIcon,
    ComputerIcon,
    PersonOutlineIcon
} from './MuiIcons';
import './VncConnection.css';

function VncConnection({ connectionInfo, isEditModeEnabled, onDelete, onEdit }) {

    const handleConnect = () => {
        if (isEditModeEnabled) return;

        // VOLTAMOS A CHAMAR A API DO BACKEND
        if (window.api && window.api.connection && window.api.connection.connectVnc) {
            console.log("Enviando pedido de conexão VNC para o backend:", connectionInfo);
            window.api.connection.connectVnc(connectionInfo);
        } else {
            console.error('API de conexão VNC (window.api.connection.connectVnc) não encontrada!');
        }
    };

    return (
        <div className="vnc-connection server-card-base" onClick={handleConnect}>
            <div className="server-card-header">
                <div className="server-card-info">
                    <div className="server-card-title">
                        <ComputerIcon sx={{ fontSize: 20, marginRight: 1, verticalAlign: 'middle' }} />
                        <span className="server-card-name">{connectionInfo.name}</span>
                    </div>
                    <div className="server-card-details">
                        <div className="server-card-address">
                            <span>{connectionInfo.ipAddress}:{connectionInfo.port}</span>
                        </div>
                        {connectionInfo.viewOnly && (
                            <div className="server-card-user">
                                <PersonOutlineIcon sx={{ fontSize: 16, marginRight: '4px', verticalAlign: 'middle' }} />
                                <span>Apenas Visualização</span>
                            </div>
                        )}
                    </div>
                </div>

                {isEditModeEnabled && (
                    <div className="server-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="server-card-action-btn edit-btn"
                            type="button"
                            title="Editar Conexão"
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        >
                            <EditIcon sx={{ fontSize: 20 }} />
                        </button>
                        <button
                            className="server-card-action-btn delete-btn"
                            type="button"
                            title="Deletar Conexão"
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        >
                            <DeleteIcon sx={{ fontSize: 20 }} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default VncConnection;