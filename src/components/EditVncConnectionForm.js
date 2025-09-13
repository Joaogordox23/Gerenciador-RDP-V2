import React, { useState } from 'react';

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
            <form onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
                <div className="form-grid">
                    <div className="form-row">
                        <label className="form-label">Nome *</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`form-input ${errors.name ? 'error' : ''}`} autoFocus />
                    </div>
                    <div className="form-row">
                        <label className="form-label">IP/Hostname *</label>
                        <input type="text" name="ipAddress" value={formData.ipAddress} onChange={handleInputChange} className={`form-input ${errors.ipAddress ? 'error' : ''}`} />
                    </div>
                    <div className="form-row">
                        <label className="form-label">Porta *</label>
                        <input type="number" name="port" value={formData.port} onChange={handleInputChange} className={`form-input ${errors.port ? 'error' : ''}`} />
                    </div>
                    <div className="form-row">
                        <label className="form-label">Nova Senha</label>
                        <input type="password" name="password" onChange={handleInputChange} className="form-input" placeholder="Deixe em branco para não alterar" />
                    </div>
                    <div className="form-row" style={{ alignSelf: 'center' }}>
                         <div className="protocol-option">
                            <input type="checkbox" id={`vnc-viewonly-edit-${formData.id}`} name="viewOnly" checked={formData.viewOnly} onChange={handleInputChange} />
                            <label htmlFor={`vnc-viewonly-edit-${formData.id}`} className="protocol-label">
                                Apenas Visualização
                            </label>
                        </div>
                    </div>
                </div>
                <div className="form-actions" style={{ marginTop: '16px' }}>
                    <button type="button" onClick={onCancel} className="btn-cancel">Cancelar</button>
                    <button type="submit" className="btn-submit">Salvar</button>
                </div>
            </form>
        </div>
    );
}

export default EditVncConnectionForm;
