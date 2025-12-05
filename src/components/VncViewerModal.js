/**
 * VncViewerModal.js
 * Modal fullscreen para visualização de conexões VNC via noVNC
 */

import React, { useState, useEffect } from 'react';
import VncDisplay from './VncDisplay';
import './VncViewerModal.css';

function VncViewerModal({ connectionInfo, onClose }) {
    const [proxyInfo, setProxyInfo] = useState(null);
    const [isConnecting, setIsConnecting] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!connectionInfo) return;

        const startProxy = async () => {
            setIsConnecting(true);
            setError(null);

            try {
                console.log('🔌 [VncViewerModal] Iniciando proxy para:', connectionInfo.name);

                // Inicia o proxy WebSocket via IPC
                const result = await window.api.vnc.startProxy(connectionInfo);

                if (result.success) {
                    console.log('✅ [VncViewerModal] Proxy iniciado na porta:', result.port);

                    // Prepara info para o VncDisplay
                    setProxyInfo({
                        name: connectionInfo.name,
                        proxyUrl: `ws://localhost:${result.port}`,
                        password: result.decryptedPassword || connectionInfo.password
                    });
                } else {
                    throw new Error(result.error || 'Falha ao iniciar proxy');
                }
            } catch (err) {
                console.error('❌ [VncViewerModal] Erro:', err);
                setError(err.message);
            } finally {
                setIsConnecting(false);
            }
        };

        startProxy();

        // Cleanup: para o proxy quando o modal fecha
        return () => {
            if (connectionInfo) {
                console.log('🧹 [VncViewerModal] Parando proxy para:', connectionInfo.name);
                window.api.vnc.stopProxy(connectionInfo.id);
            }
        };
    }, [connectionInfo]);

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

    return (
        <div className="vnc-viewer-modal-overlay">
            <div className="vnc-viewer-modal">
                {/* Header */}
                <div className="vnc-viewer-header">
                    <div className="vnc-viewer-title">
                        <span className="vnc-viewer-icon">🖥️</span>
                        <span>{connectionInfo.name}</span>
                        <span className="vnc-viewer-address">
                            {connectionInfo.ipAddress}:{connectionInfo.port}
                        </span>
                    </div>
                    <div className="vnc-viewer-actions">
                        <button
                            className="vnc-viewer-close"
                            onClick={onClose}
                            title="Fechar (ESC)"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="vnc-viewer-content">
                    {isConnecting && (
                        <div className="vnc-viewer-loading">
                            <div className="spinner"></div>
                            <p>Conectando a {connectionInfo.name}...</p>
                        </div>
                    )}

                    {error && (
                        <div className="vnc-viewer-error">
                            <p>❌ {error}</p>
                            <button onClick={onClose}>Fechar</button>
                        </div>
                    )}

                    {proxyInfo && !error && (
                        <VncDisplay
                            connectionInfo={proxyInfo}
                            onDisconnect={onClose}
                            viewOnly={connectionInfo.viewOnly || false}
                            scaleViewport={true}
                            quality={6}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default VncViewerModal;
