/**
 * GuacamoleToolbar.js - v2.0
 * Barra de ferramentas premium para RDP/SSH Viewer via Guacamole
 * Com ícones MUI, controles de qualidade, clipboard e atalhos de teclado
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    ContentCopyIcon,
    ContentPasteIcon,
    AspectRatioIcon,
    KeyboardIcon,
    FullscreenIcon,
    CloseIcon,
    SettingsIcon,
    PhotoCameraIcon,
    SignalWifiIcon,
    ComputerIcon,
    TerminalIcon,
    RefreshIcon
} from './MuiIcons';
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
    onFullscreen,
    onReconnect
}) {
    const [clipboardText, setClipboardText] = useState('');
    const [showClipboardPopup, setShowClipboardPopup] = useState(false);
    const [remoteClipboard, setRemoteClipboard] = useState('');
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [colorDepth, setColorDepth] = useState(16);

    // Escuta eventos de clipboard do servidor remoto
    useEffect(() => {
        const client = clientRef?.current;
        if (!client) return;

        client.onclipboard = (stream, mimetype) => {
            if (mimetype === 'text/plain') {
                let data = '';
                stream.onblob = (base64Data) => {
                    try {
                        data += atob(base64Data);
                    } catch (e) {
                        console.warn('Erro ao decodificar clipboard:', e);
                    }
                };
                stream.onend = () => {
                    console.log('📋 Clipboard recebido do servidor');
                    setRemoteClipboard(data);
                    navigator.clipboard.writeText(data).catch(() => { });
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
            const text = await navigator.clipboard.readText();
            if (text) {
                const stream = client.createClipboardStream('text/plain');
                const base64 = btoa(unescape(encodeURIComponent(text)));
                stream.sendBlob(base64);
                stream.sendEnd();
                console.log('📋 Colado no servidor');
            }
        } catch (err) {
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
        setClipboardText('');
        setShowClipboardPopup(false);
    };

    // Copia do servidor
    const handleCopy = useCallback(() => {
        if (remoteClipboard) {
            navigator.clipboard.writeText(remoteClipboard);
        }
    }, [remoteClipboard]);

    // Envia Ctrl+Alt+Del
    const sendCtrlAltDel = useCallback(() => {
        const client = clientRef?.current;
        if (!client) return;

        const CTRL = 0xFFE3;
        const ALT = 0xFFE9;
        const DEL = 0xFFFF;

        client.sendKeyEvent(1, CTRL);
        client.sendKeyEvent(1, ALT);
        client.sendKeyEvent(1, DEL);
        client.sendKeyEvent(0, DEL);
        client.sendKeyEvent(0, ALT);
        client.sendKeyEvent(0, CTRL);

        console.log('⌨️ Ctrl+Alt+Del enviado');
    }, [clientRef]);

    // Screenshot
    const takeScreenshot = useCallback(() => {
        const client = clientRef?.current;
        if (!client) return;

        try {
            const display = client.getDisplay();
            const canvas = display.getDefaultLayer().getCanvas();

            const link = document.createElement('a');
            link.download = `${protocol}-screenshot-${connectionName}-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            console.log('📸 Screenshot capturado');
        } catch (err) {
            console.error('Erro ao capturar screenshot:', err);
        }
    }, [clientRef, connectionName, protocol]);

    // Toggle escala automática
    const toggleScale = () => {
        setAutoScale(!autoScale);
    };

    const getStatusConfig = () => {
        switch (status) {
            case 'connected':
                return { color: 'connected', label: 'Conectado' };
            case 'connecting':
            case 'waiting':
                return { color: 'connecting', label: 'Conectando...' };
            case 'error':
                return { color: 'error', label: 'Erro' };
            default:
                return { color: 'disconnected', label: 'Desconectado' };
        }
    };

    const statusConfig = getStatusConfig();

    const qualityOptions = [
        { depth: 8, label: 'Baixa (8-bit)', icon: '🔴' },
        { depth: 16, label: 'Média (16-bit)', icon: '🟡' },
        { depth: 24, label: 'Alta (24-bit)', icon: '🟢' },
        { depth: 32, label: 'Máxima (32-bit)', icon: '🔵' }
    ];

    const currentQuality = qualityOptions.find(q => q.depth === colorDepth) || qualityOptions[1];

    return (
        <div className="guacamole-toolbar">
            {/* Status e Nome */}
            <div className="guacamole-toolbar-info">
                <div className={`guacamole-status-indicator ${statusConfig.color}`}>
                    {protocol === 'rdp' ? (
                        <ComputerIcon sx={{ fontSize: 14 }} />
                    ) : (
                        <TerminalIcon sx={{ fontSize: 14 }} />
                    )}
                </div>
                <span className="guacamole-toolbar-name" title={connectionName}>
                    {connectionName}
                </span>
                <span className="guacamole-toolbar-address">
                    {connectionAddress}
                </span>
                <div className={`guacamole-connection-badge ${statusConfig.color}`}>
                    <SignalWifiIcon sx={{ fontSize: 12 }} />
                    <span>{statusConfig.label}</span>
                </div>
            </div>

            {/* Controles Principais */}
            <div className="guacamole-toolbar-controls">
                {/* Grupo: Clipboard */}
                <div className="guacamole-toolbar-group">
                    <button
                        className="guacamole-toolbar-btn"
                        onClick={handlePaste}
                        title="Colar texto (Ctrl+V)"
                        disabled={status !== 'connected'}
                    >
                        <ContentPasteIcon sx={{ fontSize: 18 }} />
                    </button>
                    {remoteClipboard && (
                        <button
                            className="guacamole-toolbar-btn has-content"
                            onClick={handleCopy}
                            title="Copiar do servidor"
                        >
                            <ContentCopyIcon sx={{ fontSize: 18 }} />
                        </button>
                    )}
                </div>

                <div className="guacamole-toolbar-separator" />

                {/* Grupo: Visualização */}
                <div className="guacamole-toolbar-group">
                    <button
                        className={`guacamole-toolbar-btn ${autoScale ? 'active' : ''}`}
                        onClick={toggleScale}
                        title={autoScale ? 'Escala automática: ON' : 'Escala automática: OFF'}
                    >
                        <AspectRatioIcon sx={{ fontSize: 18 }} />
                    </button>

                    {/* Qualidade (apenas RDP) */}
                    {protocol === 'rdp' && (
                        <div className="guacamole-toolbar-dropdown">
                            <button
                                className="guacamole-toolbar-btn"
                                onClick={() => setShowQualityMenu(!showQualityMenu)}
                                title="Qualidade de cores"
                            >
                                <SettingsIcon sx={{ fontSize: 18 }} />
                                <span className="guacamole-quality-badge">{currentQuality.icon}</span>
                            </button>
                            {showQualityMenu && (
                                <div className="guacamole-toolbar-menu">
                                    <div className="guacamole-menu-title">Profundidade de Cor</div>
                                    {qualityOptions.map(({ depth, label, icon }) => (
                                        <button
                                            key={depth}
                                            className={`guacamole-toolbar-menu-item ${depth === colorDepth ? 'active' : ''}`}
                                            onClick={() => {
                                                setColorDepth(depth);
                                                setShowQualityMenu(false);
                                            }}
                                        >
                                            <span className="menu-icon">{icon}</span>
                                            <span>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="guacamole-toolbar-separator" />

                {/* Grupo: Ações */}
                <div className="guacamole-toolbar-group">
                    {/* Ctrl+Alt+Del (apenas RDP) */}
                    {protocol === 'rdp' && (
                        <button
                            className="guacamole-toolbar-btn"
                            onClick={sendCtrlAltDel}
                            title="Enviar Ctrl+Alt+Del"
                            disabled={status !== 'connected'}
                        >
                            <KeyboardIcon sx={{ fontSize: 18 }} />
                        </button>
                    )}

                    <button
                        className="guacamole-toolbar-btn"
                        onClick={takeScreenshot}
                        title="Capturar tela (Screenshot)"
                        disabled={status !== 'connected'}
                    >
                        <PhotoCameraIcon sx={{ fontSize: 18 }} />
                    </button>

                    {onReconnect && (
                        <button
                            className="guacamole-toolbar-btn"
                            onClick={onReconnect}
                            title="Reconectar"
                        >
                            <RefreshIcon sx={{ fontSize: 18 }} />
                        </button>
                    )}
                </div>

                <div className="guacamole-toolbar-separator" />

                {/* Grupo: Janela */}
                <div className="guacamole-toolbar-group">
                    <button
                        className="guacamole-toolbar-btn"
                        onClick={onFullscreen}
                        title="Tela cheia (F11)"
                    >
                        <FullscreenIcon sx={{ fontSize: 18 }} />
                    </button>

                    <button
                        className="guacamole-toolbar-btn close"
                        onClick={onClose}
                        title="Fechar conexão (ESC)"
                    >
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </button>
                </div>
            </div>

            {/* Popup de Clipboard Manual */}
            {showClipboardPopup && (
                <div className="guacamole-clipboard-popup" onClick={() => setShowClipboardPopup(false)}>
                    <div className="guacamole-clipboard-popup-content" onClick={(e) => e.stopPropagation()}>
                        <h4>📋 Colar Texto</h4>
                        <p className="guacamole-clipboard-hint">
                            Cole o texto abaixo para enviar ao computador remoto
                        </p>
                        <textarea
                            value={clipboardText}
                            onChange={(e) => setClipboardText(e.target.value)}
                            placeholder="Cole ou digite o texto aqui..."
                            rows={4}
                            autoFocus
                        />
                        <div className="guacamole-clipboard-popup-actions">
                            <button className="btn-primary" onClick={handleManualPaste}>
                                Enviar
                            </button>
                            <button className="btn-secondary" onClick={() => setShowClipboardPopup(false)}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GuacamoleToolbar;
