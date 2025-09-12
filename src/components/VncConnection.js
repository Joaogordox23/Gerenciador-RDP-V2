// src/components/VncConnection.js

import React from 'react';

// 1. Adicionar 'onEdit' à lista de propriedades
function VncConnection({ connectionInfo, isEditModeEnabled, onDelete, onEdit }) {

    const handleConnect = () => {
        if (isEditModeEnabled) {
            return;
        }
        console.log(`Iniciando conexão VNC para: ${connectionInfo.name}`);
        if (window.api && window.api.connection && window.api.connection.connectVnc) {
            window.api.connection.connectVnc(connectionInfo)
                .then(result => {
                    if (result.success) {
                        console.log('Comando de conexão VNC enviado com sucesso.');
                    } else {
                        console.error('Ocorreu um erro ao tentar iniciar a conexão VNC:', result.message);
                    }
                })
                .catch(err => {
                    console.error('Erro fatal ao chamar a API de conexão VNC:', err);
                });
        } else {
            console.error('API de conexão VNC (window.api.connection.connectVnc) não encontrada!');
            alert('Erro: A função para conectar via VNC não está disponível. Verifique a configuração do preload.');
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
                        {/* 2. Conectar a função onEdit ao botão */}
                        <button 
                            className="action-btn edit-btn" 
                            title="Editar Conexão" 
                            onClick={(e) => { 
                                e.stopPropagation(); // Previne o início da conexão
                                onEdit(); // Chama a função para abrir o formulário de edição
                            }}
                        >
                            ✏️
                        </button>
                        <button className="action-btn delete-btn" title="Deletar Conexão" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                            🗑️
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default VncConnection;