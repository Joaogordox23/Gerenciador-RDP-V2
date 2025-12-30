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

// X11 Keysyms - Expandido para mais teclas
const XK = {
    // Modificadores
    Control_L: 0xFFE3, Alt_L: 0xFFE9, Shift_L: 0xFFE1,
    Super_L: 0xFFEB, // Tecla Windows
    // Teclas especiais
    Delete: 0xFFFF, Escape: 0xFF1B, Tab: 0xFF09,
    Return: 0xFF0D, BackSpace: 0xFF08, Insert: 0xFF63,
    Home: 0xFF50, End: 0xFF57, Page_Up: 0xFF55, Page_Down: 0xFF56,
    // Function keys
    F1: 0xFFBE, F2: 0xFFBF, F3: 0xFFC0, F4: 0xFFC1, F5: 0xFFC2,
    F6: 0xFFC3, F7: 0xFFC4, F8: 0xFFC5, F9: 0xFFC6, F10: 0xFFC7,
    F11: 0xFFC8, F12: 0xFFC9,
    // Letras (lowercase)
    a: 0x0061, b: 0x0062, c: 0x0063, d: 0x0064, e: 0x0065,
    f: 0x0066, l: 0x006C, m: 0x006D, n: 0x006E, o: 0x006F,
    p: 0x0070, r: 0x0072, s: 0x0073, t: 0x0074, u: 0x0075, v: 0x0076,
    w: 0x0077, x: 0x0078, y: 0x0079, z: 0x007A,
    // Print Screen
    Print: 0xFF61,
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

    // ✅ v5.11: Solicita clipboard do servidor enviando Ctrl+C remotamente
    const handleRequestClipboard = useCallback(() => {
        const rfb = rfbRef?.current;
        if (!rfb) return;

        console.log('📋 Solicitando clipboard do servidor (enviando Ctrl+C)...');

        // Envia Ctrl+C para o servidor para triggerar envio do clipboard
        const XK_Control_L = 0xFFE3;
        const XK_c = 0x0063;

        rfb.sendKey(XK_Control_L, "ControlLeft", true);
        rfb.sendKey(XK_c, "KeyC", true);
        rfb.sendKey(XK_c, "KeyC", false);
        rfb.sendKey(XK_Control_L, "ControlLeft", false);

        // O evento 'clipboard' será disparado pelo servidor e nosso listener
        // já está configurado para copiar automaticamente para o clipboard local
    }, [rfbRef]);

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

    // ✅ v5.9: Memoizado para evitar re-renders
    const sendCtrlAltDel = useCallback(() => {
        if (rfbRef?.current) { rfbRef.current.sendCtrlAltDel(); setShowSpecialKeysMenu(false); }
    }, [rfbRef]);

    const sendSpecialKeys = useCallback((keysyms, label) => {
        if (!rfbRef?.current || viewOnly) return;
        const rfb = rfbRef.current;
        keysyms.forEach(k => rfb.sendKey(k, null, true));
        setTimeout(() => [...keysyms].reverse().forEach(k => rfb.sendKey(k, null, false)), 50);
        setShowSpecialKeysMenu(false);
    }, [rfbRef, viewOnly]);

    // ✅ v5.5: Power Control Functions (Win+X → U → action)
    const sendPowerCommand = useCallback((finalKey, actionName) => {
        if (!rfbRef?.current || viewOnly) return;
        const rfb = rfbRef.current;

        console.log(`⚡ [Power] Enviando ${actionName}...`);

        // Passo 1: Win+X para abrir menu de power user
        rfb.sendKey(XK.Super_L, "MetaLeft", true);
        rfb.sendKey(XK.x, "KeyX", true);
        rfb.sendKey(XK.x, "KeyX", false);
        rfb.sendKey(XK.Super_L, "MetaLeft", false);

        // Passo 2: Aguarda menu abrir e pressiona U (shutdown options)
        setTimeout(() => {
            if (!rfbRef.current) return;
            rfb.sendKey(XK.u, "KeyU", true);
            rfb.sendKey(XK.u, "KeyU", false);

            // Passo 3: Aguarda submenu e pressiona ação final
            setTimeout(() => {
                if (!rfbRef.current) return;
                rfb.sendKey(finalKey, null, true);
                rfb.sendKey(finalKey, null, false);
                console.log(`✅ [Power] ${actionName} enviado!`);
            }, 300);
        }, 500);

        setShowSpecialKeysMenu(false);
    }, [rfbRef, viewOnly]);

    const sendShutdown = useCallback(() => sendPowerCommand(XK.u, 'Shutdown'), [sendPowerCommand]);
    const sendReboot = useCallback(() => sendPowerCommand(XK.r, 'Reboot'), [sendPowerCommand]);
    const sendSleep = useCallback(() => sendPowerCommand(XK.s, 'Sleep'), [sendPowerCommand]);

    // ✅ v5.5: Forçar foco no canvas VNC
    const focusCanvas = useCallback(() => {
        if (rfbRef?.current) {
            rfbRef.current.focus({ preventScroll: true });
        } else {
            // Fallback: tenta encontrar canvas diretamente
            const canvas = document.querySelector('.noVNC_canvas, canvas[tabindex]');
            if (canvas) canvas.focus();
        }
    }, [rfbRef]);

    const specialKeyCombos = [
        // Grupo: Power (v5.5)
        { label: 'Desligar', action: sendShutdown, icon: '⏻', desc: 'Shutdown', group: 'Power' },
        { label: 'Reiniciar', action: sendReboot, icon: '🔄', desc: 'Reboot', group: 'Power' },
        { label: 'Suspender', action: sendSleep, icon: '💤', desc: 'Sleep', group: 'Power' },
        { label: 'Win+L', keys: [XK.Super_L, XK.l], icon: '🔒', desc: 'Bloquear', group: 'Power' },
        // Grupo: Sistema
        { label: 'Ctrl+Alt+Del', action: sendCtrlAltDel, icon: '🔐', group: 'Sistema' },
        { label: 'Ctrl+Shift+Esc', keys: [XK.Control_L, XK.Shift_L, XK.Escape], icon: '📊', desc: 'Gerenciador', group: 'Sistema' },
        { label: 'Win+R', keys: [XK.Super_L, XK.r], icon: '▶️', desc: 'Executar', group: 'Sistema' },
        { label: 'Win+E', keys: [XK.Super_L, XK.e], icon: '📁', desc: 'Explorador', group: 'Sistema' },
        { label: 'Win+D', keys: [XK.Super_L, XK.d], icon: '🖥️', desc: 'Desktop', group: 'Sistema' },
        // Grupo: Navegação
        { label: 'Alt+Tab', keys: [XK.Alt_L, XK.Tab], icon: '🔄', desc: 'Alternar', group: 'Navegação' },
        { label: 'Alt+F4', keys: [XK.Alt_L, XK.F4], icon: '❌', desc: 'Fechar', group: 'Navegação' },
        { label: 'F11', keys: [XK.F11], icon: '⛶', desc: 'Fullscreen', group: 'Navegação' },
        // Grupo: Edição
        { label: 'Ctrl+C', keys: [XK.Control_L, XK.c], icon: '📋', desc: 'Copiar', group: 'Edição' },
        { label: 'Ctrl+V', keys: [XK.Control_L, XK.v], icon: '📄', desc: 'Colar', group: 'Edição' },
        { label: 'Ctrl+X', keys: [XK.Control_L, XK.x], icon: '✂️', desc: 'Recortar', group: 'Edição' },
        { label: 'Ctrl+A', keys: [XK.Control_L, XK.a], icon: '☑️', desc: 'Selec. Tudo', group: 'Edição' },
        { label: 'Ctrl+Z', keys: [XK.Control_L, XK.z], icon: '↩️', desc: 'Desfazer', group: 'Edição' },
        { label: 'Ctrl+S', keys: [XK.Control_L, XK.s], icon: '💾', desc: 'Salvar', group: 'Edição' },
        // Grupo: Navegador
        { label: 'Ctrl+T', keys: [XK.Control_L, XK.t], icon: '➕', desc: 'Nova Aba', group: 'Navegador' },
        { label: 'Ctrl+W', keys: [XK.Control_L, XK.w], icon: '✖️', desc: 'Fechar Aba', group: 'Navegador' },
        { label: 'Ctrl+N', keys: [XK.Control_L, XK.n], icon: '🆕', desc: 'Nova Janela', group: 'Navegador' },
        { label: 'Ctrl+F', keys: [XK.Control_L, XK.f], icon: '🔍', desc: 'Buscar', group: 'Navegador' },
        { label: 'F5', keys: [XK.F5], icon: '🔄', desc: 'Atualizar', group: 'Navegador' },
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
                <button type="button" className={btnBase} onClick={handlePaste} title="Colar do local para servidor"><ContentPasteIcon sx={{ fontSize: 18 }} /></button>
                <button type="button" className={btnBase} onClick={handleRequestClipboard} title="Sincronizar clipboard do servidor (Ctrl+C)">🔄</button>
                {remoteClipboard && <button type="button" className={`${btnBase} text-primary`} onClick={handleCopy} title="Copiar para local"><ContentCopyIcon sx={{ fontSize: 18 }} /></button>}
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
                {/* ✅ v5.5: Botão de foco para garantir captura de teclado */}
                <button type="button" className={btnBase} onClick={focusCanvas} title="Ativar entrada de teclado">
                    🎯
                </button>
                <div className="relative">
                    <button type="button" className={btnBase} onClick={(e) => { e.stopPropagation(); setShowSpecialKeysMenu(!showSpecialKeysMenu); }} disabled={viewOnly} title="Teclas especiais">
                        <KeyboardIcon sx={{ fontSize: 18 }} />
                    </button>
                    {showSpecialKeysMenu && (
                        <div className="
                            absolute top-full right-0 mt-2 
                            bg-dark-surface border border-gray-700 rounded-lg shadow-xl 
                            z-[9999] min-w-[220px] max-h-[400px] 
                            overflow-y-auto overflow-x-hidden
                            scrollbar-thin scrollbar-track-dark-bg scrollbar-thumb-gray-600
                            hover:scrollbar-thumb-gray-500
                        ">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-700 sticky top-0 bg-dark-surface z-10">⌨️ Teclas Especiais</div>
                            {/* Agrupa por categoria */}
                            {['Power', 'Sistema', 'Navegação', 'Edição', 'Navegador'].map(group => (
                                <div key={group}>
                                    <div className={`px-3 py-1.5 text-xs font-semibold bg-primary/5 ${group === 'Power' ? 'text-red-400' : 'text-primary/80'}`}>
                                        {group === 'Power' ? '⚡ ' : ''}{group}
                                    </div>
                                    {specialKeyCombos.filter(k => k.group === group).map(({ label, keys, action, icon, desc }) => (
                                        <button key={label} onClick={() => action ? action() : sendSpecialKeys(keys, label)}
                                            className={`
                                                w-full px-3 py-1.5 text-sm text-left 
                                                flex items-center gap-2 hover:bg-white/10 
                                                text-white cursor-pointer
                                                ${group === 'Power' ? 'hover:bg-red-500/10' : ''}
                                            `}>
                                            <span className="w-5 text-center">{icon}</span>
                                            <span className="font-medium flex-1">{label}</span>
                                            {desc && <span className="text-xs text-gray-400">{desc}</span>}
                                        </button>
                                    ))}
                                </div>
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
