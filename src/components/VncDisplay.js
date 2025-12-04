import React, { useEffect, useRef, useState } from 'react';
import RFB from '@novnc/novnc/core/rfb';

function VncDisplay({ connectionInfo, onDisconnect, viewOnly = false, scaleViewport = true, quality = 2 }) {
    const vncContainerRef = useRef(null);
    const rfbRef = useRef(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

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

    useEffect(() => {
        if (!connectionInfo || !connectionInfo.proxyUrl || !vncContainerRef.current || !isMounted) {
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

                const rfb = new RFB(vncContainerRef.current, proxyUrl, {
                    credentials: { password: password },
                });

                rfb.viewOnly = viewOnly;
                rfb.scaleViewport = scaleViewport; // Ajusta ao tamanho do container
                rfb.resizeSession = false; // Não redimensiona a sessão remota
                rfb.showDotCursor = !viewOnly; // Esconde cursor no modo viewOnly
                rfb.qualityLevel = quality; // 0-9

                rfb.addEventListener('connect', () => {
                    console.log(`✅ [${connectionInfo.name}] Conectado via proxy!`);
                });

                rfb.addEventListener('disconnect', (event) => {
                    console.log(`🔌 [${connectionInfo.name}] Desconectado.`, event.detail);
                    if (isMounted) {
                        // Opcional: Auto-reconectar ou notificar pai
                    }
                });

                rfb.addEventListener('credentialsrequired', () => {
                    console.warn(`🔒 [${connectionInfo.name}] Credenciais requeridas.`);
                });

                rfbRef.current = rfb;

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
    }, [connectionInfo, isMounted, viewOnly, scaleViewport, quality]);

    if (!connectionInfo) return null;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            backgroundColor: '#000',
            overflow: 'hidden'
        }}>
            <div ref={vncContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* Escudo de cliques para modo viewOnly - Permite que o doubleClick funcione */}
            {viewOnly && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 5, // Acima do canvas, abaixo dos controles
                    cursor: 'pointer'
                }} />
            )}

            {/* Overlay Compacto para Grid */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '4px 8px',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
            }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {connectionInfo.name}
                </span>
                <button
                    onClick={onDisconnect}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ff5252',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        padding: '0 4px',
                        lineHeight: 1
                    }}
                    title="Desconectar"
                >
                    ×
                </button>
            </div>
        </div>
    );
}

export default VncDisplay;