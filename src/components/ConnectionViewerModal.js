/**
 * ConnectionViewerModal.js
 * Modal fullscreen para conexões remotas via Guacamole
 * Suporta RDP e SSH com toolbar integrada
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import RemoteDesktopViewer from './RemoteDesktopViewer';
import GuacamoleToolbar from './GuacamoleToolbar';
import './ConnectionViewerModal.css';

function ConnectionViewerModal({ connectionInfo, onClose }) {
    const [status, setStatus] = useState('connecting');
    const [autoScale, setAutoScale] = useState(true);
    const clientRef = useRef(null);

    // Atalho ESC para fechar
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Handler quando o cliente Guacamole estiver pronto
    const handleClientReady = useCallback((ref) => {
        clientRef.current = ref.current;
    }, []);

    // Handler para mudança de status
    const handleStatusChange = useCallback((newStatus) => {
        setStatus(newStatus);
    }, []);

    // Toggle fullscreen nativo do navegador
    const handleFullscreen = useCallback(() => {
        const elem = document.querySelector('.connection-viewer-modal');
        if (elem) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                elem.requestFullscreen().catch(err => {
                    console.warn('Fullscreen não suportado:', err);
                });
            }
        }
    }, []);

    // Determina protocolo baseado no serverInfo
    const protocol = connectionInfo?.protocol ||
        (connectionInfo?.connectionType === 'ssh' ? 'ssh' : 'rdp');

    // ✅ CORREÇÃO: useMemo para evitar recriação do objeto a cada render
    // Isso previne o loop infinito no useEffect do RemoteDesktopViewer
    const guacamoleConnection = useMemo(() => {
        if (!connectionInfo) return null;

        return {
            protocol: protocol,
            name: connectionInfo.name,
            hostname: connectionInfo.ipAddress || connectionInfo.hostname,
            ipAddress: connectionInfo.ipAddress || connectionInfo.hostname,
            port: connectionInfo.port || (protocol === 'rdp' ? '3389' : protocol === 'ssh' ? '22' : '5900'),
            username: connectionInfo.username || '',
            password: connectionInfo.password || '',
            domain: connectionInfo.domain || ''
        };
    }, [
        connectionInfo?.name,
        connectionInfo?.ipAddress,
        connectionInfo?.hostname,
        connectionInfo?.port,
        connectionInfo?.username,
        connectionInfo?.password,
        connectionInfo?.domain,
        connectionInfo?.connectionType,
        connectionInfo?.protocol,
        protocol
    ]);

    if (!connectionInfo || !guacamoleConnection) return null;

    return (
        <div className="connection-viewer-modal-overlay">
            <div className="connection-viewer-modal">
                {/* Toolbar Guacamole */}
                <GuacamoleToolbar
                    clientRef={clientRef}
                    connectionName={connectionInfo.name}
                    connectionAddress={guacamoleConnection.hostname}
                    protocol={protocol}
                    status={status}
                    autoScale={autoScale}
                    setAutoScale={setAutoScale}
                    onClose={onClose}
                    onFullscreen={handleFullscreen}
                />

                {/* Viewer */}
                <div className="connection-viewer-content">
                    <RemoteDesktopViewer
                        connectionInfo={guacamoleConnection}
                        onDisconnect={onClose}
                        onClientReady={handleClientReady}
                        onStatusChange={handleStatusChange}
                        autoScale={autoScale}
                        fullscreen={true}
                    />
                </div>
            </div>
        </div>
    );
}

export default ConnectionViewerModal;
