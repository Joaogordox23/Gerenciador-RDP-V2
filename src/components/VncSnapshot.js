// src/components/VncSnapshot.js
// Componente de preview VNC com atualização periódica (economia de memória)
// Exibe status de conexão sem manter conexão WebSocket ativa

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    DesktopWindowsIcon,
    RefreshIcon,
    ErrorOutlineIcon,
    CloudDownloadIcon
} from './MuiIcons';

/**
 * VncSnapshot - Exibe preview estático de conexão VNC
 * Faz teste de conectividade periódico sem manter conexão ativa
 * Muito mais leve em memória que VncDisplay
 */
function VncSnapshot({
    connectionInfo,
    refreshInterval = 10000, // 10 segundos padrão
    onDoubleClick,
    onStatusChange,
    showName = true
}) {
    const [status, setStatus] = useState('checking'); // 'checking', 'online', 'offline', 'error'
    const [lastCheck, setLastCheck] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const intervalRef = useRef(null);
    const isMountedRef = useRef(true);

    const checkConnection = useCallback(async () => {
        if (!connectionInfo || !window.api?.vnc?.captureSnapshot) {
            setStatus('error');
            return;
        }

        setStatus('checking');

        try {
            const result = await window.api.vnc.captureSnapshot(connectionInfo);

            if (!isMountedRef.current) return;

            if (result.success && result.data) {
                setStatus('online');
                setDimensions({ width: result.data.width, height: result.data.height });
                setLastCheck(Date.now());
                onStatusChange?.(connectionInfo.id, 'online');
            } else {
                setStatus('offline');
                onStatusChange?.(connectionInfo.id, 'offline');
            }
        } catch (error) {
            if (!isMountedRef.current) return;
            console.error(`Erro ao verificar ${connectionInfo.name}:`, error);
            setStatus('error');
            onStatusChange?.(connectionInfo.id, 'error');
        }
    }, [connectionInfo, onStatusChange]);

    useEffect(() => {
        isMountedRef.current = true;

        // Primeira verificação
        checkConnection();

        // Verificações periódicas
        intervalRef.current = setInterval(checkConnection, refreshInterval);

        return () => {
            isMountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [checkConnection, refreshInterval]);

    const getStatusColor = () => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'offline': return 'bg-red-500';
            case 'checking': return 'bg-yellow-500 animate-pulse';
            default: return 'bg-gray-500';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'online': return <DesktopWindowsIcon sx={{ fontSize: 48 }} />;
            case 'offline': return <ErrorOutlineIcon sx={{ fontSize: 48 }} />;
            case 'checking': return <RefreshIcon sx={{ fontSize: 48 }} className="animate-spin" />;
            default: return <CloudDownloadIcon sx={{ fontSize: 48 }} />;
        }
    };

    const getBackgroundClass = () => {
        switch (status) {
            case 'online': return 'bg-gradient-to-br from-gray-800 to-gray-900';
            case 'offline': return 'bg-gradient-to-br from-red-900/30 to-gray-900';
            case 'checking': return 'bg-gradient-to-br from-yellow-900/20 to-gray-900';
            default: return 'bg-gradient-to-br from-gray-700 to-gray-900';
        }
    };

    return (
        <div
            className={`relative w-full h-full rounded-lg overflow-hidden cursor-pointer 
                ${getBackgroundClass()} flex flex-col items-center justify-center
                transition-all duration-300 hover:brightness-110`}
            onDoubleClick={onDoubleClick}
            title={`${connectionInfo.name}\n${connectionInfo.ipAddress}:${connectionInfo.port || 5900}\nStatus: ${status}${dimensions.width ? `\n${dimensions.width}x${dimensions.height}` : ''}`}
        >
            {/* Ícone central */}
            <div className={`text-gray-400 ${status === 'online' ? 'text-green-400' : status === 'offline' ? 'text-red-400' : ''}`}>
                {getStatusIcon()}
            </div>

            {/* Dimensões (se disponível) */}
            {dimensions.width > 0 && status === 'online' && (
                <div className="absolute top-2 right-2 text-xs text-gray-500 bg-black/50 px-1 rounded">
                    {dimensions.width}x{dimensions.height}
                </div>
            )}

            {/* Barra inferior com nome e status */}
            {showName && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor()}`}></span>
                    <span className="text-white text-xs truncate">{connectionInfo.name}</span>
                </div>
            )}

            {/* Indicador de refresh */}
            <button
                className="absolute top-2 left-2 p-1 rounded bg-black/50 text-gray-400 
                    opacity-0 group-hover:opacity-100 hover:text-white hover:bg-primary/80
                    transition-all duration-200"
                onClick={(e) => { e.stopPropagation(); checkConnection(); }}
                title="Atualizar agora"
            >
                <RefreshIcon sx={{ fontSize: 14 }} />
            </button>
        </div>
    );
}

export default VncSnapshot;
