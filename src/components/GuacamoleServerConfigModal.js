/**
 * GuacamoleServerConfigModal.js
 * Modal para configurar servidor Guacamole remoto
 * Permite ao usuário definir IP:porta do servidor Docker
 */

import React, { useState, useEffect } from 'react';
import {
    CloseIcon,
    SettingsIcon,
    CheckCircleIcon,
    ErrorOutlineIcon,
    RefreshIcon
} from './MuiIcons';
import './GuacamoleServerConfigModal.css';

function GuacamoleServerConfigModal({ isOpen, onClose, onSave, initialConfig }) {
    const [serverMode, setServerMode] = useState('remote'); // 'local' ou 'remote'
    const [host, setHost] = useState('');
    const [port, setPort] = useState('8080');
    const [guacdHost, setGuacdHost] = useState('');
    const [guacdPort, setGuacdPort] = useState('4822');
    const [secretKey, setSecretKey] = useState('GerenciadorRDPv2SecretKey123456!');
    const [testStatus, setTestStatus] = useState(null); // null, 'testing', 'success', 'error'
    const [testMessage, setTestMessage] = useState('');

    // Carrega configuração inicial
    useEffect(() => {
        if (initialConfig) {
            setServerMode(initialConfig.mode || 'remote');
            setHost(initialConfig.host || '');
            setPort(initialConfig.port || '8080');
            setGuacdHost(initialConfig.guacdHost || '');
            setGuacdPort(initialConfig.guacdPort || '4822');
            setSecretKey(initialConfig.secretKey || 'GerenciadorRDPv2SecretKey123456!');
        }
    }, [initialConfig]);

    // Testa conexão com o servidor
    const handleTestConnection = async () => {
        setTestStatus('testing');
        setTestMessage('Testando conexão...');

        try {
            const wsUrl = serverMode === 'local'
                ? 'ws://localhost:8080'
                : `ws://${host}:${port}`;

            // Tenta abrir WebSocket
            const ws = new WebSocket(wsUrl + '/?token=test');

            const timeout = setTimeout(() => {
                ws.close();
                setTestStatus('error');
                setTestMessage('Timeout: servidor não respondeu em 5 segundos');
            }, 5000);

            ws.onopen = () => {
                clearTimeout(timeout);
                ws.close();
                setTestStatus('success');
                setTestMessage('Conexão estabelecida com sucesso!');
            };

            ws.onerror = () => {
                clearTimeout(timeout);
                setTestStatus('error');
                setTestMessage('Não foi possível conectar ao servidor');
            };

        } catch (error) {
            setTestStatus('error');
            setTestMessage(`Erro: ${error.message}`);
        }
    };

    const handleSave = () => {
        const config = {
            mode: serverMode,
            host: serverMode === 'local' ? 'localhost' : host,
            port: serverMode === 'local' ? '8080' : port,
            guacdHost: serverMode === 'local' ? '127.0.0.1' : guacdHost,
            guacdPort: guacdPort,
            secretKey: secretKey,
            wsUrl: serverMode === 'local' ? 'ws://localhost:8080' : `ws://${host}:${port}`
        };

        onSave(config);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="guac-config-overlay" onClick={onClose}>
            <div className="guac-config-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="guac-config-header">
                    <div className="guac-config-title">
                        <SettingsIcon sx={{ fontSize: 24 }} />
                        <h2>Configuração do Servidor Guacamole</h2>
                    </div>
                    <button className="guac-config-close" onClick={onClose}>
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>

                {/* Content */}
                <div className="guac-config-content">
                    {/* Modo do servidor */}
                    <div className="guac-config-section">
                        <label className="guac-config-label">Modo do Servidor</label>
                        <div className="guac-config-mode-buttons">
                            <button
                                className={`guac-mode-btn ${serverMode === 'local' ? 'active' : ''}`}
                                onClick={() => setServerMode('local')}
                            >
                                🖥️ Local (Desenvolvimento)
                            </button>
                            <button
                                className={`guac-mode-btn ${serverMode === 'remote' ? 'active' : ''}`}
                                onClick={() => setServerMode('remote')}
                            >
                                🌐 Servidor Remoto (Docker)
                            </button>
                        </div>
                    </div>

                    {serverMode === 'remote' && (
                        <>
                            {/* guacamole-lite */}
                            <div className="guac-config-section">
                                <label className="guac-config-label">
                                    Servidor guacamole-lite (WebSocket)
                                </label>
                                <div className="guac-config-row">
                                    <input
                                        type="text"
                                        placeholder="IP ou hostname (ex: 192.168.1.100)"
                                        value={host}
                                        onChange={(e) => setHost(e.target.value)}
                                        className="guac-config-input"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Porta"
                                        value={port}
                                        onChange={(e) => setPort(e.target.value)}
                                        className="guac-config-input port"
                                    />
                                </div>
                            </div>

                            {/* guacd */}
                            <div className="guac-config-section">
                                <label className="guac-config-label">
                                    Servidor guacd (Backend)
                                </label>
                                <div className="guac-config-row">
                                    <input
                                        type="text"
                                        placeholder="IP do guacd (ex: 192.168.1.100)"
                                        value={guacdHost}
                                        onChange={(e) => setGuacdHost(e.target.value)}
                                        className="guac-config-input"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Porta"
                                        value={guacdPort}
                                        onChange={(e) => setGuacdPort(e.target.value)}
                                        className="guac-config-input port"
                                    />
                                </div>
                                <p className="guac-config-hint">
                                    Geralmente o mesmo IP do guacamole-lite, porta 4822
                                </p>
                            </div>

                            {/* Chave de criptografia */}
                            <div className="guac-config-section">
                                <label className="guac-config-label">
                                    Chave de Criptografia (32 caracteres)
                                </label>
                                <input
                                    type="password"
                                    placeholder="Chave secreta AES-256"
                                    value={secretKey}
                                    onChange={(e) => setSecretKey(e.target.value)}
                                    className="guac-config-input full"
                                />
                                <p className="guac-config-hint">
                                    Deve ser a mesma chave configurada no servidor Docker
                                </p>
                            </div>
                        </>
                    )}

                    {serverMode === 'local' && (
                        <div className="guac-config-info">
                            <p>
                                🔧 <strong>Modo Local:</strong> O servidor Guacamole será iniciado
                                automaticamente junto com a aplicação.
                            </p>
                            <p>
                                Requer que o <code>guacd</code> esteja instalado e rodando em
                                <code>localhost:4822</code>.
                            </p>
                        </div>
                    )}

                    {/* Teste de conexão */}
                    <div className="guac-config-section">
                        <button
                            className="guac-config-test-btn"
                            onClick={handleTestConnection}
                            disabled={testStatus === 'testing' || (serverMode === 'remote' && !host)}
                        >
                            {testStatus === 'testing' ? (
                                <>
                                    <RefreshIcon sx={{ fontSize: 18 }} className="spinning" />
                                    Testando...
                                </>
                            ) : (
                                <>
                                    🔌 Testar Conexão
                                </>
                            )}
                        </button>

                        {testStatus === 'success' && (
                            <div className="guac-config-test-result success">
                                <CheckCircleIcon sx={{ fontSize: 18 }} />
                                {testMessage}
                            </div>
                        )}

                        {testStatus === 'error' && (
                            <div className="guac-config-test-result error">
                                <ErrorOutlineIcon sx={{ fontSize: 18 }} />
                                {testMessage}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="guac-config-footer">
                    <button className="guac-config-btn secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        className="guac-config-btn primary"
                        onClick={handleSave}
                        disabled={serverMode === 'remote' && (!host || !port)}
                    >
                        Salvar Configuração
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GuacamoleServerConfigModal;
