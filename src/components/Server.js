// src/components/Server.js - VERSÃO MELHORADA COM CONECTIVIDADE
// Componente servidor enterprise com indicadores visuais completos

import React, { useState, useEffect, useCallback } from 'react';
import useConnectivity from '../hooks/useConnectivity';
import ConnectivityIndicator from './ConnectivityIndicator';

function Server({ 
    serverInfo, 
    onDelete, 
    onUpdate, 
    isActive, 
    isEditModeEnabled,
    isConnectivityEnabled = true 
}) {
    // Estados originais
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        protocol: serverInfo.protocol || 'rdp',
        name: serverInfo.name,
        ipAddress: serverInfo.ipAddress,
        username: serverInfo.username || '',
        password: serverInfo.password || '',
        domain: serverInfo.domain || '',
        port: serverInfo.port || '22'
    });

    // ==========================
    // NOVOS ESTADOS PARA CONECTIVIDADE
    // ==========================
    const [showTooltip, setShowTooltip] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [lastConnectionTime, setLastConnectionTime] = useState(null);
    const [connectionHistory, setConnectionHistory] = useState([]);

    // Hook de conectividade
    const {
        testServer,
        startMonitoring,
        stopMonitoring,
        isServerTesting,
        getConnectivityResult,
        isServerMonitored,
        isConnectivityEnabled: globalConnectivityEnabled
    } = useConnectivity();

    // ==========================
    // COMPUTED VALUES
    // ==========================
    const serverKey = `${serverInfo.ipAddress}:${serverInfo.port || (serverInfo.protocol === 'rdp' ? 3389 : 22)}`;
    const connectivityResult = getConnectivityResult(serverKey);
    const isTesting = isServerTesting(serverKey);
    const isMonitored = isServerMonitored(serverKey);
    const connectivityEnabled = isConnectivityEnabled && globalConnectivityEnabled;

    // Determina o status atual combinando conexão e conectividade
    const getCurrentStatus = useCallback(() => {
        if (isConnecting) return 'connecting';
        if (isActive) return 'active';
        if (!connectivityEnabled) return 'unknown';
        if (isTesting) return 'testing';
        if (connectivityResult) {
            return connectivityResult.status;
        }
        return 'unknown';
    }, [isConnecting, isActive, connectivityEnabled, isTesting, connectivityResult]);

    const currentStatus = getCurrentStatus();

    // ==========================
    // EFFECTS
    // ==========================
    useEffect(() => {
        // Escuta mudanças de status de conexão
        if (window.api && window.api.onConnectionStatus) {
            const handleConnectionStatus = (serverId, status) => {
                if (serverId === serverInfo.id) {
                    setIsConnecting(status === 'connecting');
                    if (status === 'connected') {
                        setLastConnectionTime(Date.now());
                        setConnectionHistory(prev => [...prev.slice(-4), {
                            timestamp: Date.now(),
                            status: 'connected'
                        }]);
                    }
                }
            };

            window.api.onConnectionStatus(handleConnectionStatus);
        }
    }, [serverInfo.id]);

    // ==========================
    // HANDLERS ORIGINAIS
    // ==========================
    const handleConnect = async () => {
        // Verifica conectividade antes de tentar conectar (se habilitada)
        if (connectivityEnabled && connectivityResult && connectivityResult.status === 'offline') {
            const confirmConnect = window.confirm(
                `O servidor ${serverInfo.name} parece estar offline.\n\nDeseja tentar conectar mesmo assim?`
            );
            if (!confirmConnect) {
                return;
            }
        }

        setIsConnecting(true);

        // Conecta via API original
        if (window.api && window.api.connection && window.api.connection.connect) {
            console.log(`🔌 Conectando ao servidor ${serverInfo.name}...`);
            window.api.connection.connect(serverInfo);
        } else {
            console.error('❌ API de conexão não disponível');
            setIsConnecting(false);
        }
    };

    const handleDeleteClick = (event) => {
        event.stopPropagation();
        
        // Para monitoramento se estiver ativo
        if (isMonitored) {
            stopMonitoring(serverKey);
        }
        
        onDelete();
    };

    const handleUpdateSubmit = (event) => {
        event.preventDefault();
        event.stopPropagation();
        onUpdate(editData);
        setIsEditing(false);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setEditData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // ==========================
    // NOVOS HANDLERS DE CONECTIVIDADE
    // ==========================
    const handleTestConnectivity = async (event) => {
        event.stopPropagation();
        
        if (!connectivityEnabled) {
            console.warn('⚠️ Conectividade desabilitada');
            return;
        }

        try {
            console.log(`🧪 Testando conectividade: ${serverInfo.name}`);
            await testServer({
                name: serverInfo.name,
                ipAddress: serverInfo.ipAddress,
                protocol: serverInfo.protocol,
                port: serverInfo.port
            });
        } catch (error) {
            console.error('❌ Erro no teste:', error);
        }
    };

    const handleToggleMonitoring = (event) => {
        event.stopPropagation();
        
        if (!connectivityEnabled) {
            console.warn('⚠️ Conectividade desabilitada');
            return;
        }

        const serverData = {
            name: serverInfo.name,
            ipAddress: serverInfo.ipAddress,
            protocol: serverInfo.protocol,
            port: serverInfo.port
        };

        if (isMonitored) {
            console.log(`📡 Parando monitoramento: ${serverInfo.name}`);
            stopMonitoring(serverKey);
        } else {
            console.log(`📡 Iniciando monitoramento: ${serverInfo.name}`);
            startMonitoring(serverData);
        }
    };

    const handleShowTooltip = () => {
        if (connectivityEnabled && connectivityResult) {
            setShowTooltip(true);
        }
    };

    const handleHideTooltip = () => {
        setShowTooltip(false);
    };

    // ==========================
    // HELPER FUNCTIONS
    // ==========================
    const getStatusIcon = () => {
        switch (currentStatus) {
            case 'active': return '✅';
            case 'connecting': return '🔄';
            case 'online': return '🟢';
            case 'offline': return '🔴';
            case 'partial': return '⚠️';
            case 'testing': return '🔄';
            case 'error': return '❌';
            default: return '❓';
        }
    };

    const getStatusMessage = () => {
        if (isActive) return 'Conexão ativa';
        if (isConnecting) return 'Conectando...';
        if (!connectivityEnabled) return 'Conectividade desabilitada';
        if (isTesting) return 'Testando conectividade...';
        if (connectivityResult) {
            return connectivityResult.message || connectivityResult.status;
        }
        return 'Status desconhecido';
    };

    // ==========================
    // RENDER - MODO EDIÇÃO
    // ==========================
    if (isEditing) {
        return (
            <div className={`server-item editing ${currentStatus}`}>
                <form onSubmit={handleUpdateSubmit} className="server-edit-form-inline" onClick={(e) => e.stopPropagation()}>
                    <div className="form-grid">
                        {/* Protocolo */}
                        <div className="form-row">
                            <label className="form-label">🔌 Protocolo:</label>
                            <div className="protocol-selector">
                                <div className="protocol-option">
                                    <input type="radio" id={`edit-rdp-${serverInfo.id}`} name="protocol" value="rdp" checked={editData.protocol === 'rdp'} onChange={handleInputChange} />
                                    <label htmlFor={`edit-rdp-${serverInfo.id}`} className="protocol-label">🖥️ RDP</label>
                                </div>
                                <div className="protocol-option">
                                    <input type="radio" id={`edit-ssh-${serverInfo.id}`} name="protocol" value="ssh" checked={editData.protocol === 'ssh'} onChange={handleInputChange} />
                                    <label htmlFor={`edit-ssh-${serverInfo.id}`} className="protocol-label">💻 SSH</label>
                                </div>
                            </div>
                        </div>

                        {/* Nome */}
                        <div className="form-row">
                            <label htmlFor={`name-${serverInfo.id}`} className="form-label">🏷️ Nome:</label>
                            <input type="text" id={`name-${serverInfo.id}`} name="name" value={editData.name} onChange={handleInputChange} className="form-input" required />
                        </div>

                        {/* IP/Hostname */}
                        <div className="form-row">
                            <label htmlFor={`ip-${serverInfo.id}`} className="form-label">🌐 IP/Hostname:</label>
                            <input type="text" id={`ip-${serverInfo.id}`} name="ipAddress" value={editData.ipAddress} onChange={handleInputChange} className="form-input" required />
                        </div>

                        {/* Usuário */}
                        <div className="form-row">
                            <label htmlFor={`username-${serverInfo.id}`} className="form-label">👤 Usuário:</label>
                            <input type="text" id={`username-${serverInfo.id}`} name="username" value={editData.username} onChange={handleInputChange} className="form-input" />
                        </div>

                        {/* Senha */}
                        <div className="form-row">
                            <label htmlFor={`password-${serverInfo.id}`} className="form-label">🔑 Nova Senha:</label>
                            <input type="password" id={`password-${serverInfo.id}`} name="password" placeholder="Deixe em branco para não alterar" onChange={handleInputChange} className="form-input" />
                        </div>

                        {/* Campos específicos do protocolo */}
                        {editData.protocol === 'rdp' && (
                            <div className="form-row">
                                <label htmlFor={`domain-${serverInfo.id}`} className="form-label">🏢 Domínio:</label>
                                <input type="text" id={`domain-${serverInfo.id}`} name="domain" value={editData.domain} onChange={handleInputChange} className="form-input" />
                            </div>
                        )}
                        {editData.protocol === 'ssh' && (
                            <div className="form-row">
                                <label htmlFor={`port-${serverInfo.id}`} className="form-label">🔌 Porta:</label>
                                <input type="number" id={`port-${serverInfo.id}`} name="port" value={editData.port} onChange={handleInputChange} className="form-input" min="1" max="65535" />
                            </div>
                        )}
                    </div>

                    {/* Botões de Ação */}
                    <div className="form-actions">
                        <button type="button" onClick={() => setIsEditing(false)} className="btn-cancel">
                            ❌ Cancelar
                        </button>
                        <button type="submit" className="btn-submit">
                            ✅ Salvar
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // ==========================
    // RENDER - MODO NORMAL
    // ==========================
    return (
        <div 
            className={`server-item ${currentStatus} ${isMonitored ? 'monitored' : ''}`}
            onClick={handleConnect}
            onMouseEnter={handleShowTooltip}
            onMouseLeave={handleHideTooltip}
        >
            {isConnecting && (
                <div className="loading-overlay">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <span>Conectando...</span>
                    </div>
                </div>
            )}

            {/* Header do servidor */}
            <div className="server-header">
                <div className="server-info">
                    {/* Título com indicador de status */}
                    <div className="server-title">
                        <span className="protocol-icon">
                            {serverInfo.protocol === 'rdp' ? '🖥️' : '💻'}
                        </span>
                        <span className="server-name">{serverInfo.name}</span>
                        
                        {/* Integração com ConnectivityIndicator */}
                        {connectivityEnabled && (
                            <div className="connectivity-section">
                                <ConnectivityIndicator
                                    server={{
                                        name: serverInfo.name,
                                        ipAddress: serverInfo.ipAddress,
                                        protocol: serverInfo.protocol,
                                        port: serverInfo.port
                                    }}
                                    size="medium"
                                    showLatency={true}
                                    autoTest={false}
                                />
                            </div>
                        )}
                    </div>

                    {/* Detalhes do servidor */}
                    <div className="server-details">
                        <div className="server-address">
                            <span className="address-icon">🌐</span>
                            <span>
                                {serverInfo.ipAddress}
                                {serverInfo.protocol === 'ssh' && serverInfo.port && `:${serverInfo.port}`}
                            </span>
                        </div>
                        
                        {(serverInfo.username || serverInfo.domain) && (
                            <div className="server-user">
                                <span className="user-icon">👤</span>
                                <span>
                                    {serverInfo.domain && `${serverInfo.domain}\\`}
                                    {serverInfo.username}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ações do servidor */}
                <div className="server-actions">
                    {/* Botão de teste de conectividade */}
                    {connectivityEnabled && (
                        <button
                            type="button"
                            onClick={handleTestConnectivity}
                            disabled={isTesting}
                            className="action-btn test-btn"
                            title="Testar conectividade"
                        >
                            {isTesting ? '🔄' : '🧪'}
                        </button>
                    )}

                    {/* Botão de monitoramento */}
                    {connectivityEnabled && (
                        <button
                            type="button"
                            onClick={handleToggleMonitoring}
                            className={`action-btn monitor-btn ${isMonitored ? 'active' : ''}`}
                            title={isMonitored ? 'Parar monitoramento' : 'Monitorar continuamente'}
                        >
                            📡
                        </button>
                    )}

                    {/* Botão de edição */}
                    {isEditModeEnabled && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(true);
                            }}
                            className="action-btn edit-btn"
                            title="Editar servidor"
                        >
                            ✏️
                        </button>
                    )}

                    {/* Botão de deletar */}
                    {isEditModeEnabled && (
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            className="action-btn delete-btn"
                            title="Deletar servidor"
                        >
                            🗑️
                        </button>
                    )}
                </div>
            </div>

            {/* Status de conexão */}
            {(connectivityEnabled || isActive || isConnecting) && (
                <div className={`connection-status ${currentStatus}`}>
                    <div className="status-message">
                        <span className="status-icon">{getStatusIcon()}</span>
                        <span>{getStatusMessage()}</span>
                        
                        {connectivityResult && connectivityResult.tests?.tcpLatency?.average && (
                            <span className="latency-info">
                                {connectivityResult.tests.tcpLatency.average}ms
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Tooltip detalhado */}
            {showTooltip && connectivityResult && (
                <div className="server-tooltip">
                    <div className="tooltip-content">
                        <div className="tooltip-row">
                            <span>Status:</span>
                            <span>{connectivityResult.status}</span>
                        </div>
                        {connectivityResult.tests?.ping?.averageLatency && (
                            <div className="tooltip-row">
                                <span>Ping:</span>
                                <span>{connectivityResult.tests.ping.averageLatency}ms</span>
                            </div>
                        )}
                        {connectivityResult.tests?.port && (
                            <div className="tooltip-row">
                                <span>Porta:</span>
                                <span>
                                    {connectivityResult.tests.port.port} 
                                    {connectivityResult.tests.port.isOpen ? ' ✅' : ' ❌'}
                                </span>
                            </div>
                        )}
                        {connectivityResult.timestamp && (
                            <div className="tooltip-row">
                                <span>Testado:</span>
                                <span>{new Date(connectivityResult.timestamp).toLocaleTimeString()}</span>
                            </div>
                        )}
                        {isMonitored && (
                            <div className="tooltip-row">
                                <span>Monitoramento:</span>
                                <span>📡 Ativo</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Server;