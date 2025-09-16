// src/components/VncConnection.js (Versão para RealVNC)
import React from 'react';

// (Seus ícones aqui)
const EditIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> );
const DeleteIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> );


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
                        <span className="protocol-icon">🖥️</span>
                        <span className="server-name">{connectionInfo.name}</span>
                    </div>
                    <div className="server-details">
                        <div className="server-address">
                            <span className="address-icon">🌐</span>
                            <span>{connectionInfo.ipAddress}:{connectionInfo.port}</span>
                        </div>
                        {connectionInfo.viewOnly && (
                            <div className="server-user">
                                <span className="user-icon">👁️</span>
                                <span>Apenas Visualização</span>
                            </div>
                        )}
                    </div>
                </div>

                {isEditModeEnabled && (
                    <div className="server-actions">
                        <button 
                            className="action-button-icon edit" 
                            title="Editar Conexão" 
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        >
                           <EditIcon />
                        </button>
                        <button 
                            className="action-button-icon delete" 
                            title="Deletar Conexão" 
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        >
                            <DeleteIcon />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default VncConnection;