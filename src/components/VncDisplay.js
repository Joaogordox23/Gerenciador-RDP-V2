import React, { useEffect, useRef, useState, useCallback } from 'react';
import RFB from '@novnc/novnc/core/rfb';

function VncDisplay({ connectionInfo, onDisconnect, onError, viewOnly = false, scaleViewport = true, quality = 2, onRfbReady }) {
    const wrapperRef = useRef(null);
    const vncContainerRef = useRef(null);
    const rfbRef = useRef(null);
    const connectionTimeoutRef = useRef(null); // Ref para limpar timeout
    const [isMounted, setIsMounted] = useState(false);

    // ✅ Estados para feedback visual de conexão
    const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'error', 'disconnected'
    const [errorMessage, setErrorMessage] = useState(null);

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
                    setConnectionStatus('connected');
                    setErrorMessage(null);

                    // ✅ Limpa o timeout quando conecta com sucesso
                    if (connectionTimeoutRef.current) {
                        clearTimeout(connectionTimeoutRef.current);
                        connectionTimeoutRef.current = null;
                    }

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
                    const detail = event.detail || {};
                    console.log(`🔌 [${connectionInfo.name}] Desconectado.`, detail);

                    // ✅ Limpa timeout se ainda estiver pendente
                    if (connectionTimeoutRef.current) {
                        clearTimeout(connectionTimeoutRef.current);
                        connectionTimeoutRef.current = null;
                    }

                    // ✅ Verifica se foi uma desconexão limpa ou erro
                    if (detail.clean === false) {
                        const errMsg = detail.reason || 'Não foi possível conectar ao servidor VNC';
                        setConnectionStatus('error');
                        setErrorMessage(errMsg);
                        if (onError) onError(errMsg);
                        // ✅ Só chama onDisconnect em erro para remover da lista
                        if (onDisconnect) onDisconnect();
                    } else {
                        setConnectionStatus('disconnected');
                        // ✅ NÃO chama onDisconnect em desconexão limpa intencional
                        // O usuário controla isso via checkbox
                    }
                });

                rfb.addEventListener('credentialsrequired', () => {
                    console.warn(`🔒 [${connectionInfo.name}] Credenciais requeridas.`);
                    setConnectionStatus('error');
                    const errMsg = 'Credenciais VNC requeridas ou inválidas';
                    setErrorMessage(errMsg);
                    if (onError) onError(errMsg);
                });

                // Timeout de conexão - usa ref para verificar status atual
                connectionTimeoutRef.current = setTimeout(() => {
                    // ✅ Verifica se ainda está conectando usando rfbRef
                    if (rfbRef.current && !rfbRef.current._rfbConnectionState?.startsWith('connected')) {
                        setConnectionStatus('error');
                        const errMsg = 'Tempo limite de conexão excedido (15s)';
                        setErrorMessage(errMsg);
                        if (onError) onError(errMsg);
                        if (onDisconnect) onDisconnect();
                    }
                }, 15000);

                rfbRef.current = rfb;

                // Notifica o componente pai que o RFB está pronto
                if (onRfbReady) {
                    onRfbReady(rfbRef);
                }

            } catch (error) {
                console.error(`❌ [${connectionInfo.name}] Erro ao iniciar RFB:`, error);
                setConnectionStatus('error');
                setErrorMessage(error.message || 'Erro ao iniciar conexão VNC');
                if (onError) onError(error.message);
            }
        }, 100); // 100ms debounce

        return () => {
            clearTimeout(timeoutId);
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
            }
            if (rfbRef.current) {
                console.log(`🧹 [${connectionInfo.name}] Limpando conexão VNC...`);
                rfbRef.current.disconnect();
                rfbRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connectionInfo?.proxyUrl, connectionInfo?.password, isMounted, containerSize, viewOnly, scaleViewport, quality]);

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
                    display: connectionStatus === 'error' ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            />

            {/* ✅ UI de Erro VNC */}
            {connectionStatus === 'error' && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    color: '#fff',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                    <h3 style={{ margin: '0 0 8px', color: '#ff6b6b', fontWeight: 600 }}>Falha na Conexão VNC</h3>
                    <p style={{ margin: 0, color: '#aaa', maxWidth: '400px', lineHeight: 1.5 }}>
                        {errorMessage || 'Não foi possível conectar ao servidor.'}
                    </p>
                    <p style={{ margin: '16px 0 0', fontSize: '12px', color: '#666' }}>
                        Verifique se o servidor está online e acessível.
                    </p>
                </div>
            )}

            {/* UI de Conectando */}
            {connectionStatus === 'connecting' && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }}>🔌</div>
                    <p style={{ margin: 0 }}>Conectando...</p>
                </div>
            )}

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