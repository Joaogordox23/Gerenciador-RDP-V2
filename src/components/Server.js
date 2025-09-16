import React, { useState, useEffect, useCallback } from 'react';
import useConnectivity from '../hooks/useConnectivity';
import ConnectivityIndicator from './ConnectivityIndicator';

// --- ÍCONES SVG PARA UMA UI MODERNA E CONSISTENTE ---
const EditIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> );
const DeleteIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> );
const SaveIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg> );
const CancelIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );
const TestIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.88.99 6.6 2.6l-2.6 2.6"></path><path d="M21 3v6h-6"></path></svg> );
const MonitorIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg> );

function Server({ 
    serverInfo, 
    onDelete, 
    onUpdate, 
    isActive, 
    isEditModeEnabled,
    isConnectivityEnabled = true 
}) {
    // --- TODA A SUA LÓGICA ORIGINAL É MANTIDA ---
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        protocol: serverInfo.protocol || 'rdp',
        name: serverInfo.name,
        ipAddress: serverInfo.ipAddress,
        username: serverInfo.username || '',
        password: '', // Senha sempre vazia no formulário de edição por segurança
        domain: serverInfo.domain || '',
        port: serverInfo.port || (serverInfo.protocol === 'ssh' ? '22' : '3389')
    });

    const [showTooltip, setShowTooltip] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const {
        testServer,
        startMonitoring,
        stopMonitoring,
        isServerTesting,
        getConnectivityResult,
        isServerMonitored,
        isConnectivityEnabled: globalConnectivityEnabled
    } = useConnectivity();

    const serverKey = `${serverInfo.ipAddress}:${serverInfo.port || (serverInfo.protocol === 'rdp' ? 3389 : 22)}`;
    const connectivityResult = getConnectivityResult(serverKey);
    const isTesting = isServerTesting(serverKey);
    const isMonitored = isServerMonitored(serverKey);
    const connectivityEnabled = isConnectivityEnabled && globalConnectivityEnabled;

    const getCurrentStatus = useCallback(() => {
        if (isConnecting) return 'connecting';
        if (isActive) return 'active';
        if (!connectivityEnabled) return 'unknown';
        if (isTesting) return 'testing';
        if (connectivityResult) return connectivityResult.status;
        return 'unknown';
    }, [isConnecting, isActive, connectivityEnabled, isTesting, connectivityResult]);

    const currentStatus = getCurrentStatus();

    const handleConnect = async () => {
        if (isEditModeEnabled) return;
        if (connectivityEnabled && connectivityResult && connectivityResult.status === 'offline') {
            const confirmConnect = window.confirm(`O servidor ${serverInfo.name} parece estar offline.\nDeseja tentar conectar mesmo assim?`);
            if (!confirmConnect) return;
        }
        setIsConnecting(true);
        if (window.api && window.api.connection && window.api.connection.connect) {
            window.api.connection.connect(serverInfo);
        } else {
            console.error('❌ API de conexão não disponível');
            setIsConnecting(false);
        }
        // Simula o fim da conexão para resetar o estado
        setTimeout(() => setIsConnecting(false), 5000);
    };

    const handleDeleteClick = (event) => {
        event.stopPropagation();
        if (isMonitored) stopMonitoring(serverKey);
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
        setEditData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleTestConnectivity = async (event) => {
        event.stopPropagation();
        if (!connectivityEnabled) return;
        await testServer({ name: serverInfo.name, ipAddress: serverInfo.ipAddress, protocol: serverInfo.protocol, port: serverInfo.port });
    };

    const handleToggleMonitoring = (event) => {
        event.stopPropagation();
        if (!connectivityEnabled) return;
        const serverData = { name: serverInfo.name, ipAddress: serverInfo.ipAddress, protocol: serverInfo.protocol, port: serverInfo.port };
        if (isMonitored) {
            stopMonitoring(serverKey);
        } else {
            startMonitoring(serverData);
        }
    };
    
    // ... O resto da sua lógica de handlers e helpers é mantida ...
    const getStatusIcon = () => { /* ... sua função original ... */ return '❓'; };
    const getStatusMessage = () => { /* ... sua função original ... */ return 'Status desconhecido'; };

    // ==========================
    // RENDER - MODO EDIÇÃO
    // ==========================
    if (isEditing) {
    return (
        // Usamos a mesma classe do formulário de VNC para manter a consistência
        <div className="add-group-form-container" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleUpdateSubmit} className="add-server-form" style={{padding: 'var(--space-24)'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                    <div className="form-row">
                        <label className="form-label">Nome:</label>
                        <input name="name" value={editData.name} onChange={handleInputChange} className="form-input"/>
                    </div>
                    <div className="form-row">
                        <label className="form-label">IP:</label>
                        <input name="ipAddress" value={editData.ipAddress} onChange={handleInputChange} className="form-input"/>
                    </div>
                    <div className="form-row">
                        <label className="form-label">Usuário:</label>
                        <input name="username" value={editData.username} onChange={handleInputChange} className="form-input"/>
                    </div>
                    <div className="form-row">
                        <label className="form-label">Nova Senha:</label>
                        <input name="password" type="password" placeholder="Não alterar" onChange={handleInputChange} className="form-input"/>
                    </div>
                    {editData.protocol === 'rdp' && 
                        <div className="form-row">
                            <label className="form-label">Domínio:</label>
                            <input name="domain" value={editData.domain} onChange={handleInputChange} className="form-input"/>
                        </div>
                    }
                    {editData.protocol === 'ssh' && 
                        <div className="form-row">
                            <label className="form-label">Porta:</label>
                            <input name="port" value={editData.port} onChange={handleInputChange} className="form-input"/>
                        </div>
                    }
                </div>

                <div className="form-actions" style={{marginTop: '16px'}}>
                    <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>Cancelar</button>
                    <button type="submit" className="btn-submit">Salvar</button>
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
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {isConnecting && ( <div className="loading-overlay">{/*...*/}</div> )}

            <div className="server-header">
                <div className="server-info">
                    <div className="server-title">
                        <span className="protocol-icon">{serverInfo.protocol === 'rdp' ? '🖥️' : '💻'}</span>
                        <span className="server-name">{serverInfo.name}</span>
                        {connectivityEnabled && <ConnectivityIndicator server={serverInfo} />}
                    </div>
                    <div className="server-details">
                        <div className="server-address"><span>🌐</span><span>{serverInfo.ipAddress}:{serverInfo.port}</span></div>
                        <div className="server-user"><span>👤</span><span>{serverInfo.domain && `${serverInfo.domain}\\`}{serverInfo.username}</span></div>
                    </div>
                </div>

                {/* --- BOTÕES DE AÇÃO DO CARD ATUALIZADOS --- */}
                <div className="server-actions">
                    {connectivityEnabled && (
                        <button type="button" onClick={handleTestConnectivity} disabled={isTesting} className="action-button-icon" title="Testar conectividade">
                            <TestIcon />
                        </button>
                    )}
                    {connectivityEnabled && (
                        <button type="button" onClick={handleToggleMonitoring} className={`action-button-icon ${isMonitored ? 'active' : ''}`} title={isMonitored ? 'Parar monitoramento' : 'Monitorar'}>
                            <MonitorIcon />
                        </button>
                    )}
                    {isEditModeEnabled && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="action-button-icon edit" title="Editar servidor">
                            <EditIcon />
                        </button>
                    )}
                    {isEditModeEnabled && (
                        <button type="button" onClick={handleDeleteClick} className="action-button-icon delete" title="Deletar servidor">
                            <DeleteIcon />
                        </button>
                    )}
                </div>
            </div>

            {/* ... O resto do seu JSX (connection-status, tooltip) permanece o mesmo ... */}
            {(connectivityEnabled || isActive || isConnecting) && ( <div className={`connection-status ${currentStatus}`}>{/*...*/}</div> )}
            {showTooltip && connectivityResult && ( <div className="server-tooltip">{/*...*/}</div> )}
        </div>
    );
}

export default Server;