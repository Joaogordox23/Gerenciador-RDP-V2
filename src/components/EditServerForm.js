// src/components/EditServerForm.js

import React, { useState } from 'react';

// Este componente recebe o serverInfo para preencher os campos
function EditServerForm({ serverInfo, onSave, onCancel }) {
    // O estado inicial é preenchido com os dados do servidor que estamos a editar
    const [serverData, setServerData] = useState({
        protocol: serverInfo.protocol || 'rdp',
        name: serverInfo.name || '',
        ipAddress: serverInfo.ipAddress || '',
        username: serverInfo.username || '',
        password: '', // A senha não é preenchida por segurança
        domain: serverInfo.domain || '',
        port: serverInfo.port || ''
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!serverData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!serverData.ipAddress.trim()) newErrors.ipAddress = 'IP/Hostname é obrigatório';
        if (serverData.protocol === 'ssh' && !serverData.username.trim()) {
            newErrors.username = 'Usuário é obrigatório para SSH';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setServerData(prev => ({ ...prev, [name]: value }));
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
            port: protocol === 'ssh' ? (prev.port || '22') : '',
            domain: protocol === 'rdp' ? prev.domain : ''
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!validateForm()) return;

        // Prepara os dados para salvar, omitindo a senha se estiver vazia
        const finalData = { ...serverData };
        if (!finalData.password) {
            delete finalData.password; // Não envia senha vazia para não sobrescrever a existente
        }

        onSave(finalData);
    };

    // Usamos os mesmos estilos do AddServerForm para consistência
    return (
        <div className="add-server-form-container" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
                <h3>✏️ Editar Servidor</h3>
                <p className="form-subtitle">Atualize os dados do servidor {serverInfo.name}</p>
            </div>
            <form className="add-server-form" onSubmit={handleSubmit}>
                {/* Seletor de protocolo */}
                <div className="form-row">
                    <label className="form-label">🔌 Protocolo</label>
                    <div className="protocol-selector">
                        {/* Opção RDP */}
                        <div className="protocol-option">
                            <input type="radio" id={`rdp-${serverInfo.id}`} name="protocol" value="rdp" checked={serverData.protocol === 'rdp'} onChange={handleProtocolChange} />
                            <label htmlFor={`rdp-${serverInfo.id}`} className="protocol-label">🖥️ RDP</label>
                        </div>
                        {/* Opção SSH */}
                        <div className="protocol-option">
                            <input type="radio" id={`ssh-${serverInfo.id}`} name="protocol" value="ssh" checked={serverData.protocol === 'ssh'} onChange={handleProtocolChange} />
                            <label htmlFor={`ssh-${serverInfo.id}`} className="protocol-label">💻 SSH</label>
                        </div>
                    </div>
                </div>

                {/* Campos do formulário (Nome, IP, etc.) */}
                {/* Nome */}
                <div className="form-row">
                    <label htmlFor={`name-${serverInfo.id}`} className="form-label">🏷️ Nome *</label>
                    <input type="text" id={`name-${serverInfo.id}`} name="name" value={serverData.name} onChange={handleInputChange} className={`form-input ${errors.name ? 'error' : ''}`} required />
                    {errors.name && <div className="input-info"><span className="error-message">{errors.name}</span></div>}
                </div>
                {/* IP/Hostname */}
                <div className="form-row">
                    <label htmlFor={`ip-${serverInfo.id}`} className="form-label">🌐 IP ou Hostname *</label>
                    <input type="text" id={`ip-${serverInfo.id}`} name="ipAddress" value={serverData.ipAddress} onChange={handleInputChange} className={`form-input ${errors.ipAddress ? 'error' : ''}`} required />
                    {errors.ipAddress && <div className="input-info"><span className="error-message">{errors.ipAddress}</span></div>}
                </div>
                {/* Usuário */}
                <div className="form-row">
                    <label htmlFor={`username-${serverInfo.id}`} className="form-label">👤 Usuário {serverData.protocol === 'ssh' ? '*' : ''}</label>
                    <input type="text" id={`username-${serverInfo.id}`} name="username" value={serverData.username} onChange={handleInputChange} className={`form-input ${errors.username ? 'error' : ''}`} required={serverData.protocol === 'ssh'} />
                    {errors.username && <div className="input-info"><span className="error-message">{errors.username}</span></div>}
                </div>
                {/* Senha */}
                <div className="form-row">
                    <label htmlFor={`password-${serverInfo.id}`} className="form-label">🔑 Nova Senha</label>
                    <input type="password" id={`password-${serverInfo.id}`} name="password" value={serverData.password} onChange={handleInputChange} placeholder="Deixe em branco para não alterar" className="form-input" />
                </div>
                {/* Domínio (RDP) */}
                {serverData.protocol === 'rdp' && (
                    <div className="form-row">
                        <label htmlFor={`domain-${serverInfo.id}`} className="form-label">🏢 Domínio</label>
                        <input type="text" id={`domain-${serverInfo.id}`} name="domain" value={serverData.domain} onChange={handleInputChange} className="form-input" />
                    </div>
                )}
                {/* Porta (SSH) */}
                {serverData.protocol === 'ssh' && (
                    <div className="form-row">
                        <label htmlFor={`port-${serverInfo.id}`} className="form-label">🔌 Porta</label>
                        <input type="number" id={`port-${serverInfo.id}`} name="port" value={serverData.port} onChange={handleInputChange} placeholder="22" className="form-input" />
                    </div>
                )}

                {/* Ações */}
                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="btn-cancel">❌ Cancelar</button>
                    <button type="submit" className="btn-submit">✅ Salvar Alterações</button>
                </div>
            </form>
        </div>
    );
}

export default EditServerForm;