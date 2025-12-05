/**
 * ConnectionViewerModal.js
 * Modal fullscreen para conexões remotas via Guacamole
 * Suporta RDP, SSH e VNC
 */

import React, { useEffect } from 'react';
import RemoteDesktopViewer from './RemoteDesktopViewer';
import './ConnectionViewerModal.css';

function ConnectionViewerModal({ connectionInfo, onClose }) {
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

    if (!connectionInfo) return null;

    // Determina protocolo baseado no serverInfo
    const protocol = connectionInfo.protocol ||
        (connectionInfo.connectionType === 'ssh' ? 'ssh' : 'rdp');

    // Debug: ver o que está chegando
    console.log('📋 ConnectionInfo recebido:', connectionInfo);
    console.log('🔑 Credenciais:', {
        username: connectionInfo.username,
        password: connectionInfo.password ? '***' : '(vazio)',
        domain: connectionInfo.domain
    });

    // Prepara dados para o Guacamole
    const guacamoleConnection = {
        protocol: protocol,
        name: connectionInfo.name,
        ipAddress: connectionInfo.ipAddress || connectionInfo.hostname,
        port: connectionInfo.port || (protocol === 'rdp' ? '3389' : protocol === 'ssh' ? '22' : '5900'),
        username: connectionInfo.username || '',
        password: connectionInfo.password || '',
        domain: connectionInfo.domain || ''
    };

    console.log('🥑 Guacamole Connection:', { ...guacamoleConnection, password: guacamoleConnection.password ? '***' : '(vazio)' });

    return (
        <div className="connection-viewer-modal-overlay">
            <div className="connection-viewer-modal">
                <RemoteDesktopViewer
                    connectionInfo={guacamoleConnection}
                    onDisconnect={onClose}
                    fullscreen={true}
                />
            </div>
        </div>
    );
}

export default ConnectionViewerModal;
