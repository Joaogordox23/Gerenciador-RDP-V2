// src/components/ServerListItem.js
// ✨ v4.8: Migrado para Tailwind CSS
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

function ServerListItem({
    serverInfo,
    onDelete,
    onUpdate,
    isActive,
    isEditModeEnabled,
    isConnectivityEnabled = true,
    onEdit
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

    const getStatusInfo = () => {
        if (isCurrentlyTesting) return { icon: <SyncIcon sx={{ fontSize: 14 }} className="animate-spin" />, color: 'text-blue-400', text: 'Testando...' };
        if (!connectivityResult) return { icon: <HelpOutlineIcon sx={{ fontSize: 14 }} />, color: 'text-gray-400', text: 'Desconhecido' };
        switch (connectivityResult.status) {
            case 'online': return { icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />, color: 'text-primary', text: 'Online' };
            case 'offline': return { icon: <CancelIcon sx={{ fontSize: 14 }} />, color: 'text-red-500', text: 'Offline' };
            case 'partial': return { icon: <WarningAmberIcon sx={{ fontSize: 14 }} />, color: 'text-yellow-500', text: 'Parcial' };
            default: return { icon: <HelpOutlineIcon sx={{ fontSize: 14 }} />, color: 'text-gray-400', text: 'Desconhecido' };
        }
    };

    const statusInfo = getStatusInfo();

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
        if (isMonitored) stopMonitoring(serverKey);
        else startMonitoring(serverInfo);
    }, [isMonitored, stopMonitoring, startMonitoring, serverKey, serverInfo]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        onDelete();
    }, [onDelete]);

    const actionBtn = "p-1.5 rounded-lg transition-all duration-200 hover:scale-110";

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200
                hover:bg-primary/5
                ${isActive ? 'bg-primary/10 border-l-4 border-primary' : ''}
                ${isMonitored ? 'border-r-4 border-purple-500' : ''}`}
            onClick={handleConnect}
        >
            {/* Status Icon */}
            <div className={statusInfo.color}>{statusInfo.icon}</div>

            {/* Protocol Badge */}
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded
                ${serverInfo.protocol === 'ssh' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
                {(serverInfo.protocol || 'rdp').toUpperCase()}
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm text-slate-900 dark:text-white truncate block">{serverInfo.name}</span>
                <span className="text-xs text-gray-500 font-mono">{serverInfo.ipAddress}{serverInfo.port && `:${serverInfo.port}`}</span>
            </div>

            {/* User */}
            {serverInfo.username && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <PersonOutlineIcon sx={{ fontSize: 12 }} />
                    {serverInfo.username}{serverInfo.domain && `@${serverInfo.domain}`}
                </div>
            )}

            {/* Connection Open Badge */}
            {isActive && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    Aberta
                </span>
            )}

            {/* Status Text */}
            <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.text}</span>

            {/* Actions */}
            {isEditModeEnabled && (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {isConnectivityEnabled && (
                        <>
                            <button onClick={handleTestConnectivity} disabled={isCurrentlyTesting}
                                className={`${actionBtn} bg-gray-200 dark:bg-gray-700 text-gray-500 hover:text-blue-500 disabled:opacity-50`}
                                title="Testar"><RefreshIcon sx={{ fontSize: 16 }} /></button>
                            <button onClick={handleToggleMonitoring}
                                className={`${actionBtn} ${isMonitored ? 'bg-purple-500/20 text-purple-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:text-purple-500'}`}
                                title={isMonitored ? 'Parar' : 'Monitorar'}><MonitorHeartIcon sx={{ fontSize: 16 }} /></button>
                        </>
                    )}
                    <button onClick={() => onEdit(serverInfo)}
                        className={`${actionBtn} bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white`}
                        title="Editar"><EditIcon sx={{ fontSize: 16 }} /></button>
                    <button onClick={handleDelete}
                        className={`${actionBtn} bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white`}
                        title="Excluir"><DeleteIcon sx={{ fontSize: 16 }} /></button>
                </div>
            )}
        </div>
    );
}

export default React.memo(ServerListItem);
