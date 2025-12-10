// src/components/EditVncConnectionForm.js (v4.2: Com seleção de grupo)
import React, { useState } from 'react';
import {
    ComputerIcon,
    SettingsEthernetIcon,
    LockIcon,
    VisibilityIcon,
    SaveIcon,
    CancelIcon,
    FolderIcon,
    InfoIcon
} from './MuiIcons';
import './VncForms.css';

function EditVncConnectionForm({ connectionInfo, onSave, onCancel, groups, currentGroupId }) {
    const [formData, setFormData] = useState({ ...connectionInfo });
    const [selectedGroupId, setSelectedGroupId] = useState(currentGroupId);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!formData.ipAddress.trim()) newErrors.ipAddress = 'IP/Hostname é obrigatório';
        if (!formData.port) newErrors.port = 'Porta é obrigatória';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleGroupChange = (event) => {
        setSelectedGroupId(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (validateForm()) {
            // Remove a senha do objeto se estiver vazia para não sobrescrever
            const dataToSave = { ...formData };
            if (!dataToSave.password) {
                delete dataToSave.password;
            }

            // Adiciona o novo groupId se foi alterado
            if (selectedGroupId !== currentGroupId) {
                dataToSave.newGroupId = selectedGroupId;
            }

            onSave(dataToSave);
        }
    };

    return (
        <div className="server-edit-form-inline">
            <form onSubmit={handleSubmit} onClick={e => e.stopPropagation()} className="server-edit-form">
                <div className="form-header">
                    <h3>Editando Conexão VNC</h3>
                </div>

                {/* Seleção de Grupo */}
                {groups && groups.length > 1 && (
                    <div className="form-group">
                        <label className="form-label">Grupo</label>
                        <div className="input-with-icon">
                            <FolderIcon className="input-icon" />
                            <select
                                name="groupId"
                                value={selectedGroupId}
                                onChange={handleGroupChange}
                                className="form-control form-select"
                            >
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.groupName}</option>
                                ))}
                            </select>
                        </div>
                        {selectedGroupId !== currentGroupId && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                borderRadius: '6px',
                                marginTop: '8px',
                                fontSize: '12px',
                                color: '#F59E0B'
                            }}>
                                <InfoIcon sx={{ fontSize: 16 }} />
                                <span>⚠️ Conexão será movida para outro grupo</span>
                            </div>
                        )}
                    </div>
                )}

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
                            autoFocus
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
                            value={formData.ipAddress}
                            onChange={handleInputChange}
                            className={`form-control ${errors.ipAddress ? 'error' : ''}`}
                        />
                    </div>
                    {errors.ipAddress && <span className="error-text">{errors.ipAddress}</span>}
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nova Senha</label>
                        <div className="input-with-icon">
                            <LockIcon className="input-icon" />
                            <input
                                type="password"
                                name="password"
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="Deixe em branco para manter"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label className={`form-checkbox-wrapper ${formData.viewOnly ? 'checked' : ''}`}>
                        <input
                            type="checkbox"
                            name="viewOnly"
                            checked={formData.viewOnly}
                            onChange={handleInputChange}
                            className="form-checkbox"
                        />
                        <div className="checkbox-label-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <VisibilityIcon sx={{ fontSize: 18 }} />
                            Modo Apenas Visualização
                        </div>
                    </label>
                </div>

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

export default EditVncConnectionForm;
