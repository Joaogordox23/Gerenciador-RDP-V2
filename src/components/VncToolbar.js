/**
 * VncToolbar.js
 * Barra de ferramentas para o VNC Viewer - Estilo consistente com UX/UI do app
 */

import React, { useState, useEffect, useCallback } from 'react';
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
    onFullscreen
}) {
    const [clipboardText, setClipboardText] = useState('');
    const [showClipboardPopup, setShowClipboardPopup] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [remoteClipboard, setRemoteClipboard] = useState('');

    // Escuta eventos de clipboard do servidor remoto
    useEffect(() => {
        const rfb = rfbRef?.current;
        if (!rfb) return;

        const handleClipboard = (e) => {
            const text = e.detail.text;
            console.log('Clipboard recebido do servidor');
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

    const qualityLabels = {
        0: 'Mínima',
        2: 'Baixa',
        4: 'Média',
        6: 'Alta',
        9: 'Máxima'
    };

    return (
        <div className="vnc-toolbar">
            {/* Info */}
            <div className="vnc-toolbar-info">
                <span className="vnc-toolbar-name">{connectionName}</span>
            </div>

            {/* Controles */}
            <div className="vnc-toolbar-controls">
                {/* Clipboard */}
                <div className="vnc-toolbar-group">
                    <button
                        className="vnc-toolbar-btn"
                        onClick={handlePaste}
                        title="Colar do clipboard local"
                    >
                        Colar
                    </button>
                    {remoteClipboard && (
                        <button
                            className="vnc-toolbar-btn"
                            onClick={handleCopy}
                            title="Copiar do servidor remoto"
                        >
                            Copiar
                        </button>
                    )}
                </div>

                {/* Escala */}
                <button
                    className={`vnc-toolbar-btn ${scaleViewport ? 'active' : ''}`}
                    onClick={toggleScale}
                    title={scaleViewport ? 'Desativar escala' : 'Ativar escala automática'}
                >
                    Escala: {scaleViewport ? 'On' : 'Off'}
                </button>

                {/* Qualidade */}
                <div className="vnc-toolbar-dropdown">
                    <button
                        className="vnc-toolbar-btn"
                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                        title="Ajustar qualidade"
                    >
                        Qualidade: {qualityLabels[qualityLevel] || qualityLevel}
                    </button>
                    {showQualityMenu && (
                        <div className="vnc-toolbar-menu">
                            {Object.entries(qualityLabels).map(([level, label]) => (
                                <button
                                    key={level}
                                    className={`vnc-toolbar-menu-item ${parseInt(level) === qualityLevel ? 'active' : ''}`}
                                    onClick={() => changeQuality(parseInt(level))}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* View Only */}
                <button
                    className={`vnc-toolbar-btn ${viewOnly ? 'active' : ''}`}
                    onClick={toggleViewOnly}
                    title={viewOnly ? 'Ativar controle' : 'Modo somente visualização'}
                >
                    {viewOnly ? 'Somente Ver' : 'Controle'}
                </button>

                {/* Ctrl+Alt+Del */}
                <button
                    className="vnc-toolbar-btn"
                    onClick={sendCtrlAltDel}
                    title="Enviar Ctrl+Alt+Del"
                    disabled={viewOnly}
                >
                    Ctrl+Alt+Del
                </button>

                {/* Fullscreen */}
                <button
                    className="vnc-toolbar-btn"
                    onClick={onFullscreen}
                    title="Tela cheia"
                >
                    Fullscreen
                </button>

                {/* Fechar */}
                <button
                    className="vnc-toolbar-btn close"
                    onClick={onClose}
                    title="Fechar (ESC)"
                >
                    Fechar
                </button>
            </div>

            {/* Popup de Clipboard Manual */}
            {showClipboardPopup && (
                <div className="vnc-clipboard-popup">
                    <div className="vnc-clipboard-popup-content">
                        <h4>Colar Texto</h4>
                        <textarea
                            value={clipboardText}
                            onChange={(e) => setClipboardText(e.target.value)}
                            placeholder="Cole ou digite o texto aqui..."
                            rows={4}
                        />
                        <div className="vnc-clipboard-popup-actions">
                            <button onClick={handleManualPaste}>Enviar</button>
                            <button onClick={() => setShowClipboardPopup(false)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VncToolbar;
