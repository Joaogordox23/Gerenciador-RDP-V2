/**
 * VncToolbar.js
 * ✨ v4.8: Migrado para Tailwind CSS
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    ContentCopyIcon, ContentPasteIcon, AspectRatioIcon, VisibilityIcon,
    VisibilityOffIcon, KeyboardIcon, FullscreenIcon, CloseIcon,
    SettingsIcon, RefreshIcon, PhotoCameraIcon, SignalWifiIcon, MouseIcon
} from './MuiIcons';

// X11 Keysyms
const XK = {
    Control_L: 0xFFE3, Alt_L: 0xFFE9, Shift_L: 0xFFE1, Delete: 0xFFFF,
    Escape: 0xFF1B, Super_L: 0xFFEB, Tab: 0xFF09, F4: 0xFFC1,
    r: 0x0072, e: 0x0065, d: 0x0064
};

function VncToolbar({
    rfbRef, connectionName, viewOnly, setViewOnly,
    scaleViewport, setScaleViewport, qualityLevel, setQualityLevel,
    onClose, onFullscreen, onReconnect
}) {
    const [clipboardText, setClipboardText] = useState('');
    const [showClipboardPopup, setShowClipboardPopup] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [remoteClipboard, setRemoteClipboard] = useState('');
    const [isAutoHide, setIsAutoHide] = useState(false);
    const [isHovered, setIsHovered] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('connected');
    const [showSpecialKeysMenu, setShowSpecialKeysMenu] = useState(false);

    useEffect(() => {
        if (!isAutoHide || isHovered) return;
        const timer = setTimeout(() => setIsHovered(false), 3000);
        return () => clearTimeout(timer);
    }, [isAutoHide, isHovered]);

    useEffect(() => {
        const rfb = rfbRef?.current;
        if (!rfb) return;
        const handleClipboard = (e) => {
            setRemoteClipboard(e.detail.text);
            navigator.clipboard.writeText(e.detail.text).catch(() => { });
        };
        rfb.addEventListener('clipboard', handleClipboard);
        return () => rfb.removeEventListener('clipboard', handleClipboard);
    }, [rfbRef]);

    const handlePaste = useCallback(async () => {
        const rfb = rfbRef?.current;
        if (!rfb) return;
        try {
            const text = await navigator.clipboard.readText();
            if (text) rfb.clipboardPasteFrom(text);
        } catch { setShowClipboardPopup(true); }
    }, [rfbRef]);

    const handleManualPaste = () => {
        const rfb = rfbRef?.current;
        if (!rfb || !clipboardText) return;
        rfb.clipboardPasteFrom(clipboardText);
        setClipboardText('');
        setShowClipboardPopup(false);
    };

    const handleCopy = useCallback(() => {
        if (remoteClipboard) navigator.clipboard.writeText(remoteClipboard);
    }, [remoteClipboard]);

    const toggleScale = () => {
        const newValue = !scaleViewport;
        setScaleViewport(newValue);
        if (rfbRef?.current) rfbRef.current.scaleViewport = newValue;
    };

    const changeQuality = (level) => {
        setQualityLevel(level);
        if (rfbRef?.current) rfbRef.current.qualityLevel = level;
        setShowQualityMenu(false);
    };

    const toggleViewOnly = () => {
        const newValue = !viewOnly;
        setViewOnly(newValue);
        if (rfbRef?.current) rfbRef.current.viewOnly = newValue;
    };

    const sendCtrlAltDel = () => {
        if (rfbRef?.current) { rfbRef.current.sendCtrlAltDel(); setShowSpecialKeysMenu(false); }
    };

    const sendSpecialKeys = useCallback((keysyms, label) => {
        if (!rfbRef?.current || viewOnly) return;
        const rfb = rfbRef.current;
        keysyms.forEach(k => rfb.sendKey(k, null, true));
        setTimeout(() => [...keysyms].reverse().forEach(k => rfb.sendKey(k, null, false)), 50);
        setShowSpecialKeysMenu(false);
    }, [rfbRef, viewOnly]);

    const specialKeyCombos = [
        { label: 'Ctrl+Alt+Del', action: sendCtrlAltDel, icon: '🔐' },
        { label: 'Ctrl+Shift+Esc', keys: [XK.Control_L, XK.Shift_L, XK.Escape], icon: '📊', desc: 'Gerenciador' },
        { label: 'Win+R', keys: [XK.Super_L, XK.r], icon: '▶️', desc: 'Executar' },
        { label: 'Win+E', keys: [XK.Super_L, XK.e], icon: '📁', desc: 'Explorador' },
        { label: 'Win+D', keys: [XK.Super_L, XK.d], icon: '🖥️', desc: 'Desktop' },
        { label: 'Alt+Tab', keys: [XK.Alt_L, XK.Tab], icon: '🔄', desc: 'Alternar' },
        { label: 'Alt+F4', keys: [XK.Alt_L, XK.F4], icon: '❌', desc: 'Fechar' },
    ];

    const takeScreenshot = () => {
        const rfb = rfbRef?.current;
        if (!rfb) return;
        try {
            const canvas = rfb._canvas;
            if (canvas) {
                const link = document.createElement('a');
                link.download = `vnc-${connectionName}-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        } catch { }
    };

    const qualityOptions = [
        { level: 0, label: 'Mínima', icon: '🔴' },
        { level: 2, label: 'Baixa', icon: '🟠' },
        { level: 4, label: 'Média', icon: '🟡' },
        { level: 6, label: 'Alta', icon: '🟢' },
        { level: 9, label: 'Máxima', icon: '🔵' }
    ];
    const currentQuality = qualityOptions.find(q => q.level === qualityLevel) || qualityOptions[3];

    const btnBase = "p-2 rounded-lg transition-all duration-200 text-white/70 hover:text-white hover:bg-white/10 cursor-pointer pointer-events-auto";
    const btnActive = "bg-primary/30 text-primary";

    return (
        <div className={`flex items-center gap-2 px-4 py-2 bg-dark-surface/95 backdrop-blur-lg 
            border-b border-gray-700 ${isAutoHide && !isHovered ? 'opacity-0' : 'opacity-100'} transition-opacity relative z-50 shrink-0`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => isAutoHide && setIsHovered(false)}>

            {/* Info */}
            <div className="flex items-center gap-2 mr-4">
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-primary' : 'bg-red-500'} animate-pulse`} />
                <span className="text-sm font-medium text-white truncate max-w-[150px]">{connectionName}</span>
            </div>

            {/* Clipboard */}
            <div className="flex items-center gap-1">
                <button type="button" className={btnBase} onClick={handlePaste} title="Colar"><ContentPasteIcon sx={{ fontSize: 18 }} /></button>
                {remoteClipboard && <button type="button" className={`${btnBase} text-primary`} onClick={handleCopy} title="Copiar"><ContentCopyIcon sx={{ fontSize: 18 }} /></button>}
            </div>
            <div className="w-px h-6 bg-gray-600" />

            {/* View */}
            <div className="flex items-center gap-1">
                <button type="button" className={`${btnBase} ${scaleViewport ? btnActive : ''}`} onClick={toggleScale} title="Escala">
                    <AspectRatioIcon sx={{ fontSize: 18 }} />
                </button>
                <button type="button" className={`${btnBase} ${viewOnly ? btnActive : ''}`} onClick={toggleViewOnly} title={viewOnly ? 'Visualização' : 'Controle'}>
                    {viewOnly ? <VisibilityIcon sx={{ fontSize: 18 }} /> : <MouseIcon sx={{ fontSize: 18 }} />}
                </button>
            </div>
            <div className="w-px h-6 bg-gray-600" />

            {/* Quality */}
            <div className="relative">
                <button type="button" className={btnBase} onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); }} title="Qualidade">
                    <SettingsIcon sx={{ fontSize: 18 }} /><span className="ml-1">{currentQuality.icon}</span>
                </button>
                {showQualityMenu && (
                    <div className="absolute top-full left-0 mt-2 bg-dark-surface border border-gray-700 rounded-lg shadow-xl z-[9999] min-w-[140px] overflow-hidden">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-700">Qualidade</div>
                        {qualityOptions.map(({ level, label, icon }) => (
                            <button key={level} onClick={() => changeQuality(level)}
                                className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-white/10 cursor-pointer ${level === qualityLevel ? 'bg-primary/20 text-primary' : 'text-white'}`}>
                                <span>{icon}</span>{label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="w-px h-6 bg-gray-600" />

            {/* Actions */}
            <div className="flex items-center gap-1">
                <div className="relative">
                    <button type="button" className={btnBase} onClick={(e) => { e.stopPropagation(); setShowSpecialKeysMenu(!showSpecialKeysMenu); }} disabled={viewOnly} title="Teclas especiais">
                        <KeyboardIcon sx={{ fontSize: 18 }} />
                    </button>
                    {showSpecialKeysMenu && (
                        <div className="absolute top-full left-0 mt-2 bg-dark-surface border border-gray-700 rounded-lg shadow-xl z-[9999] min-w-[180px] overflow-hidden">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-700">⌨️ Teclas Especiais</div>
                            {specialKeyCombos.map(({ label, keys, action, icon, desc }) => (
                                <button key={label} onClick={() => action ? action() : sendSpecialKeys(keys, label)}
                                    className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-white/10 text-white cursor-pointer">
                                    <span>{icon}</span>
                                    <span className="font-medium">{label}</span>
                                    {desc && <span className="text-xs text-gray-400 ml-auto">{desc}</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button type="button" className={btnBase} onClick={takeScreenshot} title="Screenshot"><PhotoCameraIcon sx={{ fontSize: 18 }} /></button>
                {onReconnect && <button type="button" className={btnBase} onClick={onReconnect} title="Reconectar"><RefreshIcon sx={{ fontSize: 18 }} /></button>}
            </div>
            <div className="w-px h-6 bg-gray-600" />

            {/* Window */}
            <div className="flex items-center gap-1">
                <button type="button" className={btnBase} onClick={onFullscreen} title="Fullscreen"><FullscreenIcon sx={{ fontSize: 18 }} /></button>
                <button type="button" className={`${btnBase} hover:bg-red-500/20 hover:text-red-500`} onClick={onClose} title="Fechar"><CloseIcon sx={{ fontSize: 18 }} /></button>
            </div>

            {/* Clipboard Popup */}
            {showClipboardPopup && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => setShowClipboardPopup(false)}>
                    <div className="bg-dark-surface p-6 rounded-2xl shadow-2xl w-96" onClick={e => e.stopPropagation()}>
                        <h4 className="text-lg font-bold text-white mb-2">📋 Colar Texto</h4>
                        <p className="text-sm text-gray-400 mb-4">Cole o texto para enviar ao servidor</p>
                        <textarea value={clipboardText} onChange={(e) => setClipboardText(e.target.value)}
                            className="w-full p-3 bg-dark-bg border border-gray-700 rounded-lg text-white resize-none mb-4"
                            rows={4} autoFocus placeholder="Cole ou digite o texto..." />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowClipboardPopup(false)}
                                className="px-4 py-2 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600">Cancelar</button>
                            <button onClick={handleManualPaste}
                                className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover">Enviar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VncToolbar;
