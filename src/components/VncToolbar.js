/**
 * VncToolbar.js
 * Barra de ferramentas premium para o VNC Viewer
 * v2.0: Ícones, tooltips, separadores, indicador de status, auto-hide
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    ContentCopyIcon,
    ContentPasteIcon,
    AspectRatioIcon,
    VisibilityIcon,
    VisibilityOffIcon,
    KeyboardIcon,
    FullscreenIcon,
    CloseIcon,
    SettingsIcon,
    RefreshIcon,
    PhotoCameraIcon,
    SignalWifiIcon,
    MouseIcon
} from './MuiIcons';
import './VncToolbar.css';

function VncToolbar({
    rfbRef,
    connectionName,
    viewOnly,
    setViewOnly,
    scaleViewport,
    setScaleViewport,
    qualityLevel,
    setQualityLevel,
    onClose,
    onFullscreen,
    onReconnect
}) {
    const [clipboardText, setClipboardText] = useState('');
    const [showClipboardPopup, setShowClipboardPopup] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [remoteClipboard, setRemoteClipboard] = useState('');
    const [isAutoHide, setIsAutoHide] = useState(false);
    const [isHovered, setIsHovered] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('connected'); // 'connected', 'connecting', 'error'

    // Auto-hide timer
    useEffect(() => {
        if (!isAutoHide || isHovered) return;

        const timer = setTimeout(() => {
            setIsHovered(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, [isAutoHide, isHovered]);

    // Escuta eventos de clipboard do servidor remoto
    useEffect(() => {
        const rfb = rfbRef?.current;
        if (!rfb) return;

        const handleClipboard = (e) => {
            const text = e.detail.text;
            console.log('📋 Clipboard recebido do servidor');
            setRemoteClipboard(text);
            navigator.clipboard.writeText(text).catch(() => { });
        };

        rfb.addEventListener('clipboard', handleClipboard);
        return () => rfb.removeEventListener('clipboard', handleClipboard);
    }, [rfbRef]);

    // Cola texto no servidor remoto
    const handlePaste = useCallback(async () => {
        const rfb = rfbRef?.current;
        if (!rfb) return;

        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                rfb.clipboardPasteFrom(text);
            }
        } catch (err) {
            setShowClipboardPopup(true);
        }
    }, [rfbRef]);

    // Cola texto manual do popup
    const handleManualPaste = () => {
        const rfb = rfbRef?.current;
        if (!rfb || !clipboardText) return;

        rfb.clipboardPasteFrom(clipboardText);
        setClipboardText('');
        setShowClipboardPopup(false);
    };

    // Copia do servidor
    const handleCopy = useCallback(() => {
        if (remoteClipboard) {
            navigator.clipboard.writeText(remoteClipboard);
        }
    }, [remoteClipboard]);

    // Toggle escala
    const toggleScale = () => {
        const newValue = !scaleViewport;
        setScaleViewport(newValue);
        if (rfbRef?.current) {
            rfbRef.current.scaleViewport = newValue;
        }
    };

    // Muda qualidade
    const changeQuality = (level) => {
        setQualityLevel(level);
        if (rfbRef?.current) {
            rfbRef.current.qualityLevel = level;
        }
        setShowQualityMenu(false);
    };

    // Toggle view only
    const toggleViewOnly = () => {
        const newValue = !viewOnly;
        setViewOnly(newValue);
        if (rfbRef?.current) {
            rfbRef.current.viewOnly = newValue;
        }
    };

    // Envia Ctrl+Alt+Del
    const sendCtrlAltDel = () => {
        if (rfbRef?.current) {
            rfbRef.current.sendCtrlAltDel();
        }
    };

    // Screenshot
    const takeScreenshot = () => {
        const rfb = rfbRef?.current;
        if (!rfb) return;

        try {
            const canvas = rfb._canvas;
            if (canvas) {
                const link = document.createElement('a');
                link.download = `vnc-screenshot-${connectionName}-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        } catch (err) {
            console.error('Erro ao capturar screenshot:', err);
        }
    };

    const qualityOptions = [
        { level: 0, label: 'Mínima', icon: '🔴' },
        { level: 2, label: 'Baixa', icon: '🟠' },
        { level: 4, label: 'Média', icon: '🟡' },
        { level: 6, label: 'Alta', icon: '🟢' },
        { level: 9, label: 'Máxima', icon: '🔵' }
    ];

    const currentQuality = qualityOptions.find(q => q.level === qualityLevel) || qualityOptions[3];

    return (
        <div
            className={`vnc-toolbar ${isAutoHide && !isHovered ? 'hidden' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => isAutoHide && setIsHovered(false)}
        >
            {/* Status e Nome */}
            <div className="vnc-toolbar-info">
                <div className={`vnc-status-indicator ${connectionStatus}`}>
                    <SignalWifiIcon sx={{ fontSize: 14 }} />
                </div>
                <span className="vnc-toolbar-name" title={connectionName}>
                    {connectionName}
                </span>
            </div>

            {/* Controles Principais */}
            <div className="vnc-toolbar-controls">
                {/* Grupo: Clipboard */}
                <div className="vnc-toolbar-group">
                    <button
                        className="vnc-toolbar-btn"
                        onClick={handlePaste}
                        title="Colar texto (Ctrl+V)"
                    >
                        <ContentPasteIcon sx={{ fontSize: 18 }} />
                    </button>
                    {remoteClipboard && (
                        <button
                            className="vnc-toolbar-btn has-content"
                            onClick={handleCopy}
                            title="Copiar do servidor"
                        >
                            <ContentCopyIcon sx={{ fontSize: 18 }} />
                        </button>
                    )}
                </div>

                <div className="vnc-toolbar-separator" />

                {/* Grupo: Visualização */}
                <div className="vnc-toolbar-group">
                    <button
                        className={`vnc-toolbar-btn ${scaleViewport ? 'active' : ''}`}
                        onClick={toggleScale}
                        title={scaleViewport ? 'Escala automática: ON' : 'Escala automática: OFF'}
                    >
                        <AspectRatioIcon sx={{ fontSize: 18 }} />
                    </button>

                    <button
                        className={`vnc-toolbar-btn ${viewOnly ? 'active' : ''}`}
                        onClick={toggleViewOnly}
                        title={viewOnly ? 'Modo visualização (clique para controlar)' : 'Modo controle (clique para apenas visualizar)'}
                    >
                        {viewOnly ? (
                            <VisibilityIcon sx={{ fontSize: 18 }} />
                        ) : (
                            <MouseIcon sx={{ fontSize: 18 }} />
                        )}
                    </button>
                </div>

                <div className="vnc-toolbar-separator" />

                {/* Grupo: Qualidade */}
                <div className="vnc-toolbar-dropdown">
                    <button
                        className="vnc-toolbar-btn"
                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                        title="Ajustar qualidade de imagem"
                    >
                        <SettingsIcon sx={{ fontSize: 18 }} />
                        <span className="vnc-quality-badge">{currentQuality.icon}</span>
                    </button>
                    {showQualityMenu && (
                        <div className="vnc-toolbar-menu quality-menu">
                            <div className="vnc-menu-title">Qualidade</div>
                            {qualityOptions.map(({ level, label, icon }) => (
                                <button
                                    key={level}
                                    className={`vnc-toolbar-menu-item ${level === qualityLevel ? 'active' : ''}`}
                                    onClick={() => changeQuality(level)}
                                >
                                    <span className="menu-icon">{icon}</span>
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="vnc-toolbar-separator" />

                {/* Grupo: Ações */}
                <div className="vnc-toolbar-group">
                    <button
                        className="vnc-toolbar-btn"
                        onClick={sendCtrlAltDel}
                        title="Enviar Ctrl+Alt+Del"
                        disabled={viewOnly}
                    >
                        <KeyboardIcon sx={{ fontSize: 18 }} />
                    </button>

                    <button
                        className="vnc-toolbar-btn"
                        onClick={takeScreenshot}
                        title="Capturar tela (Screenshot)"
                    >
                        <PhotoCameraIcon sx={{ fontSize: 18 }} />
                    </button>

                    {onReconnect && (
                        <button
                            className="vnc-toolbar-btn"
                            onClick={onReconnect}
                            title="Reconectar"
                        >
                            <RefreshIcon sx={{ fontSize: 18 }} />
                        </button>
                    )}
                </div>

                <div className="vnc-toolbar-separator" />

                {/* Grupo: Janela */}
                <div className="vnc-toolbar-group">
                    <button
                        className="vnc-toolbar-btn"
                        onClick={onFullscreen}
                        title="Tela cheia (F11)"
                    >
                        <FullscreenIcon sx={{ fontSize: 18 }} />
                    </button>

                    <button
                        className="vnc-toolbar-btn close"
                        onClick={onClose}
                        title="Fechar conexão (ESC)"
                    >
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </button>
                </div>
            </div>

            {/* Popup de Clipboard Manual */}
            {showClipboardPopup && (
                <div className="vnc-clipboard-popup" onClick={() => setShowClipboardPopup(false)}>
                    <div className="vnc-clipboard-popup-content" onClick={(e) => e.stopPropagation()}>
                        <h4>📋 Colar Texto</h4>
                        <p className="vnc-clipboard-hint">
                            Cole o texto abaixo para enviar ao computador remoto
                        </p>
                        <textarea
                            value={clipboardText}
                            onChange={(e) => setClipboardText(e.target.value)}
                            placeholder="Cole ou digite o texto aqui..."
                            rows={4}
                            autoFocus
                        />
                        <div className="vnc-clipboard-popup-actions">
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

export default VncToolbar;
