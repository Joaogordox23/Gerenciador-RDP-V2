// src/components/VncConnection.js (Versão para RealVNC)
import React from 'react';
import {
    EditIcon,
    DeleteIcon,
    ComputerIcon,
    PersonOutlineIcon
} from './MuiIcons';

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
        <div className="server-item vnc-connection" onClick={handleConnect}>
            <div className="server-header">
                <div className="server-info">
                    <div className="server-title">
                        <ComputerIcon sx={{ fontSize: 20, marginRight: 1, verticalAlign: 'middle' }} />
                        <span className="server-name">{connectionInfo.name}</span>
                    </div>
                    <div className="server-details">
                        <div className="server-address">
                            <span>{connectionInfo.ipAddress}:{connectionInfo.port}</span>
                        </div>
                        {connectionInfo.viewOnly && (
                            <div className="server-user">
                                <PersonOutlineIcon sx={{ fontSize: 16, marginRight: '4px', verticalAlign: 'middle' }} />
                                <span>Apenas Visualização</span>
                            </div>
                        )}
                    </div>
                </div>

                {isEditModeEnabled && (
                    <div className="server-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="action-btn edit-btn"
                            type="button"
                            title="Editar Conexão"
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        >
                            <EditIcon sx={{ fontSize: 20 }} />
                        </button>
                        <button
                            className="action-btn delete-btn"
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