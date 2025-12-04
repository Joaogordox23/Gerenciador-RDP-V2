import React, { useState, useEffect, useCallback } from 'react';
import VncDisplay from './VncDisplay';
import { CloseIcon } from './MuiIcons';
import './VncFullscreen.css';

/**
 * v4.1: Modal Fullscreen para VNC com controle total
 * Ativado ao dar duplo clique em uma conexão do VNC Wall
 */
function VncFullscreen({ connection, onClose }) {
    const [scaleViewport, setScaleViewport] = useState(true);
    const [viewOnly, setViewOnly] = useState(false);

    // ESC para fechar
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        // Adiciona listener global para ESC
        document.addEventListener('keydown', handleKeyDown);

        // Previne scroll do body
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [handleKeyDown]);

    if (!connection) return null;

    return (
        <div className="vnc-fullscreen-overlay" onClick={onClose}>
            <div className="vnc-fullscreen-container" onClick={(e) => e.stopPropagation()}>
                {/* Header com controles */}
                <div className="vnc-fullscreen-header">
                    <div className="vnc-fullscreen-info">
                        <h2>{connection.name}</h2>
                        <span className="vnc-address">
                            {connection.ipAddress}:{connection.port}
                        </span>
                    </div>

                    <div className="vnc-fullscreen-controls">
                        <button
                            onClick={() => setScaleViewport(!scaleViewport)}
                            className="vnc-control-btn"
                            title={scaleViewport ? 'Tamanho Real' : 'Ajustar à Tela'}
                        >
                            {scaleViewport ? '🔍 Tamanho Real' : '📐 Ajustar'}
                        </button>

                        <button
                            onClick={() => setViewOnly(!viewOnly)}
                            className="vnc-control-btn"
                            title={viewOnly ? 'Habilitar Controle' : 'Apenas Visualização'}
                        >
                            {viewOnly ? '🔓 Habilitar Controle' : '🔒 Apenas Visualização'}
                        </button>

                        <button
                            onClick={onClose}
                            className="vnc-close-btn"
                            title="Fechar (ESC)"
                        >
                            <CloseIcon sx={{ fontSize: 20 }} />
                            Fechar
                        </button>
                    </div>
                </div>

                {/* Display VNC com controle total */}
                <div className="vnc-fullscreen-display">
                    <VncDisplay
                        connectionInfo={connection}
                        scaleViewport={scaleViewport}
                        viewOnly={viewOnly}
                        showControls={false}
                        quality={9} // Máxima qualidade
                    />
                </div>
            </div>
        </div>
    );
}

export default VncFullscreen;
