import React, { useState, useEffect, useCallback, useRef } from 'react';
import VncDisplay from './VncDisplay';
import VncToolbar from './VncToolbar';
import { CloseIcon } from './MuiIcons';
import './VncFullscreen.css';

/**
 * v4.2: Modal Fullscreen para VNC com VncToolbar integrada
 * Ativado ao dar duplo clique em uma conexão do VNC Wall
 */
function VncFullscreen({ connection, onClose }) {
    const [scaleViewport, setScaleViewport] = useState(true);
    const [viewOnly, setViewOnly] = useState(true); // ✅ Inicia em modo visualização por padrão
    const [qualityLevel, setQualityLevel] = useState(9); // Máxima qualidade
    const [compressionLevel, setCompressionLevel] = useState(2);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const rfbRef = useRef(null);
    const containerRef = useRef(null);

    // ESC para fechar
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            if (isFullscreen) {
                exitFullscreen();
            } else {
                onClose();
            }
        }
    }, [onClose, isFullscreen]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [handleKeyDown]);

    // Callback para receber rfbRef do VncDisplay
    const handleRfbReady = useCallback((ref) => {
        rfbRef.current = ref.current;
    }, []);

    // Toggle fullscreen real
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

    if (!connection) return null;

    return (
        <div className="vnc-fullscreen-overlay" ref={containerRef}>
            <div className="vnc-fullscreen-container">
                {/* VncToolbar integrada */}
                <VncToolbar
                    rfbRef={rfbRef}
                    connectionName={connection.name}
                    viewOnly={viewOnly}
                    setViewOnly={setViewOnly}
                    scaleViewport={scaleViewport}
                    setScaleViewport={setScaleViewport}
                    qualityLevel={qualityLevel}
                    setQualityLevel={setQualityLevel}
                    onClose={onClose}
                    onFullscreen={toggleFullscreen}
                />

                {/* Display VNC com controle total */}
                <div className="vnc-fullscreen-display">
                    <VncDisplay
                        connectionInfo={connection}
                        scaleViewport={scaleViewport}
                        viewOnly={viewOnly}
                        quality={qualityLevel}
                        compression={compressionLevel}
                        onRfbReady={handleRfbReady}
                    />
                </div>
            </div>
        </div>
    );
}

export default VncFullscreen;
