// src/components/AddServerForm.js - VERSÃO ULTRA-SIMPLES SEM LOOPS
// Formulário básico e funcional que NÃO causa re-renders infinitos

import React, { useState } from 'react';

function AddServerForm({ onServerAdded, onCancel }) {
    // Estado único do formulário (sem complexidade)
    const [serverData, setServerData] = useState({
        protocol: 'rdp',
        name: '',
        ipAddress: '',
        username: '',
        password: '',
        domain: '',
        port: ''
    });

    // Estado simples para erros (apenas no submit)
    const [errors, setErrors] = useState({});

    // ==========================
    // VALIDAÇÃO SIMPLES (SEM LOOPS)
    // ==========================
    const validateForm = () => {
        const newErrors = {};

        // Validação básica do nome
        if (!serverData.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        }

        // Validação básica do IP
        if (!serverData.ipAddress.trim()) {
            newErrors.ipAddress = 'IP/Hostname é obrigatório';
        }

        // Validação específica para SSH
        if (serverData.protocol === 'ssh') {
            if (!serverData.username.trim()) {
                newErrors.username = 'Usuário é obrigatório para SSH';
            }
            
            // Define porta padrão se não especificada
            if (!serverData.port) {
                setServerData(prev => ({ ...prev, port: '22' }));
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ==========================
    // HANDLERS SIMPLES
    // ==========================
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        
        setServerData(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpa erro específico quando usuário digita
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleProtocolChange = (event) => {
        const protocol = event.target.value;
        
        setServerData(prev => ({
            ...prev,
            protocol,
            port: protocol === 'ssh' ? '22' : '', // Auto-define porta para SSH
            domain: protocol === 'rdp' ? prev.domain : '' // Limpa domínio se não RDP
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        
        // Valida antes de enviar
        if (!validateForm()) {
            console.log('Formulário contém erros de validação');
            return;
        }

        // Prepara dados finais
        const finalServerData = {
            ...serverData,
            name: serverData.name.trim(),
            ipAddress: serverData.ipAddress.trim(),
            username: serverData.username.trim(),
            password: serverData.password,
            id: Date.now()
        };

        // Remove campos não aplicáveis
        if (finalServerData.protocol === 'rdp') {
            // Remove porta se vazia (RDP usa 3389 por padrão)
            if (!finalServerData.port) {
                delete finalServerData.port;
            }
        } else if (finalServerData.protocol === 'ssh') {
            // Remove domínio (não aplicável para SSH)
            delete finalServerData.domain;
            // Garante porta padrão
            if (!finalServerData.port) {
                finalServerData.port = '22';
            }
        }

        // Chama callback
        onServerAdded(finalServerData);

        // Limpa formulário
        setServerData({
            protocol: 'rdp',
            name: '',
            ipAddress: '',
            username: '',
            password: '',
            domain: '',
            port: ''
        });
        setErrors({});
    };

    // ==========================
    // HANDLERS DE AÇÕES
    // ==========================
    const handleCancel = () => {
        // Limpa formulário
        setServerData({
            protocol: 'rdp',
            name: '',
            ipAddress: '',
            username: '',
            password: '',
            domain: '',
            port: ''
        });
        setErrors({});
        
        // Chama callback se fornecido
        if (onCancel) {
            onCancel();
        }
    };

    // ==========================
    // RENDER SIMPLES
    // ==========================
    return (
        <div className="add-server-form-container">
            <div className="form-header">
                <h3>🖥️ Adicionar Novo Servidor</h3>
                <p className="form-subtitle">Preencha os dados do servidor para conexão remota</p>
            </div>

            <form className="add-server-form" onSubmit={handleSubmit}>
                {/* Seletor de protocolo */}
                <div className="form-row">
                    <label className="form-label">🔌 Protocolo</label>
                    <div className="protocol-selector">
                        <div className="protocol-option">
                            <input
                                type="radio"
                                id="rdp-protocol"
                                name="protocol"
                                value="rdp"
                                checked={serverData.protocol === 'rdp'}
                                onChange={handleProtocolChange}
                            />
                            <label htmlFor="rdp-protocol" className="protocol-label">
                                🖥️ RDP (Remote Desktop)
                            </label>
                        </div>
                        <div className="protocol-option">
                            <input
                                type="radio"
                                id="ssh-protocol"
                                name="protocol"
                                value="ssh"
                                checked={serverData.protocol === 'ssh'}
                                onChange={handleProtocolChange}
                            />
                            <label htmlFor="ssh-protocol" className="protocol-label">
                                💻 SSH (Secure Shell)
                            </label>
                        </div>
                    </div>
                </div>

                {/* Nome do servidor */}
                <div className="form-row">
                    <label htmlFor="server-name" className="form-label">🏷️ Nome do Servidor *</label>
                    <input
                        type="text"
                        id="server-name"
                        name="name"
                        value={serverData.name}
                        onChange={handleInputChange}
                        placeholder="Ex: Servidor Principal"
                        className={`form-input ${errors.name ? 'error' : ''}`}
                        required
                    />
                    {errors.name && (
                        <div className="input-info">
                            <span className="error-message">{errors.name}</span>
                        </div>
                    )}
                </div>

                {/* IP/Hostname */}
                <div className="form-row">
                    <label htmlFor="server-ip" className="form-label">🌐 IP ou Hostname *</label>
                    <input
                        type="text"
                        id="server-ip"
                        name="ipAddress"
                        value={serverData.ipAddress}
                        onChange={handleInputChange}
                        placeholder="Ex: 192.168.1.100 ou servidor.local"
                        className={`form-input ${errors.ipAddress ? 'error' : ''}`}
                        required
                    />
                    {errors.ipAddress && (
                        <div className="input-info">
                            <span className="error-message">{errors.ipAddress}</span>
                        </div>
                    )}
                </div>

                {/* Usuário */}
                <div className="form-row">
                    <label htmlFor="server-username" className="form-label">
                        👤 Usuário {serverData.protocol === 'ssh' ? '*' : ''}
                    </label>
                    <input
                        type="text"
                        id="server-username"
                        name="username"
                        value={serverData.username}
                        onChange={handleInputChange}
                        placeholder={
                            serverData.protocol === 'rdp' 
                                ? "Usuário Windows (opcional)" 
                                : "Usuário Linux/Unix (obrigatório)"
                        }
                        className={`form-input ${errors.username ? 'error' : ''}`}
                        required={serverData.protocol === 'ssh'}
                    />
                    {errors.username && (
                        <div className="input-info">
                            <span className="error-message">{errors.username}</span>
                        </div>
                    )}
                </div>

                {/* Senha */}
                <div className="form-row">
                    <label htmlFor="server-password" className="form-label">🔑 Senha</label>
                    <input
                        type="password"
                        id="server-password"
                        name="password"
                        value={serverData.password}
                        onChange={handleInputChange}
                        placeholder="Senha de acesso (opcional)"
                        className="form-input"
                    />
                    <div className="input-info">
                        <span className="input-hint">Pode ser definida posteriormente na conexão</span>
                    </div>
                </div>

                {/* Campo específico para RDP - Domínio */}
                {serverData.protocol === 'rdp' && (
                    <div className="form-row">
                        <label htmlFor="server-domain" className="form-label">🏢 Domínio</label>
                        <input
                            type="text"
                            id="server-domain"
                            name="domain"
                            value={serverData.domain}
                            onChange={handleInputChange}
                            placeholder="Ex: EMPRESA.LOCAL"
                            className="form-input"
                        />
                        <div className="input-info">
                            <span className="input-hint">Domínio Windows (opcional para máquinas locais)</span>
                        </div>
                    </div>
                )}

                {/* Campo específico para SSH - Porta */}
                {serverData.protocol === 'ssh' && (
                    <div className="form-row">
                        <label htmlFor="server-port" className="form-label">🔌 Porta</label>
                        <input
                            type="number"
                            id="server-port"
                            name="port"
                            value={serverData.port}
                            onChange={handleInputChange}
                            placeholder="22"
                            min="1"
                            max="65535"
                            className="form-input"
                        />
                        <div className="input-info">
                            <span className="input-hint">SSH usa porta 22 por padrão</span>
                        </div>
                    </div>
                )}

                {/* Info do protocolo selecionado */}
                <div className="protocol-info">
                    {serverData.protocol === 'rdp' ? (
                        <div className="info-box">
                            <strong>🖥️ Remote Desktop Protocol (RDP)</strong>
                            <p>Protocolo da Microsoft para acesso à área de trabalho remota. Usa porta 3389 por padrão.</p>
                        </div>
                    ) : (
                        <div className="info-box">
                            <strong>💻 Secure Shell (SSH)</strong>
                            <p>Protocolo seguro para acesso terminal remoto. Usa porta 22 por padrão.</p>
                        </div>
                    )}
                </div>

                {/* Ações do formulário */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="btn-cancel"
                    >
                        ❌ Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn-submit"
                    >
                        ✅ Adicionar Servidor
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddServerForm;