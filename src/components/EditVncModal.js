// src/components/EditVncModal.js (v5.0: Estrutura de Modal Premium)

import React, { useState } from 'react';
import {
    ComputerIcon,
    SettingsEthernetIcon,
    LockIcon,
    VisibilityIcon,
    SaveIcon,
    CancelIcon,
    CloseIcon,
    FolderIcon,
    InfoIcon
} from './MuiIcons';
import './Modal.css';
import './ServerForms.css';

function EditVncModal({ connection, groupId, groups, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        name: connection.name || '',
        ipAddress: connection.ipAddress || '',
        port: connection.port || 5900,
        password: '',
        viewOnly: connection.viewOnly || false
    });

    const [selectedGroupId, setSelectedGroupId] = useState(groupId);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!formData.ipAddress.trim()) newErrors.ipAddress = 'IP/Hostname é obrigatório';
        if (!formData.port) newErrors.port = 'Porta é obrigatória';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const dataToSave = {
            ...formData,
            id: connection.id
        };

        if (!dataToSave.password) {
            delete dataToSave.password;
        }

        const newGroupId = selectedGroupId !== groupId ? selectedGroupId : null;
        onSave(groupId, dataToSave, newGroupId);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
                {/* Header Padrão */}
                <div className="modal-header">
                    <h3 className="modal-title">Editar Conexão VNC</h3>
                    <button className="modal-close-btn" onClick={onCancel} title="Fechar (ESC)">
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    <form onSubmit={handleSubmit} id="edit-vnc-form">
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
                                {selectedGroupId !== groupId && (
                                    <div className="group-change-warning">
                                        <InfoIcon sx={{ fontSize: 14 }} />
                                        <span>Conexão será movida para outro grupo</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Nome */}
                        <div className="form-group">
                            <label className="form-label">Nome *</label>
                            <div className="input-with-icon">
                                <ComputerIcon className="input-icon" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`form-control ${errors.name ? 'error' : ''}`}
                                    placeholder="Nome da conexão"
                                    autoFocus
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
                                    value={formData.ipAddress}
                                    onChange={handleInputChange}
                                    className={`form-control ${errors.ipAddress ? 'error' : ''}`}
                                    placeholder="192.168.1.100"
                                />
                            </div>
                            {errors.ipAddress && <span className="error-text">{errors.ipAddress}</span>}
                        </div>

                        {/* Porta e Senha */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Porta *</label>
                                <div className="input-with-icon">
                                    <SettingsEthernetIcon className="input-icon" />
                                    <input
                                        type="number"
                                        name="port"
                                        value={formData.port}
                                        onChange={handleInputChange}
                                        className={`form-control ${errors.port ? 'error' : ''}`}
                                        placeholder="5900"
                                    />
                                </div>
                                {errors.port && <span className="error-text">{errors.port}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Nova Senha</label>
                                <div className="input-with-icon">
                                    <LockIcon className="input-icon" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="Deixe em branco para manter"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* View Only Checkbox */}
                        <div className="form-group">
                            <label className={`form-checkbox-wrapper ${formData.viewOnly ? 'checked' : ''}`}>
                                <input
                                    type="checkbox"
                                    name="viewOnly"
                                    checked={formData.viewOnly}
                                    onChange={handleInputChange}
                                    className="form-checkbox"
                                />
                                <div className="checkbox-label-content">
                                    <VisibilityIcon sx={{ fontSize: 18 }} />
                                    <span>Modo Apenas Visualização</span>
                                </div>
                            </label>
                        </div>
                    </form>
                </div>

                {/* Footer/Actions Padrão */}
                <div className="modal-actions">
                    <button type="button" onClick={onCancel} className="btn btn--secondary">
                        <CancelIcon sx={{ fontSize: 18 }} />
                        Cancelar
                    </button>
                    <button type="submit" form="edit-vnc-form" className="btn btn--primary">
                        <SaveIcon sx={{ fontSize: 18 }} />
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditVncModal;
