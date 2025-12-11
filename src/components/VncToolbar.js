/**
 * VncToolbar.js
 * Barra de ferramentas premium para o VNC Viewer
 * v2.1: Ícones, tooltips, separadores, indicador de status, auto-hide
 * v2.2: Menu de teclas especiais (Ctrl+Alt+Del, Win+R, etc.)
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

// X11 Keysyms para teclas especiais
const XK = {
    Control_L: 0xFFE3,
    Alt_L: 0xFFE9,
    Shift_L: 0xFFE1,
    Delete: 0xFFFF,
    Escape: 0xFF1B,
    Super_L: 0xFFEB, // Tecla Windows
    Tab: 0xFF09,
    F4: 0xFFC1,
    r: 0x0072,
    e: 0x0065,
    d: 0x0064
};

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
    const [showSpecialKeysMenu, setShowSpecialKeysMenu] = useState(false);

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
            setShowSpecialKeysMenu(false);
        }
    };

    // Função genérica para enviar sequência de teclas
    const sendSpecialKeys = useCallback((keysyms, label) => {
        if (!rfbRef?.current || viewOnly) return;

        try {
            const rfb = rfbRef.current;

            // Pressiona todas as teclas em sequência
            keysyms.forEach(keysym => {
                rfb.sendKey(keysym, null, true);
            });

            // Pequeno delay antes de soltar as teclas (50ms)
            setTimeout(() => {
                // Solta todas as teclas (ordem inversa)
                [...keysyms].reverse().forEach(keysym => {
                    rfb.sendKey(keysym, null, false);
                });
            }, 50);

            console.log(`⌨️ Teclas enviadas: ${label}`);
        } catch (err) {
            console.error('Erro ao enviar teclas:', err);
        }

        setShowSpecialKeysMenu(false);
    }, [rfbRef, viewOnly]);

    // Lista de combinações de teclas especiais
    const specialKeyCombos = [
        { label: 'Ctrl+Alt+Del', keys: null, action: sendCtrlAltDel, icon: '🔐' },
        { label: 'Ctrl+Shift+Esc', keys: [XK.Control_L, XK.Shift_L, XK.Escape], icon: '📊', desc: 'Gerenciador de Tarefas' },
        { label: 'Win+R', keys: [XK.Super_L, XK.r], icon: '▶️', desc: 'Executar' },
        { label: 'Win+E', keys: [XK.Super_L, XK.e], icon: '📁', desc: 'Explorador' },
        { label: 'Win+D', keys: [XK.Super_L, XK.d], icon: '🖥️', desc: 'Área de Trabalho' },
        { label: 'Alt+Tab', keys: [XK.Alt_L, XK.Tab], icon: '🔄', desc: 'Alternar Janela' },
        { label: 'Alt+F4', keys: [XK.Alt_L, XK.F4], icon: '❌', desc: 'Fechar Janela' },
        { label: 'Ctrl+Esc', keys: [XK.Control_L, XK.Escape], icon: '🪟', desc: 'Menu Iniciar' }
    ];

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
                    {/* Menu de Teclas Especiais */}
                    <div className="vnc-toolbar-dropdown">
                        <button
                            className="vnc-toolbar-btn"
                            onClick={() => setShowSpecialKeysMenu(!showSpecialKeysMenu)}
                            title="Enviar teclas especiais"
                            disabled={viewOnly}
                        >
                            <KeyboardIcon sx={{ fontSize: 18 }} />
                        </button>
                        {showSpecialKeysMenu && (
                            <div className="vnc-toolbar-menu special-keys-menu">
                                <div className="vnc-menu-title">⌨️ Teclas Especiais</div>
                                {specialKeyCombos.map(({ label, keys, action, icon, desc }) => (
                                    <button
                                        key={label}
                                        className="vnc-toolbar-menu-item"
                                        onClick={() => action ? action() : sendSpecialKeys(keys, label)}
                                        title={desc || label}
                                    >
                                        <span className="menu-icon">{icon}</span>
                                        <span className="menu-label">{label}</span>
                                        {desc && <span className="menu-desc">{desc}</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

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
