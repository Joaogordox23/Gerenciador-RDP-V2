import React, { useEffect, useRef, useState, useCallback } from 'react';
import RFB from '@novnc/novnc/core/rfb';

function VncDisplay({ connectionInfo, onDisconnect, onError, viewOnly = false, scaleViewport = true, quality = 6, compression = 2, onRfbReady, frameInterval = 0 }) {
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

    // ✅ Atualiza qualidade e compressão dinamicamente
    useEffect(() => {
        if (rfbRef.current) {
            rfbRef.current.qualityLevel = quality;
            rfbRef.current.compressionLevel = compression;
            console.log(`🎨 [VncDisplay] Qualidade atualizada: quality=${quality}, compression=${compression}`);
        }
    }, [quality, compression]);

    // Nota: frameInterval foi removido pois interferia com scaleViewport
    // A economia de recursos é feita via quality e compression reduzidos

    // ✨ v4.7: CORRIGIDO - useEffect de conexão APENAS depende de proxyUrl e password
    // Outras configs (viewOnly, scaleViewport, quality) são atualizadas via refs/efeitos separados
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

                // ✅ Configurações de visualização - usa valores atuais
                rfb.viewOnly = viewOnly;
                rfb.scaleViewport = scaleViewport; // Ajusta ao tamanho do container
                rfb.clipViewport = false; // Não corta - permite ver tudo

                // ✅ MODO STEALTH: Não altera nada na área de trabalho remota
                rfb.resizeSession = false; // CRÍTICO: Não redimensiona sessão remota
                rfb.showDotCursor = true; // ✅ Mostra cursor ponto quando servidor não tem mouse físico

                // ✅ Configurações de qualidade e compressão
                rfb.qualityLevel = quality; // 0-9 (maior = melhor qualidade JPEG)
                rfb.compressionLevel = compression; // 0-9 (maior = mais compressão)

                // ✅ CAPTURA DE TECLAS ESPECIAIS (Ctrl+C/V, Windows, etc)
                // noVNC captura teclas automaticamente quando o canvas tem foco
                // focusOnClick garante que clicar no VNC dá foco para capturar teclas
                rfb.focusOnClick = true;

                rfb.addEventListener('connect', () => {
                    console.log(`✅ [${connectionInfo.name}] Conectado via proxy!`);
                    setConnectionStatus('connected');
                    setErrorMessage(null);

                    // ✅ Limpa o timeout quando conecta com sucesso
                    if (connectionTimeoutRef.current) {
                        clearTimeout(connectionTimeoutRef.current);
                        connectionTimeoutRef.current = null;
                    }

                    // ✅ v5.5: CRÍTICO - Força foco no canvas para captura de teclado
                    setTimeout(() => {
                        if (rfbRef.current) {
                            rfbRef.current.focus({ preventScroll: true });
                            console.log(`🎯 [${connectionInfo.name}] Foco definido no canvas VNC`);
                        }
                    }, 200);

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
                    // Nota: mousedown handler adicionado na seção de setup para cleanup correto
                });

                // ✅ v5.5: Clipboard bidirecional - Servidor → Local
                rfb.addEventListener('clipboard', (e) => {
                    const text = e.detail?.text;
                    if (text) {
                        console.log(`📋 [${connectionInfo.name}] Clipboard do servidor: ${text.substring(0, 50)}...`);
                        navigator.clipboard.writeText(text).catch(err =>
                            console.warn('📋 Não foi possível escrever no clipboard local:', err)
                        );
                    }
                });

                // ✅ v5.5: Bell - Notificação sonora do servidor
                rfb.addEventListener('bell', () => {
                    console.log(`🔔 [${connectionInfo.name}] Bell!`);
                    // Tenta reproduzir som de notificação do sistema
                    try {
                        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+V2teleiyAqdXx4pVAGTRpqM/d5KBPOC1MotLj4KVdRzlkpr/ZxrdlS0RekbPNx7VuVkhbhKC6tq10X1dcgpquqaF2ZmJjfJCfnZV5cW5tfISNi4N+fH18gIeHhIF/foCBg4WEgn+Af4CDhYSDgH9/gIGDhIOCgH9/gIGCg4OCgYCAgIGCgoKBgICAgYGCgoGBgICAgYGBgYGBgICBgYGBgYGAgICBgYGBgYGAgICAgYGBgYGAgICAgYCBgYCAgICAgYGBgIB/f4CAgIGAgH9/f4CAgICAf39/gICAgIB/f3+AgICAgH9/f4CAgICAf39/f4CAgH9/f39/gIB/f39/f4CAf39/f39/gH9/f39/f4B/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/');
                        audio.volume = 0.3;
                        audio.play().catch(() => { });
                    } catch (e) { /* ignore */ }
                });

                // ✅ v5.5: Intercepta Ctrl+V para colar do clipboard local
                const handleKeyDown = async (e) => {
                    // Verifica viewOnly DIRETAMENTE do RFB (evita closure stale)
                    const isViewOnly = rfbRef.current?.viewOnly ?? true;

                    if (!rfbRef.current || isViewOnly) {
                        return;
                    }

                    // Ctrl+V - Colar do clipboard local para o servidor
                    if (e.ctrlKey && e.key.toLowerCase() === 'v') {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                            const text = await navigator.clipboard.readText();
                            if (text && rfbRef.current) {
                                console.log(`📋 [${connectionInfo.name}] Colando via Ctrl+V`);
                                // 1. Sincroniza o clipboard do servidor
                                rfbRef.current.clipboardPasteFrom(text);

                                // 2. Simula Ctrl+V no servidor para executar a ação de colar
                                const XK_Control_L = 0xFFE3;
                                const XK_v = 0x0076;

                                // Pequeno delay para garantir que o clipboard foi sincronizado
                                setTimeout(() => {
                                    if (rfbRef.current) {
                                        rfbRef.current.sendKey(XK_Control_L, "ControlLeft", true);
                                        rfbRef.current.sendKey(XK_v, "KeyV", true);
                                        rfbRef.current.sendKey(XK_v, "KeyV", false);
                                        rfbRef.current.sendKey(XK_Control_L, "ControlLeft", false);
                                    }
                                }, 50);
                            } else {
                                console.warn(`📋 [${connectionInfo.name}] Clipboard vazio`);
                            }
                        } catch (err) {
                            console.warn('📋 Clipboard não acessível:', err);
                        }
                    }
                };

                // Adiciona listener no container E no canvas (useCapture = true)
                const container = vncContainerRef.current;
                const canvas = container?.querySelector('canvas');

                // ✅ v5.5: Guarda referências para cleanup
                const mouseDownHandler = () => {
                    if (rfbRef.current) {
                        rfbRef.current.focus({ preventScroll: true });
                    }
                };

                if (container) {
                    container.addEventListener('keydown', handleKeyDown, true);
                }
                if (canvas) {
                    canvas.addEventListener('keydown', handleKeyDown, true);
                    canvas.addEventListener('mousedown', mouseDownHandler);
                    canvas.tabIndex = 0;
                }

                // ✅ Guarda handlers no RFB para cleanup
                rfb._keyDownHandler = handleKeyDown;
                rfb._mouseDownHandler = mouseDownHandler;
                rfb._container = container;
                rfb._canvas = canvas;

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
                        let errMsg = detail.reason || 'Não foi possível conectar ao servidor VNC';

                        // ✅ Melhora mensagem para erros de autenticação
                        if (errMsg.toLowerCase().includes('authentication')) {
                            errMsg = 'Falha na autenticação VNC. Verifique se a senha está correta.';
                        } else if (errMsg.toLowerCase().includes('security')) {
                            errMsg = 'Erro de segurança VNC. Verifique as configurações do servidor.';
                        } else if (errMsg.toLowerCase().includes('connection refused')) {
                            errMsg = 'Conexão recusada. Verifique se o servidor VNC está ativo.';
                        } else if (errMsg.toLowerCase().includes('timeout')) {
                            errMsg = 'Tempo limite excedido. Servidor VNC não respondeu.';
                        }

                        setConnectionStatus('error');
                        setErrorMessage(errMsg);
                        if (onError) onError(errMsg);
                        // ✅ Não fecha modal automaticamente em erro - deixa usuário ver o erro
                    } else {
                        setConnectionStatus('disconnected');
                        // ✅ NÃO chama onDisconnect em desconexão limpa intencional
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

                // ✅ v5.5: Remove event listeners antes de desconectar
                const rfb = rfbRef.current;
                if (rfb._keyDownHandler) {
                    if (rfb._container) {
                        rfb._container.removeEventListener('keydown', rfb._keyDownHandler, true);
                    }
                    if (rfb._canvas) {
                        rfb._canvas.removeEventListener('keydown', rfb._keyDownHandler, true);
                    }
                }
                if (rfb._mouseDownHandler && rfb._canvas) {
                    rfb._canvas.removeEventListener('mousedown', rfb._mouseDownHandler);
                }

                rfb.disconnect();
                rfbRef.current = null;
                console.log(`✅ [${connectionInfo.name}] Cleanup completo`);
            }
        };
        // ✨ v4.7: APENAS proxyUrl e password como dependências para evitar reconexões
        // containerSize usado apenas para verificar se container tem dimensões válidas antes de conectar
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connectionInfo?.proxyUrl, connectionInfo?.password, isMounted, containerSize.width, containerSize.height]);

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