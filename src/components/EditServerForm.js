// src/components/EditServerForm.js
import React, { useState } from 'react';
import {
    ComputerIcon,
    TerminalIcon,
    SettingsEthernetIcon,
    PersonOutlineIcon,
    LockIcon,
    DomainIcon,
    SaveIcon,
    CancelIcon,
    InfoIcon
} from './MuiIcons';
import './ServerForms.css';

import PasswordStrengthIndicator from './PasswordStrengthValidator';

function EditServerForm({ serverInfo, onSave, onCancel }) {
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
            delete finalData.password;
        }

        onSave(finalData);
    };

    return (
        <div className="server-edit-form-inline" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="server-edit-form">
                <div className="form-header">
                    <h3>Editar Servidor</h3>
                </div>

                <div className="form-group">
                    <label>Protocolo</label>
                    <div className="protocol-selector">
                        <label className={`protocol-option ${serverData.protocol === 'rdp' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="protocol"
                                value="rdp"
                                checked={serverData.protocol === 'rdp'}
                                onChange={handleProtocolChange}
                                className="sr-only"
                            />
                            <div className="protocol-content">
                                <ComputerIcon className="protocol-icon" />
                                <span>RDP</span>
                            </div>
                        </label>
                        <label className={`protocol-option ${serverData.protocol === 'ssh' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="protocol"
                                value="ssh"
                                checked={serverData.protocol === 'ssh'}
                                onChange={handleProtocolChange}
                                className="sr-only"
                            />
                            <div className="protocol-content">
                                <TerminalIcon className="protocol-icon" />
                                <span>SSH</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="form-group">
                    <label>Nome *</label>
                    <div className="input-with-icon">
                        <ComputerIcon className="input-icon" />
                        <input
                            type="text"
                            name="name"
                            value={serverData.name}
                            onChange={handleInputChange}
                            className={`form-control ${errors.name ? 'error' : ''}`}
                            placeholder="Ex: Servidor Principal"
                            autoFocus
                        />
                    </div>
                    {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                    <label>IP ou Hostname *</label>
                    <div className="input-with-icon">
                        <SettingsEthernetIcon className="input-icon" />
                        <input
                            type="text"
                            name="ipAddress"
                            value={serverData.ipAddress}
                            onChange={handleInputChange}
                            className={`form-control ${errors.ipAddress ? 'error' : ''}`}
                            placeholder="Ex: 192.168.1.100"
                        />
                    </div>
                    {errors.ipAddress && <span className="error-text">{errors.ipAddress}</span>}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Usuário {serverData.protocol === 'ssh' ? '*' : ''}</label>
                        <div className="input-with-icon">
                            <PersonOutlineIcon className="input-icon" />
                            <input
                                type="text"
                                name="username"
                                value={serverData.username}
                                onChange={handleInputChange}
                                className={`form-control ${errors.username ? 'error' : ''}`}
                                placeholder="Usuário"
                            />
                        </div>
                        {errors.username && <span className="error-text">{errors.username}</span>}
                    </div>
                    <div className="form-group">
                        <label>Nova Senha</label>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: '6px',
                            marginBottom: '8px',
                            fontSize: '12px',
                            color: '#3B82F6'
                        }}>
                            <InfoIcon sx={{ fontSize: 16 }} />
                            <span>💡 Deixe em branco para manter a senha atual</span>
                        </div>
                        <div className="input-with-icon">
                            <LockIcon className="input-icon" />
                            <input
                                type="password"
                                name="password"
                                value={serverData.password}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="Digite nova senha ou deixe vazio"
                            />
                        </div>
                        <PasswordStrengthIndicator password={serverData.password} />
                    </div>
                </div>

                {serverData.protocol === 'rdp' && (
                    <div className="form-group">
                        <label>Domínio</label>
                        <div className="input-with-icon">
                            <DomainIcon className="input-icon" />
                            <input
                                type="text"
                                name="domain"
                                value={serverData.domain}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="Ex: EMPRESA"
                            />
                        </div>
                    </div>
                )}

                {serverData.protocol === 'ssh' && (
                    <div className="form-group">
                        <label>Porta</label>
                        <div className="input-with-icon">
                            <SettingsEthernetIcon className="input-icon" />
                            <input
                                type="number"
                                name="port"
                                value={serverData.port}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="22"
                            />
                        </div>
                    </div>
                )}

                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="btn btn--secondary">
                        <CancelIcon sx={{ fontSize: 18, marginRight: '8px' }} />
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn--primary">
                        <SaveIcon sx={{ fontSize: 18, marginRight: '8px' }} />
                        Salvar
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditServerForm;