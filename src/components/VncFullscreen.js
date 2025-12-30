import React, { useState, useEffect, useCallback, useRef } from 'react';
import VncDisplay from './VncDisplay';
import VncToolbar from './VncToolbar';

/**
 * v4.2: Modal Fullscreen para VNC com VncToolbar integrada
 * Ativado ao dar duplo clique em uma conexão do VNC Wall
 * 
 * Migrado para Tailwind CSS
 */
function VncFullscreen({ connection, onClose }) {
    const [scaleViewport, setScaleViewport] = useState(true);
    const [viewOnly, setViewOnly] = useState(true); // ✅ Inicia em modo visualização por padrão
    const [qualityLevel, setQualityLevel] = useState(9); // Máxima qualidade
    const [compressionLevel, setCompressionLevel] = useState(0); // ✅ v5.9: Sem compressão
    const [isFullscreen, setIsFullscreen] = useState(false);
    // ✅ v5.10: Estado de erro para feedback ao usuário
    const [error, setError] = useState(null);

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
        <div
            ref={containerRef}
            className={`
                fixed inset-0
                bg-black/[0.98] z-[10000]
                flex flex-col
                animate-fade-in
            `}
        >
            <div className={`
                flex flex-col overflow-hidden
                animate-scale-in
                ${isFullscreen
                    ? 'w-screen h-screen rounded-none'
                    : 'w-[95vw] h-[95vh] m-auto rounded-xl shadow-2xl md:w-screen md:h-screen md:rounded-none'
                }
            `}>
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
                <div className="
                    flex-1 overflow-hidden
                    bg-black
                    flex items-center justify-center
                    relative
                ">
                    {/* ✅ v5.10: UI de Erro */}
                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
                            <div className="text-5xl mb-4">⚠️</div>
                            <h3 className="text-red-400 text-lg font-semibold mb-2">Erro na Conexão</h3>
                            <p className="text-gray-400 text-sm mb-6 max-w-md text-center px-4">{error}</p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    )}
                    <VncDisplay
                        connectionInfo={connection}
                        scaleViewport={scaleViewport}
                        viewOnly={viewOnly}
                        quality={qualityLevel}
                        compression={compressionLevel}
                        onRfbReady={handleRfbReady}
                        onError={(errMsg) => {
                            console.error(`❌ [VncFullscreen] Erro: ${errMsg}`);
                            setError(errMsg);
                        }}
                        onDisconnect={onClose}
                    />
                </div>
            </div>
        </div>
    );
}

export default VncFullscreen;
