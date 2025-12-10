/**
 * RemoteDesktopViewer.js
 * Componente React para conexões remotas via Guacamole
 */

import React, { useEffect, useRef, useState } from 'react';
import Guacamole from 'guacamole-common-js';
import './RemoteDesktopViewer.css';

function RemoteDesktopViewer({
    connectionInfo,
    onDisconnect,
    onClientReady,
    onStatusChange,
    autoScale = true,
    fullscreen = false
}) {
    const displayRef = useRef(null);
    const clientRef = useRef(null);
    const mouseRef = useRef(null);
    const keyboardRef = useRef(null);
    const resizeCleanupRef = useRef(null); // Ref para cleanup do resize listener
    const [status, setStatus] = useState('disconnected');
    const [error, setError] = useState(null);

    // Função para limpar mouse e keyboard
    const cleanupInputHandlers = () => {
        if (keyboardRef.current) {
            console.log('🧹 Removendo keyboard listeners...');
            keyboardRef.current.onkeydown = null;
            keyboardRef.current.onkeyup = null;
            // Desinstala os event listeners do document
            if (typeof keyboardRef.current.reset === 'function') {
                keyboardRef.current.reset();
            }
            keyboardRef.current = null;
        }
        if (mouseRef.current) {
            console.log('🧹 Removendo mouse listeners...');
            mouseRef.current.onmousedown = null;
            mouseRef.current.onmouseup = null;
            mouseRef.current.onmousemove = null;
            mouseRef.current = null;
        }
    };

    useEffect(() => {
        if (!connectionInfo) return;

        let isCancelled = false;

        const doConnect = async () => {
            console.log('🚀 Iniciando conexão Guacamole...');
            setStatus('connecting');
            setError(null);
            if (onStatusChange) onStatusChange('connecting');

            try {
                // Busca URL configurada do servidor Guacamole
                let wsBaseUrl = 'ws://localhost:8080'; // fallback padrão
                try {
                    const config = await window.api.config.getGuacamole();
                    if (config && config.wsUrl) {
                        wsBaseUrl = config.wsUrl;
                        console.log('📡 Usando servidor Guacamole configurado:', wsBaseUrl);
                    }
                } catch (configError) {
                    console.warn('⚠️ Erro ao obter config, usando localhost:', configError);
                }

                console.log('🔑 Gerando token...');
                const token = await window.api.guacamole.generateToken(connectionInfo);

                if (isCancelled) return;

                console.log('✅ Token OK, criando cliente...');

                const wsUrl = `${wsBaseUrl}/?token=${encodeURIComponent(token)}`;
                const tunnel = new Guacamole.WebSocketTunnel(wsUrl);
                const client = new Guacamole.Client(tunnel);
                clientRef.current = client;

                // Notifica componente pai que o cliente está pronto
                if (onClientReady) {
                    onClientReady(clientRef);
                }

                client.onstatechange = (state) => {
                    if (isCancelled) return;
                    const states = ['idle', 'connecting', 'waiting', 'connected', 'disconnecting', 'disconnected'];
                    const newStatus = states[state] || 'unknown';
                    console.log('📡 Estado:', newStatus);
                    setStatus(newStatus);

                    // Notifica componente pai sobre mudança de status
                    if (onStatusChange) {
                        onStatusChange(newStatus);
                    }
                };

                client.onerror = (statusObj) => {
                    if (isCancelled) return;
                    console.error('❌ Erro:', statusObj);
                    setError(statusObj.message || 'Erro');
                    setStatus('error');
                };

                client.connect();
                console.log('✅ Conectado!');

                // Aguarda um instante e adiciona display
                setTimeout(() => {
                    if (isCancelled) return;

                    const container = displayRef.current;
                    console.log('🖥️ Container:', container);

                    if (container) {
                        const display = client.getDisplay();
                        const displayElement = display.getElement();
                        container.innerHTML = '';
                        container.appendChild(displayElement);
                        console.log('✅ Display adicionado!');

                        // Armazena a escala atual para ajustar coordenadas do mouse
                        let currentScale = 1;

                        // Função para calcular e aplicar escala
                        const updateScale = () => {
                            const containerWidth = container.clientWidth;
                            const containerHeight = container.clientHeight;
                            const displayWidth = display.getWidth();
                            const displayHeight = display.getHeight();

                            if (displayWidth > 0 && displayHeight > 0) {
                                currentScale = Math.min(
                                    containerWidth / displayWidth,
                                    containerHeight / displayHeight
                                );
                                display.scale(currentScale);
                                console.log(`📐 Scale: ${currentScale.toFixed(2)} (${displayWidth}x${displayHeight} -> ${containerWidth}x${containerHeight})`);
                            }
                        };

                        // Função para enviar novo tamanho ao servidor (resize dinâmico)
                        const sendSizeToServer = () => {
                            const containerWidth = container.clientWidth;
                            const containerHeight = container.clientHeight;

                            if (containerWidth > 0 && containerHeight > 0 && clientRef.current) {
                                // Envia o tamanho do container ao servidor
                                // Isso permite que o RDP 8.1+ ajuste a resolução dinamicamente
                                client.sendSize(containerWidth, containerHeight);
                                console.log(`📐 sendSize: ${containerWidth}x${containerHeight}`);
                            }
                        };

                        // Verifica tamanho inicial
                        const checkSize = () => {
                            if (display.getWidth() > 0 && display.getHeight() > 0) {
                                updateScale();
                            } else {
                                setTimeout(checkSize, 100);
                            }
                        };
                        checkSize();

                        // Atualiza escala quando display mudar de tamanho
                        display.onresize = updateScale;

                        // Atualiza escala e envia tamanho ao servidor quando janela mudar
                        let resizeTimeout = null;
                        const handleResize = () => {
                            updateScale();

                            // Debounce para não enviar muitos resize requests
                            clearTimeout(resizeTimeout);
                            resizeTimeout = setTimeout(() => {
                                sendSizeToServer();
                            }, 300);
                        };
                        window.addEventListener('resize', handleResize);

                        // Envia tamanho inicial ao servidor após conexão estável
                        setTimeout(() => sendSizeToServer(), 500);

                        // Mouse - armazena referência para cleanup
                        // CORREÇÃO v2: Ajusta coordenadas considerando escala E offset do displayElement
                        const mouse = new Guacamole.Mouse(displayElement);
                        mouseRef.current = mouse;

                        const sendMouseState = (mouseState) => {
                            if (clientRef.current && currentScale > 0) {
                                // O Guacamole.Mouse já retorna coordenadas relativas ao displayElement
                                // Precisamos apenas dividir pela escala para obter coordenadas do servidor
                                const adjustedX = mouseState.x / currentScale;
                                const adjustedY = mouseState.y / currentScale;

                                const adjustedState = new Guacamole.Mouse.State(
                                    adjustedX,
                                    adjustedY,
                                    mouseState.left,
                                    mouseState.middle,
                                    mouseState.right,
                                    mouseState.up,
                                    mouseState.down
                                );
                                client.sendMouseState(adjustedState);
                            }
                        };

                        mouse.onmousedown = sendMouseState;
                        mouse.onmouseup = sendMouseState;
                        mouse.onmousemove = sendMouseState;

                        // Teclado - armazena referência para cleanup
                        const keyboard = new Guacamole.Keyboard(document);
                        keyboardRef.current = keyboard;
                        keyboard.onkeydown = (k) => {
                            if (clientRef.current) {
                                client.sendKeyEvent(1, k);
                            }
                        };
                        keyboard.onkeyup = (k) => {
                            if (clientRef.current) {
                                client.sendKeyEvent(0, k);
                            }
                        };

                        // Armazena cleanup do resize listener
                        resizeCleanupRef.current = () => {
                            window.removeEventListener('resize', handleResize);
                        };

                        console.log('✅ Mouse (com correção de escala) e teclado configurados');
                    } else {
                        console.warn('⚠️ Container ainda é null!');
                    }
                }, 300);

            } catch (err) {
                if (isCancelled) return;
                console.error('❌ Erro:', err);
                setError(err.message);
                setStatus('error');
            }
        };

        doConnect();

        // Cleanup quando o componente desmonta
        return () => {
            isCancelled = true;
            console.log('🧹 Cleanup do RemoteDesktopViewer...');
            // Limpa resize listener
            if (resizeCleanupRef.current) {
                resizeCleanupRef.current();
                resizeCleanupRef.current = null;
            }
            cleanupInputHandlers();
            if (clientRef.current) {
                clientRef.current.disconnect();
                clientRef.current = null;
            }
        };
    }, [connectionInfo]); // eslint-disable-line react-hooks/exhaustive-deps
    // ✅ Dependência apenas em connectionInfo para evitar reconexões desnecessárias
    // onClientReady, onStatusChange são acessados via closure

    const handleDisconnect = () => {
        console.log('🔌 Desconectando...');
        // Limpa input handlers ANTES de desconectar
        cleanupInputHandlers();
        if (clientRef.current) {
            clientRef.current.disconnect();
            clientRef.current = null;
        }
        setStatus('disconnected');
        if (onDisconnect) onDisconnect();
    };

    return (
        <div className={`remote-desktop-viewer ${fullscreen ? 'fullscreen' : ''}`}>
            {/* Header só aparece quando NÃO está em fullscreen (toolbar vem do ConnectionViewerModal) */}
            {!fullscreen && (
                <div className="viewer-header">
                    <div className="viewer-info">
                        <span className="viewer-name">{connectionInfo?.name || 'Conexão'}</span>
                        <span className={`viewer-status status-${status}`}>
                            {status === 'connected' && '🟢 Conectado'}
                            {status === 'connecting' && '🟡 Conectando...'}
                            {status === 'waiting' && '🟡 Aguardando...'}
                            {status === 'disconnected' && '⚫ Desconectado'}
                            {status === 'error' && '🔴 Erro'}
                        </span>
                    </div>
                    <button className="btn-disconnect" onClick={handleDisconnect}>✕</button>
                </div>
            )}

            <div ref={displayRef} className="viewer-display" tabIndex={0} />

            {(status === 'connecting' || status === 'waiting') && (
                <div className="viewer-overlay">
                    <div className="loader"></div>
                    <p>Conectando...</p>
                </div>
            )}

            {error && (
                <div className="viewer-overlay error">
                    <p>❌ {error}</p>
                    <button onClick={() => window.location.reload()}>Recarregar</button>
                </div>
            )}
        </div>
    );
}

export default RemoteDesktopViewer;
