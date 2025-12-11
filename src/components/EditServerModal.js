// src/components/EditServerModal.js (v5.0: Estrutura de Modal Premium)

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
    CloseIcon,
    InfoIcon,
    FolderIcon
} from './MuiIcons';
import PasswordStrengthIndicator from './PasswordStrengthValidator';
import './Modal.css';

function EditServerModal({ server, groupId, groups, onSave, onCancel }) {
    const [serverData, setServerData] = useState({
        protocol: server.protocol || 'rdp',
        name: server.name || '',
        ipAddress: server.ipAddress || '',
        username: server.username || '',
        password: '',
        domain: server.domain || '',
        port: server.port || ''
    });

    const [selectedGroupId, setSelectedGroupId] = useState(groupId);
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setServerData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleProtocolChange = (protocol) => {
        setServerData(prev => ({
            ...prev,
            protocol,
            port: protocol === 'ssh' ? (prev.port || '22') : '',
            domain: protocol === 'rdp' ? prev.domain : ''
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const finalData = {
            ...serverData,
            id: server.id
        };

        if (!finalData.password) {
            delete finalData.password;
        }

        const newGroupId = selectedGroupId !== groupId ? selectedGroupId : null;
        onSave(groupId, finalData, newGroupId);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                {/* Header Padrão */}
                <div className="modal-header">
                    <h3 className="modal-title">Editar Servidor</h3>
                    <button className="modal-close-btn" onClick={onCancel} title="Fechar (ESC)">
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    <form onSubmit={handleSubmit} id="edit-server-form">
                        {/* Seleção de Grupo */}
                        {groups && groups.length > 1 && (
                            <div className="form-group">
                                <label className="form-label">Grupo</label>
                                <div className="input-with-icon">
                                    <FolderIcon className="input-icon" />
                                    <select
                                        value={selectedGroupId}
                                        onChange={(e) => setSelectedGroupId(e.target.value)}
                                        className="form-control form-select"
                                    >
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id}>
                                                {g.groupName || g.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Protocolo */}
                        <div className="form-group">
                            <label className="form-label">Protocolo</label>
                            <div className="protocol-toggle-container">
                                <button
                                    type="button"
                                    className={`protocol-toggle-btn ${serverData.protocol === 'rdp' ? 'active' : ''}`}
                                    onClick={() => handleProtocolChange('rdp')}
                                >
                                    <ComputerIcon sx={{ fontSize: 18 }} />
                                    <span>RDP</span>
                                </button>
                                <button
                                    type="button"
                                    className={`protocol-toggle-btn ${serverData.protocol === 'ssh' ? 'active' : ''}`}
                                    onClick={() => handleProtocolChange('ssh')}
                                >
                                    <TerminalIcon sx={{ fontSize: 18 }} />
                                    <span>SSH</span>
                                </button>
                            </div>
                        </div>

                        {/* Nome */}
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
                                    placeholder="Nome do servidor"
                                />
                            </div>
                            {errors.name && <span className="error-text">{errors.name}</span>}
                        </div>

                        {/* IP/Hostname */}
                        <div className="form-group">
                            <label className="form-label">IP ou Hostname *</label>
                            <div className="input-with-icon">
                                <SettingsEthernetIcon className="input-icon" />
                                <input
                                    type="text"
                                    name="ipAddress"
                                    value={serverData.ipAddress}
                                    onChange={handleInputChange}
                                    className={`form-control ${errors.ipAddress ? 'error' : ''}`}
                                    placeholder="192.168.1.100"
                                />
                            </div>
                            {errors.ipAddress && <span className="error-text">{errors.ipAddress}</span>}
                        </div>

                        {/* Usuário e Senha */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    Usuário {serverData.protocol === 'ssh' ? '*' : ''}
                                </label>
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
                                <label className="form-label">Nova Senha</label>
                                <div className="password-hint">
                                    <InfoIcon sx={{ fontSize: 14 }} />
                                    <span>Deixe em branco para manter a senha atual</span>
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

                        {/* Porta (SSH) */}
                        {serverData.protocol === 'ssh' && (
                            <div className="form-group">
                                <label className="form-label">Porta</label>
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

                        {/* Domínio (RDP) */}
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
                                        placeholder="Ex: EMPRESA"
                                    />
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer/Actions Padrão */}
                <div className="modal-actions">
                    <button type="button" onClick={onCancel} className="btn btn--secondary">
                        <CancelIcon sx={{ fontSize: 18 }} />
                        Cancelar
                    </button>
                    <button type="submit" form="edit-server-form" className="btn btn--primary">
                        <SaveIcon sx={{ fontSize: 18 }} />
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditServerModal;
