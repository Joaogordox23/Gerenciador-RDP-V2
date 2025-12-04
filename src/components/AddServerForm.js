import React, { useState } from 'react';
import {
    ComputerIcon,
    TerminalIcon,
    PersonOutlineIcon,
    LockIcon,
    DomainIcon,
    SettingsEthernetIcon,
    SaveIcon,
    CancelIcon
} from './MuiIcons';

function AddServerForm({ onAddServer, onCancel }) {
    const [serverData, setServerData] = useState({
        protocol: 'rdp',
        name: '',
        ipAddress: '',
        username: '',
        password: '',
        domain: '',
        port: ''
    });
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!serverData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!serverData.ipAddress.trim()) newErrors.ipAddress = 'IP/Hostname é obrigatório';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setServerData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!validate()) return;
        onAddServer(serverData);
    };

    return (
        <div className="add-server-form-container">
            <form onSubmit={handleSubmit} className="add-server-form">
                <div className="form-group">
                    <label className="form-label">Protocolo</label>
                    <div className="form-radio-group">
                        <label className={`form-radio-card ${serverData.protocol === 'rdp' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="protocol"
                                value="rdp"
                                checked={serverData.protocol === 'rdp'}
                                onChange={handleInputChange}
                            />
                            <div className="radio-content">
                                <span className="radio-label">RDP</span>
                                <span className="radio-description">Remote Desktop Protocol</span>
                            </div>
                            <ComputerIcon sx={{ fontSize: 20, color: serverData.protocol === 'rdp' ? 'var(--color-primary)' : 'var(--color-text-secondary)', marginLeft: 'auto' }} />
                        </label>
                        <label className={`form-radio-card ${serverData.protocol === 'ssh' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="protocol"
                                value="ssh"
                                checked={serverData.protocol === 'ssh'}
                                onChange={handleInputChange}
                            />
                            <div className="radio-content">
                                <span className="radio-label">SSH</span>
                                <span className="radio-description">Secure Shell</span>
                            </div>
                            <TerminalIcon sx={{ fontSize: 20, color: serverData.protocol === 'ssh' ? 'var(--color-primary)' : 'var(--color-text-secondary)', marginLeft: 'auto' }} />
                        </label>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Nome *</label>
                    <div className="input-with-icon">
                        <ComputerIcon className="input-icon" />
                        <input
                            type="text"
                            name="name"
                            value={serverData.name}
                            onChange={handleInputChange}
                            className={`form-control ${errors.name ? 'error' : ''}`}
                            autoFocus
                            placeholder="Ex: Servidor Financeiro"
                        />
                    </div>
                    {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                    <label className="form-label">IP/Hostname *</label>
                    <div className="input-with-icon">
                        <SettingsEthernetIcon className="input-icon" />
                        <input
                            type="text"
                            name="ipAddress"
                            value={serverData.ipAddress}
                            onChange={handleInputChange}
                            className={`form-control ${errors.ipAddress ? 'error' : ''}`}
                            placeholder="Ex: 192.168.1.100 ou srv-fin.local"
                        />
                    </div>
                    {errors.ipAddress && <span className="error-text">{errors.ipAddress}</span>}
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                        <label className="form-label">Usuário</label>
                        <div className="input-with-icon">
                            <PersonOutlineIcon className="input-icon" />
                            <input
                                type="text"
                                name="username"
                                value={serverData.username}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="Ex: admin"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Senha</label>
                        <div className="input-with-icon">
                            <LockIcon className="input-icon" />
                            <input
                                type="password"
                                name="password"
                                value={serverData.password}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="Opcional"
                            />
                        </div>
                    </div>
                </div>

                {serverData.protocol === 'rdp' && (
                    <div className="form-group">
                        <label className="form-label">Domínio</label>
                        <div className="input-with-icon">
                            <DomainIcon className="input-icon" />
                            <input
                                type="text"
                                name="domain"
                                value={serverData.domain}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="Ex: EMPRESA (Opcional)"
                            />
                        </div>
                    </div>
                )}

                {serverData.protocol === 'ssh' && (
                    <div className="form-group">
                        <label className="form-label">Porta</label>
                        <div className="input-with-icon">
                            <SettingsEthernetIcon className="input-icon" />
                            <input
                                type="text"
                                name="port"
                                value={serverData.port}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="Padrão: 22"
                            />
                        </div>
                    </div>
                )}

                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="btn btn-secondary">
                        <CancelIcon sx={{ fontSize: 18 }} />
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                        <SaveIcon sx={{ fontSize: 18 }} />
                        Salvar
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddServerForm;
