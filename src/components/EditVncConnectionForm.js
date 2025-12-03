import React, { useState } from 'react';
import {
    ComputerIcon,
    SettingsEthernetIcon,
    LockIcon,
    VisibilityIcon,
    SaveIcon,
    CancelIcon
} from './MuiIcons';

function EditVncConnectionForm({ connectionInfo, onSave, onCancel }) {
    const [formData, setFormData] = useState({ ...connectionInfo });
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

    const handleSubmit = (event) => {
        event.preventDefault();
        if (validateForm()) {
            // Remove a senha do objeto se estiver vazia para não sobrescrever
            const dataToSave = { ...formData };
            if (!dataToSave.password) {
                delete dataToSave.password;
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

                <div className="form-group">
                    <label>Nome *</label>
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
                    <label>IP/Hostname *</label>
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

                <div className="form-row">
                    <div className="form-group">
                        <label>Porta *</label>
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
                        <label>Nova Senha</label>
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

                <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="viewOnly"
                            checked={formData.viewOnly}
                            onChange={handleInputChange}
                        />
                        <span className="checkbox-custom"></span>
                        <div className="checkbox-text">
                            <VisibilityIcon sx={{ fontSize: 18, marginRight: 0.5, verticalAlign: 'middle' }} />
                            Modo Apenas Visualização
                        </div>
                    </label>
                </div>

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

export default EditVncConnectionForm;
