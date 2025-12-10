/**
 * VncViewerModal.js
 * Modal fullscreen para visualização de conexões VNC via noVNC
 * Inclui VncToolbar com clipboard, escala, qualidade, viewOnly, Ctrl+Alt+Del
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import VncDisplay from './VncDisplay';
import VncToolbar from './VncToolbar';
import './VncViewerModal.css';

function VncViewerModal({ connectionInfo, onClose }) {
    const [proxyInfo, setProxyInfo] = useState(null);
    const [isConnecting, setIsConnecting] = useState(true);
    const [error, setError] = useState(null);

    // Estados controlados pela toolbar
    const [viewOnly, setViewOnly] = useState(true); // ✅ Inicia em modo visualização por padrão
    const [scaleViewport, setScaleViewport] = useState(true);
    const [qualityLevel, setQualityLevel] = useState(6);
    const [compressionLevel, setCompressionLevel] = useState(2);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Ref para o RFB do noVNC
    const rfbRef = useRef(null);
    const containerRef = useRef(null);

    // ✅ OTIMIZAÇÃO: Estabiliza o ID da conexão para evitar re-renders
    const stableConnectionId = useMemo(() => connectionInfo?.id, [connectionInfo?.id]);

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
        // ✅ OTIMIZAÇÃO: Depende apenas do ID estabilizado, não do objeto inteiro
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stableConnectionId]);

    // Atalho ESC para fechar
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (isFullscreen) {
                    exitFullscreen();
                } else {
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, isFullscreen]);

    // Callback para receber o rfbRef do VncDisplay
    const handleRfbReady = useCallback((ref) => {
        rfbRef.current = ref.current;
        console.log('🔗 [VncViewerModal] RFB conectado à toolbar');
    }, []);

    // Toggle fullscreen
    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch(err => {
                console.warn('Não foi possível ativar fullscreen:', err);
            });
        } else {
            exitFullscreen();
        }
    }, []);

    const exitFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Escuta evento de saída de fullscreen
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    if (!connectionInfo) return null;

    return (
        <div className="vnc-viewer-modal-overlay" ref={containerRef}>
            <div className="vnc-viewer-modal">
                {/* Toolbar com controles */}
                <VncToolbar
                    rfbRef={rfbRef}
                    connectionName={connectionInfo.name}
                    viewOnly={viewOnly}
                    setViewOnly={setViewOnly}
                    scaleViewport={scaleViewport}
                    setScaleViewport={setScaleViewport}
                    qualityLevel={qualityLevel}
                    setQualityLevel={setQualityLevel}
                    onClose={onClose}
                    onFullscreen={toggleFullscreen}
                />

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
                            onError={(errMsg) => setError(errMsg)}
                            viewOnly={viewOnly}
                            scaleViewport={scaleViewport}
                            quality={qualityLevel}
                            compression={compressionLevel}
                            onRfbReady={handleRfbReady}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default VncViewerModal;
