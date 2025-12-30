/**
 * useVncSession.js
 * ✨ v5.9: Hook para consolidar lógica comum entre VncViewerModal e VncFullscreen
 * 
 * Gerencia estados de:
 * - viewOnly / scaleViewport
 * - qualityLevel / compressionLevel
 * - isFullscreen + toggle
 * - rfbRef + handleRfbReady callback
 * - keyboard shortcuts (ESC, F11)
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// ✅ v5.10: Presets de qualidade centralizados para reutilização
export const VNC_QUALITY_PRESETS = {
    fullscreen: { quality: 9, compression: 0 },  // Máxima qualidade para acesso individual
    wall: { quality: 5, compression: 3 },        // Balanceado para múltiplas conexões
    carousel: { quality: 5, compression: 3 }     // Igual ao wall
};


/**
 * @param {Object} options
 * @param {Function} options.onClose - Callback para fechar o modal/view
 * @param {React.RefObject} options.containerRef - Ref do container para fullscreen
 */
export function useVncSession({ onClose, containerRef } = {}) {
    // Estados de visualização
    const [viewOnly, setViewOnly] = useState(true); // Inicia em modo visualização por padrão
    const [scaleViewport, setScaleViewport] = useState(true);
    const [qualityLevel, setQualityLevel] = useState(6);
    const [compressionLevel, setCompressionLevel] = useState(2);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Referência para o RFB do noVNC
    const rfbRef = useRef(null);

    // Callback para receber rfbRef do VncDisplay
    const handleRfbReady = useCallback((ref) => {
        rfbRef.current = ref.current;
    }, []);

    // Toggle fullscreen
    const toggleFullscreen = useCallback(() => {
        const container = containerRef?.current;
        if (!container) return;

        if (!document.fullscreenElement) {
            container.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch(err => {
                console.warn('Não foi possível ativar fullscreen:', err);
            });
        } else {
            exitFullscreen();
        }
    }, [containerRef]);

    const exitFullscreen = useCallback(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    // Escuta evento de saída de fullscreen (botão ESC do browser)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Atalhos de teclado
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (isFullscreen) {
                    exitFullscreen();
                } else if (onClose) {
                    onClose();
                }
            }
            // F11 para toggle fullscreen (se não estiver focado no VNC)
            if (e.key === 'F11' && containerRef?.current) {
                e.preventDefault();
                toggleFullscreen();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, isFullscreen, exitFullscreen, toggleFullscreen, containerRef]);

    // Bloqueia scroll do body quando ativo
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return {
        // Estados
        viewOnly,
        setViewOnly,
        scaleViewport,
        setScaleViewport,
        qualityLevel,
        setQualityLevel,
        compressionLevel,
        setCompressionLevel,
        isFullscreen,

        // Refs e callbacks
        rfbRef,
        handleRfbReady,

        // Ações
        toggleFullscreen,
        exitFullscreen,
    };
}

export default useVncSession;
