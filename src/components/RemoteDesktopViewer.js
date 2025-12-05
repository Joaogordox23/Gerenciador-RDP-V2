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
    fullscreen = false
}) {
    const displayRef = useRef(null);
    const clientRef = useRef(null);
    const mouseRef = useRef(null);
    const keyboardRef = useRef(null);
    const [status, setStatus] = useState('disconnected');
    const [error, setError] = useState(null);

    const GUACAMOLE_WS_URL = 'ws://localhost:8080';

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

            try {
                console.log('🔑 Gerando token...');
                const token = await window.api.guacamole.generateToken(connectionInfo);

                if (isCancelled) return;

                console.log('✅ Token OK, criando cliente...');

                const wsUrl = `${GUACAMOLE_WS_URL}/?token=${encodeURIComponent(token)}`;
                const tunnel = new Guacamole.WebSocketTunnel(wsUrl);
                const client = new Guacamole.Client(tunnel);
                clientRef.current = client;

                client.onstatechange = (state) => {
                    if (isCancelled) return;
                    const states = ['idle', 'connecting', 'waiting', 'connected', 'disconnecting', 'disconnected'];
                    console.log('📡 Estado:', states[state]);
                    setStatus(states[state] || 'unknown');
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

                        // Atualiza escala quando janela mudar de tamanho
                        const handleResize = () => updateScale();
                        window.addEventListener('resize', handleResize);

                        // Mouse - armazena referência para cleanup
                        // CORREÇÃO: Ajusta coordenadas do mouse pela escala inversa
                        const mouse = new Guacamole.Mouse(displayElement);
                        mouseRef.current = mouse;

                        const sendMouseState = (mouseState) => {
                            if (clientRef.current && currentScale > 0) {
                                // Cria novo estado com coordenadas ajustadas pela escala
                                const adjustedState = new Guacamole.Mouse.State(
                                    mouseState.x / currentScale,
                                    mouseState.y / currentScale,
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

                        // Cleanup do resize listener
                        const originalCleanup = cleanupInputHandlers;
                        cleanupInputHandlers = () => {
                            window.removeEventListener('resize', handleResize);
                            originalCleanup();
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
            cleanupInputHandlers();
            if (clientRef.current) {
                clientRef.current.disconnect();
                clientRef.current = null;
            }
        };
    }, [connectionInfo]);

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
