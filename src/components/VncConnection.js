// src/components/VncConnection.js - Versão final com lógica de conexão

import React from 'react';

function VncConnection({ connectionInfo, isEditModeEnabled, onDelete }) {

    const handleConnect = () => {
        // Se o modo de edição estiver ativo, não faz nada para evitar conflitos
        if (isEditModeEnabled) {
            return;
        }

        console.log(`Iniciando conexão VNC para: ${connectionInfo.name}`);
        
        // Verifica se a API está disponível e chama a nova função `connectVnc`
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
            // Opcional: Mostrar um alerta ao utilizador para um feedback mais claro
            alert('Erro: A função para conectar via VNC não está disponível. Verifique a configuração do preload.');
        }
    };

    return (
        // Adicionamos o onClick ao div principal
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
                        <button className="action-btn edit-btn" title="Editar Conexão" onClick={(e) => { e.stopPropagation(); /* Adicionar lógica de edição aqui */ }}>
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

