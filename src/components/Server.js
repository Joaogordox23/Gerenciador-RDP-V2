import React, { useState, useCallback } from 'react';
import { useConnectivity } from '../hooks/useConnectivity';

// --- ÍCONES SVG ---
const EditIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> );
const DeleteIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> );
const TestIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.88.99 6.6 2.6l-2.6 2.6"></path><path d="M21 3v6h-6"></path></svg> );
const MonitorIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg> );

function Server({ serverInfo, onDelete, onUpdate, isActive, isEditModeEnabled }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [editData, setEditData] = useState({
        protocol: serverInfo.protocol || 'rdp',
        name: serverInfo.name,
        ipAddress: serverInfo.ipAddress,
        username: serverInfo.username || '',
        password: '',
        domain: serverInfo.domain || '',
        port: serverInfo.port || (serverInfo.protocol === 'ssh' ? '22' : '')
    });

    // Usando o novo hook de conectividade centralizado
    const { 
        results, 
        isTesting, 
        monitoredServers, 
        generateServerKey, 
        testServer, 
        startMonitoring, 
        stopMonitoring 
    } = useConnectivity();
    
    // Gerando uma chave única para este servidor
    const serverKey = generateServerKey(serverInfo);

    // Obtendo os dados de conectividade para ESTE servidor a partir do contexto
    const connectivityResult = results.get(serverKey);
    const isCurrentlyTesting = isTesting.has(serverKey);
    const isMonitored = monitoredServers.has(serverKey);

    // --- HANDLERS ---
    const handleConnect = async () => {
        if (isEditModeEnabled || isEditing) return;
        
        setIsConnecting(true);
        if (window.api && window.api.connection && window.api.connection.connect) {
            window.api.connection.connect(serverInfo);
        } else {
            console.error('❌ API de conexão não disponível');
        }
        // O estado de 'ativo' será atualizado pelo listener no App.js
        // Apenas removemos o 'conectando' após um tempo para feedback visual
        setTimeout(() => setIsConnecting(false), 3000);
    };

    const handleTestConnectivity = (e) => {
        e.stopPropagation();
        testServer(serverInfo);
    };

    const handleToggleMonitoring = (e) => {
        e.stopPropagation();
        if (isMonitored) {
            stopMonitoring(serverKey);
        } else {
            startMonitoring(serverInfo);
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (isMonitored) stopMonitoring(serverKey); // Para o monitoramento antes de deletar
        onDelete();
    };

    const handleUpdateSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onUpdate(editData);
        setIsEditing(false);
    };

    const handleInputChange = (e) => {
        setEditData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // --- LÓGICA DE STATUS ---
    const getStatusInfo = useCallback(() => {
        if (isConnecting) return { text: 'Conectando...', className: 'connecting', icon: '⏳' };
        if (isActive) return { text: 'Ativo', className: 'active', icon: '🟢' };
        if (isCurrentlyTesting) return { text: 'Testando...', className: 'testing', icon: '🔄' };
        
        if (!connectivityResult) return { text: 'Desconhecido', className: 'unknown', icon: '❓' };
        
        switch(connectivityResult.status) {
            case 'online': return { text: 'Online', className: 'online', icon: '✅' };
            case 'offline': return { text: 'Offline', className: 'offline', icon: '❌' };
            case 'partial': return { text: 'Parcial', className: 'partial', icon: '⚠️' };
            default: return { text: 'Erro', className: 'error', icon: '🔥' };
        }
    }, [isActive, isConnecting, isCurrentlyTesting, connectivityResult]);

    const statusInfo = getStatusInfo();

    // --- RENDER ---

    if (isEditing) {
        return (
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
                                <input name="port" value={editData.port} onChange={handleInputChange} className="form-input" placeholder="22"/>
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

    return (
        <div className={`server-item ${statusInfo.className} ${isMonitored ? 'monitored' : ''}`} onClick={handleConnect}>
            <div className="server-header">
                <div className="server-info">
                    <div className="server-title">
                        <span className="protocol-icon">{serverInfo.protocol === 'rdp' ? '🖥️' : '💻'}</span>
                        <span className="server-name">{serverInfo.name}</span>
                        <div className={`status-indicator ${statusInfo.className}`}></div>
                    </div>
                    <div className="server-details">
                        <div className="server-address">
                            <span>🌐</span>
                            <span>{serverInfo.ipAddress}{serverInfo.port ? `:${serverInfo.port}` : ''}</span>
                        </div>
                        <div className="server-user">
                            <span>👤</span>
                            <span>{serverInfo.domain && `${serverInfo.domain}\\`}{serverInfo.username}</span>
                        </div>
                    </div>
                </div>
                <div className="server-actions">
                    <button onClick={handleTestConnectivity} disabled={isCurrentlyTesting} className="action-button-icon" title="Testar conectividade">
                        <TestIcon />
                    </button>
                    <button onClick={handleToggleMonitoring} className={`action-button-icon ${isMonitored ? 'active' : ''}`} title={isMonitored ? 'Parar monitoramento' : 'Monitorar'}>
                        <MonitorIcon />
                    </button>
                    {isEditModeEnabled && (
                        <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="action-button-icon edit" title="Editar servidor">
                            <EditIcon />
                        </button>
                    )}
                    {isEditModeEnabled && (
                        <button onClick={handleDeleteClick} className="action-button-icon delete" title="Deletar servidor">
                            <DeleteIcon />
                        </button>
                    )}
                </div>
            </div>
            <div className={`connection-status ${statusInfo.className}`}>
                <span className="status-icon">{statusInfo.icon}</span>
                <span className="status-message">{statusInfo.text}</span>
                {connectivityResult?.tests?.ping?.averageLatency && (
                    <span className="latency-info">{connectivityResult.tests.ping.averageLatency}ms</span>
                )}
            </div>
        </div>
    );
}

export default Server;