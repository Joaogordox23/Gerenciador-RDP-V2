/**
 * GuacamoleSettingsModal.js
 * Modal para configurações globais de conexões Guacamole
 */

import React, { useState, useEffect, useCallback } from 'react';
import './GuacamoleSettingsModal.css';

const QUALITY_PRESETS = {
    low: { label: 'Baixa', description: 'Menor uso de banda, menos detalhes' },
    balanced: { label: 'Balanceado', description: 'Equilíbrio entre qualidade e performance' },
    high: { label: 'Alta', description: 'Mais detalhes, maior uso de banda' },
    lossless: { label: 'Sem Perdas', description: 'Qualidade máxima, maior latência' }
};

function GuacamoleSettingsModal({ isOpen, onClose, onSave }) {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Carrega configurações atuais
    useEffect(() => {
        if (isOpen) {
            loadConfig();
        }
    }, [isOpen]);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const currentConfig = await window.api.guacamole.getConfig();
            setConfig(currentConfig);
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await window.api.guacamole.setConfig(config);
            if (result.success) {
                if (onSave) onSave(config);
                onClose();
            } else {
                alert('Erro ao salvar configurações: ' + result.error);
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleQualityChange = useCallback((preset) => {
        setConfig(prev => ({
            ...prev,
            quality: { ...prev.quality, mode: preset }
        }));
    }, []);

    const handleClipboardChange = useCallback((key, value) => {
        setConfig(prev => ({
            ...prev,
            clipboard: { ...prev.clipboard, [key]: value }
        }));
    }, []);

    const handleRdpChange = useCallback((key, value) => {
        setConfig(prev => ({
            ...prev,
            rdp: { ...prev.rdp, [key]: value }
        }));
    }, []);

    const handleVncChange = useCallback((key, value) => {
        setConfig(prev => ({
            ...prev,
            vnc: { ...prev.vnc, [key]: value }
        }));
    }, []);

    const handleSshChange = useCallback((key, value) => {
        setConfig(prev => ({
            ...prev,
            ssh: { ...prev.ssh, [key]: value }
        }));
    }, []);

    if (!isOpen) return null;

    return (
        <div className="guac-settings-overlay" onClick={onClose}>
            <div className="guac-settings-modal" onClick={e => e.stopPropagation()}>
                <div className="guac-settings-header">
                    <h2>⚙️ Configurações do Guacamole</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {loading ? (
                    <div className="guac-settings-loading">
                        <div className="loader"></div>
                        <p>Carregando configurações...</p>
                    </div>
                ) : config ? (
                    <div className="guac-settings-content">
                        {/* Qualidade */}
                        <section className="settings-section">
                            <h3>📊 Qualidade de Imagem</h3>
                            <div className="quality-presets">
                                {Object.entries(QUALITY_PRESETS).map(([key, preset]) => (
                                    <button
                                        key={key}
                                        className={`quality-btn ${config.quality?.mode === key ? 'active' : ''}`}
                                        onClick={() => handleQualityChange(key)}
                                    >
                                        <span className="quality-label">{preset.label}</span>
                                        <span className="quality-desc">{preset.description}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Clipboard */}
                        <section className="settings-section">
                            <h3>📋 Clipboard</h3>
                            <div className="settings-grid">
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.clipboard?.enabled ?? true}
                                        onChange={e => handleClipboardChange('enabled', e.target.checked)}
                                    />
                                    <span>Habilitar sincronização</span>
                                </label>
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.clipboard?.syncFromRemote ?? true}
                                        onChange={e => handleClipboardChange('syncFromRemote', e.target.checked)}
                                        disabled={!config.clipboard?.enabled}
                                    />
                                    <span>Copiar do remoto</span>
                                </label>
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.clipboard?.syncToRemote ?? true}
                                        onChange={e => handleClipboardChange('syncToRemote', e.target.checked)}
                                        disabled={!config.clipboard?.enabled}
                                    />
                                    <span>Colar no remoto</span>
                                </label>
                            </div>
                        </section>

                        {/* Display */}
                        <section className="settings-section">
                            <h3>🖥️ Display</h3>
                            <div className="settings-grid">
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.display?.dynamicResize ?? true}
                                        onChange={e => setConfig(prev => ({
                                            ...prev,
                                            display: { ...prev.display, dynamicResize: e.target.checked }
                                        }))}
                                    />
                                    <span>Redimensionamento dinâmico</span>
                                </label>
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.display?.fitToWindow ?? true}
                                        onChange={e => setConfig(prev => ({
                                            ...prev,
                                            display: { ...prev.display, fitToWindow: e.target.checked }
                                        }))}
                                    />
                                    <span>Ajustar à janela</span>
                                </label>
                                <label className="setting-item select-item">
                                    <span>DPI:</span>
                                    <select
                                        value={config.display?.dpi ?? 96}
                                        onChange={e => setConfig(prev => ({
                                            ...prev,
                                            display: { ...prev.display, dpi: parseInt(e.target.value) }
                                        }))}
                                    >
                                        <option value="72">72 (Baixo)</option>
                                        <option value="96">96 (Padrão)</option>
                                        <option value="120">120 (Alto)</option>
                                        <option value="144">144 (Muito Alto)</option>
                                    </select>
                                </label>
                            </div>
                        </section>

                        {/* Transferência de Arquivos */}
                        <section className="settings-section">
                            <h3>📁 Transferência de Arquivos</h3>
                            <div className="settings-grid">
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.fileTransfer?.enabled ?? true}
                                        onChange={e => setConfig(prev => ({
                                            ...prev,
                                            fileTransfer: { ...prev.fileTransfer, enabled: e.target.checked }
                                        }))}
                                    />
                                    <span>Habilitar transferência</span>
                                </label>
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.fileTransfer?.downloadEnabled ?? true}
                                        onChange={e => setConfig(prev => ({
                                            ...prev,
                                            fileTransfer: { ...prev.fileTransfer, downloadEnabled: e.target.checked }
                                        }))}
                                        disabled={!config.fileTransfer?.enabled}
                                    />
                                    <span>Permitir download</span>
                                </label>
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.fileTransfer?.uploadEnabled ?? true}
                                        onChange={e => setConfig(prev => ({
                                            ...prev,
                                            fileTransfer: { ...prev.fileTransfer, uploadEnabled: e.target.checked }
                                        }))}
                                        disabled={!config.fileTransfer?.enabled}
                                    />
                                    <span>Permitir upload</span>
                                </label>
                            </div>
                            <p className="setting-hint">
                                📂 Arquivos são salvos em: Documents/GerenciadorRDP/Transfers
                            </p>
                        </section>

                        {/* RDP */}
                        <section className="settings-section">
                            <h3>🖥️ RDP</h3>
                            <div className="settings-grid">
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.rdp?.enableDrive ?? true}
                                        onChange={e => handleRdpChange('enableDrive', e.target.checked)}
                                    />
                                    <span>Compartilhar pasta (Drive)</span>
                                </label>
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.rdp?.enableWallpaper ?? false}
                                        onChange={e => handleRdpChange('enableWallpaper', e.target.checked)}
                                    />
                                    <span>Exibir papel de parede</span>
                                </label>
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.rdp?.enableTheming ?? false}
                                        onChange={e => handleRdpChange('enableTheming', e.target.checked)}
                                    />
                                    <span>Habilitar temas visuais</span>
                                </label>
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.rdp?.enableFontSmoothing ?? true}
                                        onChange={e => handleRdpChange('enableFontSmoothing', e.target.checked)}
                                    />
                                    <span>Suavização de fontes</span>
                                </label>
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.rdp?.enableDesktopComposition ?? false}
                                        onChange={e => handleRdpChange('enableDesktopComposition', e.target.checked)}
                                    />
                                    <span>Composição de desktop (Aero)</span>
                                </label>
                            </div>
                        </section>

                        {/* VNC */}
                        <section className="settings-section">
                            <h3>📺 VNC</h3>
                            <div className="settings-grid">
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.vnc?.viewOnly ?? false}
                                        onChange={e => handleVncChange('viewOnly', e.target.checked)}
                                    />
                                    <span>Somente visualização</span>
                                </label>
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.vnc?.enableMultiMonitor ?? false}
                                        onChange={e => handleVncChange('enableMultiMonitor', e.target.checked)}
                                    />
                                    <span>Multi-monitor (experimental)</span>
                                </label>
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.vnc?.cursorRemote ?? false}
                                        onChange={e => handleVncChange('cursorRemote', e.target.checked)}
                                    />
                                    <span>Cursor remoto (desabilita se tiver lag)</span>
                                </label>
                            </div>
                        </section>

                        {/* SSH */}
                        <section className="settings-section">
                            <h3>💻 SSH</h3>
                            <div className="settings-grid">
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={config.ssh?.enableSftp ?? true}
                                        onChange={e => handleSshChange('enableSftp', e.target.checked)}
                                    />
                                    <span>Habilitar SFTP</span>
                                </label>
                                <label className="setting-item select-item">
                                    <span>Esquema de cores:</span>
                                    <select
                                        value={config.ssh?.colorScheme ?? 'green-black'}
                                        onChange={e => handleSshChange('colorScheme', e.target.value)}
                                    >
                                        <option value="green-black">Verde sobre preto</option>
                                        <option value="white-black">Branco sobre preto</option>
                                        <option value="gray-black">Cinza sobre preto</option>
                                        <option value="black-white">Preto sobre branco</option>
                                    </select>
                                </label>
                                <label className="setting-item select-item">
                                    <span>Tamanho da fonte:</span>
                                    <select
                                        value={config.ssh?.fontSize ?? 12}
                                        onChange={e => handleSshChange('fontSize', parseInt(e.target.value))}
                                    >
                                        <option value="10">10px</option>
                                        <option value="12">12px</option>
                                        <option value="14">14px</option>
                                        <option value="16">16px</option>
                                        <option value="18">18px</option>
                                    </select>
                                </label>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="guac-settings-error">
                        <p>❌ Não foi possível carregar as configurações</p>
                        <button onClick={loadConfig}>Tentar novamente</button>
                    </div>
                )}

                <div className="guac-settings-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancelar</button>
                    <button
                        className="btn-save"
                        onClick={handleSave}
                        disabled={loading || saving}
                    >
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GuacamoleSettingsModal;
