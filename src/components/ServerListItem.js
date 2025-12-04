import React, { useState, useCallback } from 'react';
import { useConnectivity } from '../hooks/useConnectivity';
import {
    EditIcon,
    DeleteIcon,
    RefreshIcon,
    MonitorHeartIcon,
    HelpOutlineIcon,
    CheckCircleOutlineIcon,
    CancelIcon,
    WarningAmberIcon,
    SyncIcon,
    PersonOutlineIcon
} from './MuiIcons';
import './ServerListItem.css';

/**
 * ✨ v4.0: Componente de Servidor em Modo Lista (Compacto)
 * Versão simplificada do Server.js para visualização em lista
 */
function ServerListItem({
    serverInfo,
    onDelete,
    onUpdate,
    isActive,
    isEditModeEnabled,
    isConnectivityEnabled = true,
    onEdit // Nova prop para modal global
}) {
    const [isConnecting, setIsConnecting] = useState(false);

    const {
        results,
        isTesting,
        generateServerKey,
        testServer,
        startMonitoring,
        stopMonitoring,
        monitoredServers
    } = useConnectivity();

    const serverKey = generateServerKey(serverInfo);
    const connectivityResult = results.get(serverKey);
    const isCurrentlyTesting = isTesting.has(serverKey);
    const isMonitored = monitoredServers.has(serverKey);

    // Status visual
    const getStatusIcon = () => {
        if (isCurrentlyTesting) return <SyncIcon sx={{ fontSize: 16 }} className="rotating" />;
        if (!connectivityResult) return <HelpOutlineIcon sx={{ fontSize: 16 }} />;

        switch (connectivityResult.status) {
            case 'online': return <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'success.main' }} />;
            case 'offline': return <CancelIcon sx={{ fontSize: 16, color: 'error.main' }} />;
            case 'partial': return <WarningAmberIcon sx={{ fontSize: 16, color: 'warning.main' }} />;
            default: return <HelpOutlineIcon sx={{ fontSize: 16 }} />;
        }
    };

    const getStatusText = () => {
        if (isConnecting) return 'Conectando...';
        if (isActive) return 'Ativo';
        if (isCurrentlyTesting) return 'Testando...';
        if (!connectivityResult) return 'Desconhecido';
        return connectivityResult.status === 'online' ? 'Online' : 'Offline';
    };

    const handleConnect = useCallback(async () => {
        if (isEditModeEnabled) return;
        setIsConnecting(true);
        try {
            await window.api.connection.connect(serverInfo);
        } catch (error) {
            console.error('Erro ao conectar:', error);
        } finally {
            setTimeout(() => setIsConnecting(false), 3000);
        }
    }, [isEditModeEnabled, serverInfo]);

    const handleTestConnectivity = useCallback((e) => {
        e.stopPropagation();
        testServer(serverInfo);
    }, [testServer, serverInfo]);

    const handleToggleMonitoring = useCallback((e) => {
        e.stopPropagation();
        if (isMonitored) {
            stopMonitoring(serverKey);
        } else {
            startMonitoring(serverInfo);
        }
    }, [isMonitored, stopMonitoring, startMonitoring, serverKey, serverInfo]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        if (window.confirm(`Tem certeza que deseja excluir o servidor "${serverInfo.name}"?`)) {
            onDelete();
        }
    }, [serverInfo.name, onDelete]);

    return (
        <div
            className={`server-list-item ${isActive ? 'active' : ''} ${isMonitored ? 'monitored' : ''}`}
            onClick={handleConnect}
        >
            {/* Status Icon */}
            <div className="list-item-status">
                {getStatusIcon()}
            </div>

            {/* Protocol Badge */}
            <div className="list-item-protocol">
                <span className={`protocol-badge protocol-${serverInfo.protocol}`}>
                    {serverInfo.protocol.toUpperCase()}
                </span>
            </div>

            {/* Server Info */}
            <div className="list-item-info">
                <span className="list-item-name">{serverInfo.name}</span>
                <span className="list-item-address">
                    {serverInfo.ipAddress}
                    {serverInfo.port && `:${serverInfo.port}`}
                </span>
            </div>

            {/* User Info */}
            {serverInfo.username && (
                <div className="list-item-user">
                    <PersonOutlineIcon sx={{ fontSize: 14, marginRight: '4px' }} />
                    {serverInfo.username}
                    {serverInfo.domain && `@${serverInfo.domain}`}
                </div>
            )}

            {/* Status Text */}
            <div className="list-item-status-text">
                {getStatusText()}
            </div>

            {/* Actions */}
            {isEditModeEnabled && (
                <div className="list-item-actions" onClick={(e) => e.stopPropagation()}>
                    {isConnectivityEnabled && (
                        <>
                            <button
                                onClick={handleTestConnectivity}
                                className="list-action-btn"
                                title="Testar conectividade"
                                disabled={isCurrentlyTesting}
                            >
                                <RefreshIcon sx={{ fontSize: 18 }} />
                            </button>
                            <button
                                onClick={handleToggleMonitoring}
                                className={`list-action-btn ${isMonitored ? 'active' : ''}`}
                                title={isMonitored ? 'Parar monitoramento' : 'Iniciar monitoramento'}
                            >
                                <MonitorHeartIcon sx={{ fontSize: 18 }} />
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => onEdit(serverInfo)} // Chama modal global
                        className="list-action-btn"
                        title="Editar"
                    >
                        <EditIcon sx={{ fontSize: 18 }} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="list-action-btn delete"
                        title="Excluir"
                    >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default React.memo(ServerListItem);
