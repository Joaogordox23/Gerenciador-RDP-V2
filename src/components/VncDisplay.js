import React, { useEffect, useRef, useState, useCallback } from 'react';
import RFB from '@novnc/novnc/core/rfb';

function VncDisplay({ connectionInfo, onDisconnect, viewOnly = false, scaleViewport = true, quality = 2, onRfbReady }) {
    const wrapperRef = useRef(null);
    const vncContainerRef = useRef(null);
    const rfbRef = useRef(null);
    const [isMounted, setIsMounted] = useState(false);

    // Estado para dimensões absolutas do container
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    // Calcula e atualiza dimensões absolutas do container
    const updateContainerSize = useCallback(() => {
        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            const newWidth = Math.floor(rect.width);
            const newHeight = Math.floor(rect.height);

            if (newWidth > 0 && newHeight > 0) {
                setContainerSize(prev => {
                    if (prev.width !== newWidth || prev.height !== newHeight) {
                        console.log(`📐 [VncDisplay] Container atualizado: ${newWidth}x${newHeight}px`);
                        return { width: newWidth, height: newHeight };
                    }
                    return prev;
                });
            }
        }
    }, []);

    // Observa mudanças de tamanho do container wrapper
    useEffect(() => {
        updateContainerSize();

        // ResizeObserver para detectar mudanças de tamanho
        const resizeObserver = new ResizeObserver(() => {
            updateContainerSize();
        });

        if (wrapperRef.current) {
            resizeObserver.observe(wrapperRef.current);
        }

        return () => resizeObserver.disconnect();
    }, [updateContainerSize]);

    // Atualiza viewOnly dinamicamente se a prop mudar
    useEffect(() => {
        if (rfbRef.current) {
            rfbRef.current.viewOnly = viewOnly;
        }
    }, [viewOnly]);

    // Atualiza scaleViewport dinamicamente
    useEffect(() => {
        if (rfbRef.current) {
            rfbRef.current.scaleViewport = scaleViewport;
        }
    }, [scaleViewport]);

    // Conecta ao VNC quando container tem dimensões válidas
    useEffect(() => {
        if (!connectionInfo || !connectionInfo.proxyUrl || !vncContainerRef.current || !isMounted) {
            return;
        }

        // Espera container ter dimensões válidas
        if (containerSize.width === 0 || containerSize.height === 0) {
            console.log(`⏳ [${connectionInfo.name}] Aguardando container ter dimensões...`);
            return;
        }

        // Debounce para evitar múltiplas conexões rápidas (Strict Mode)
        const timeoutId = setTimeout(() => {
            try {
                const { proxyUrl, password } = connectionInfo;

                // Limpa conexão anterior se existir
                if (rfbRef.current) {
                    rfbRef.current.disconnect();
                }

                console.log(`📐 [${connectionInfo.name}] Iniciando RFB com container: ${containerSize.width}x${containerSize.height}px`);

                const rfb = new RFB(vncContainerRef.current, proxyUrl, {
                    credentials: { password: password },
                });

                rfb.viewOnly = viewOnly;
                rfb.scaleViewport = scaleViewport; // Ajusta ao tamanho do container
                rfb.clipViewport = false; // Não corta - permite ver tudo
                rfb.resizeSession = false; // Não redimensiona a sessão remota
                rfb.showDotCursor = !viewOnly; // Esconde cursor no modo viewOnly
                rfb.qualityLevel = quality; // 0-9

                rfb.addEventListener('connect', () => {
                    console.log(`✅ [${connectionInfo.name}] Conectado via proxy!`);

                    // Força recálculo de escala após receber primeiro frame
                    setTimeout(() => {
                        if (rfbRef.current) {
                            // Toggle scaleViewport para forçar recálculo com dimensões corretas
                            rfbRef.current.scaleViewport = false;
                            setTimeout(() => {
                                if (rfbRef.current) {
                                    rfbRef.current.scaleViewport = scaleViewport;
                                    console.log(`📐 [${connectionInfo.name}] Escala recalculada`);
                                }
                            }, 100);
                        }
                    }, 300);
                });

                rfb.addEventListener('disconnect', (event) => {
                    console.log(`🔌 [${connectionInfo.name}] Desconectado.`, event.detail);
                });

                rfb.addEventListener('credentialsrequired', () => {
                    console.warn(`🔒 [${connectionInfo.name}] Credenciais requeridas.`);
                });

                rfbRef.current = rfb;

                // Notifica o componente pai que o RFB está pronto
                if (onRfbReady) {
                    onRfbReady(rfbRef);
                }

            } catch (error) {
                console.error(`❌ [${connectionInfo.name}] Erro ao iniciar RFB:`, error);
            }
        }, 100); // 100ms debounce

        return () => {
            clearTimeout(timeoutId);
            if (rfbRef.current) {
                console.log(`🧹 [${connectionInfo.name}] Limpando conexão VNC...`);
                rfbRef.current.disconnect();
                rfbRef.current = null;
            }
        };
    }, [connectionInfo, isMounted, containerSize, viewOnly, scaleViewport, quality, onRfbReady]);

    if (!connectionInfo) return null;

    return (
        <div
            ref={wrapperRef}
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                backgroundColor: '#000',
                overflow: 'hidden'
            }}
        >
            {/* Container do noVNC com dimensões absolutas */}
            <div
                ref={vncContainerRef}
                style={{
                    width: containerSize.width > 0 ? `${containerSize.width}px` : '100%',
                    height: containerSize.height > 0 ? `${containerSize.height}px` : '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            />

            {/* Escudo de cliques para modo viewOnly */}
            {viewOnly && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 5,
                    cursor: 'pointer'
                }} />
            )}
        </div>
    );
}

export default VncDisplay;