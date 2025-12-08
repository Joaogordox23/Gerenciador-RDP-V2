/**
 * GuacamoleToolbar.js
 * Barra de ferramentas para RDP/SSH Viewer via Guacamole
 * Com controles de clipboard, escala e atalhos de teclado
 */

import React, { useState, useEffect, useCallback } from 'react';
import './GuacamoleToolbar.css';

function GuacamoleToolbar({
    clientRef,
    connectionName,
    connectionAddress,
    protocol,
    status,
    autoScale,
    setAutoScale,
    onClose,
    onFullscreen
}) {
    const [clipboardText, setClipboardText] = useState('');
    const [showClipboardPopup, setShowClipboardPopup] = useState(false);
    const [remoteClipboard, setRemoteClipboard] = useState('');

    // Escuta eventos de clipboard do servidor remoto
    useEffect(() => {
        const client = clientRef?.current;
        if (!client) return;

        // Handler para receber clipboard do servidor
        client.onclipboard = (stream, mimetype) => {
            if (mimetype === 'text/plain') {
                let data = '';
                stream.onblob = (base64Data) => {
                    // Decodifica Base64 para texto
                    try {
                        data += atob(base64Data);
                    } catch (e) {
                        console.warn('Erro ao decodificar clipboard:', e);
                    }
                };
                stream.onend = () => {
                    console.log('📋 Clipboard recebido do servidor:', data.substring(0, 50) + '...');
                    setRemoteClipboard(data);
                    // Tenta copiar automaticamente para o clipboard local
                    navigator.clipboard.writeText(data).then(() => {
                        console.log('✅ Copiado para clipboard local');
                    }).catch(err => {
                        console.warn('⚠️ Não foi possível copiar automaticamente:', err);
                    });
                };
            }
        };

        return () => {
            if (client) {
                client.onclipboard = null;
            }
        };
    }, [clientRef]);

    // Cola texto no servidor remoto
    const handlePaste = useCallback(async () => {
        const client = clientRef?.current;
        if (!client) return;

        try {
            // Tenta ler do clipboard local
            const text = await navigator.clipboard.readText();
            if (text) {
                // Cria stream de clipboard
                const stream = client.createClipboardStream('text/plain');
                // Codifica para Base64 e envia
                const base64 = btoa(unescape(encodeURIComponent(text)));
                stream.sendBlob(base64);
                stream.sendEnd();
                console.log('📋 Colado no servidor:', text.substring(0, 50) + '...');
            }
        } catch (err) {
            console.warn('⚠️ Não foi possível ler clipboard:', err);
            // Fallback: mostra popup para colar manualmente
            setShowClipboardPopup(true);
        }
    }, [clientRef]);

    // Cola texto manual do popup
    const handleManualPaste = () => {
        const client = clientRef?.current;
        if (!client || !clipboardText) return;

        const stream = client.createClipboardStream('text/plain');
        const base64 = btoa(unescape(encodeURIComponent(clipboardText)));
        stream.sendBlob(base64);
        stream.sendEnd();
        console.log('📋 Colado manualmente:', clipboardText.substring(0, 50) + '...');
        setClipboardText('');
        setShowClipboardPopup(false);
    };

    // Copia do servidor (mostra o que foi recebido)
    const handleCopy = useCallback(() => {
        if (remoteClipboard) {
            navigator.clipboard.writeText(remoteClipboard).then(() => {
                console.log('✅ Copiado para clipboard local');
            });
        }
    }, [remoteClipboard]);

    // Envia Ctrl+Alt+Del
    const sendCtrlAltDel = useCallback(() => {
        const client = clientRef?.current;
        if (!client) return;

        // Keysyms para Ctrl, Alt, Del
        const CTRL = 0xFFE3;
        const ALT = 0xFFE9;
        const DEL = 0xFFFF;

        // Pressiona as teclas
        client.sendKeyEvent(1, CTRL);
        client.sendKeyEvent(1, ALT);
        client.sendKeyEvent(1, DEL);

        // Solta as teclas (em ordem inversa)
        client.sendKeyEvent(0, DEL);
        client.sendKeyEvent(0, ALT);
        client.sendKeyEvent(0, CTRL);

        console.log('⌨️ Ctrl+Alt+Del enviado');
    }, [clientRef]);

    // Toggle escala automática
    const toggleScale = () => {
        setAutoScale(!autoScale);
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'connected': return '🟢';
            case 'connecting':
            case 'waiting': return '🟡';
            case 'error': return '🔴';
            default: return '⚫';
        }
    };

    const getProtocolIcon = () => {
        switch (protocol) {
            case 'rdp': return '🖥️';
            case 'ssh': return '💻';
            default: return '🔗';
        }
    };

    return (
        <div className="guacamole-toolbar">
            {/* Info */}
            <div className="guacamole-toolbar-info">
                <span className="guacamole-toolbar-icon">{getProtocolIcon()}</span>
                <span className="guacamole-toolbar-name">{connectionName}</span>
                <span className="guacamole-toolbar-address">{connectionAddress}</span>
                <span className="guacamole-toolbar-status">{getStatusIcon()}</span>
            </div>

            {/* Controles */}
            <div className="guacamole-toolbar-controls">
                {/* Clipboard */}
                <div className="guacamole-toolbar-group">
                    <button
                        className="guacamole-toolbar-btn"
                        onClick={handlePaste}
                        title="Colar do clipboard local"
                        disabled={status !== 'connected'}
                    >
                        📋 Colar
                    </button>
                    {remoteClipboard && (
                        <button
                            className="guacamole-toolbar-btn"
                            onClick={handleCopy}
                            title="Copiar do servidor remoto"
                        >
                            📄 Copiar
                        </button>
                    )}
                </div>

                {/* Escala */}
                <button
                    className={`guacamole-toolbar-btn ${autoScale ? 'active' : ''}`}
                    onClick={toggleScale}
                    title={autoScale ? 'Desativar escala automática' : 'Ativar escala automática'}
                >
                    🔍 {autoScale ? 'Fit: On' : 'Fit: Off'}
                </button>

                {/* Ctrl+Alt+Del (apenas RDP) */}
                {protocol === 'rdp' && (
                    <button
                        className="guacamole-toolbar-btn"
                        onClick={sendCtrlAltDel}
                        title="Enviar Ctrl+Alt+Del"
                        disabled={status !== 'connected'}
                    >
                        ⌨️ Ctrl+Alt+Del
                    </button>
                )}

                {/* Fullscreen */}
                <button
                    className="guacamole-toolbar-btn"
                    onClick={onFullscreen}
                    title="Tela cheia"
                >
                    ⛶
                </button>

                {/* Fechar */}
                <button
                    className="guacamole-toolbar-btn close"
                    onClick={onClose}
                    title="Fechar (ESC)"
                >
                    ✕
                </button>
            </div>

            {/* Popup de Clipboard Manual */}
            {showClipboardPopup && (
                <div className="guacamole-clipboard-popup">
                    <div className="guacamole-clipboard-popup-content">
                        <h4>Colar Texto</h4>
                        <textarea
                            value={clipboardText}
                            onChange={(e) => setClipboardText(e.target.value)}
                            placeholder="Cole ou digite o texto aqui..."
                            rows={4}
                        />
                        <div className="guacamole-clipboard-popup-actions">
                            <button onClick={handleManualPaste}>Enviar</button>
                            <button onClick={() => setShowClipboardPopup(false)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GuacamoleToolbar;
