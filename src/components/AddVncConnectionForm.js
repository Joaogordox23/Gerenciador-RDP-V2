// src/components/AddVncConnectionForm.js
import React, { useState } from 'react';
import {
    ComputerIcon,
    SettingsEthernetIcon,
    LockIcon,
    VisibilityIcon,
    SaveIcon,
    CancelIcon
} from './MuiIcons';

function AddVncConnectionForm({ onAddConnection, onCancel }) {
    const [connectionData, setConnectionData] = useState({ name: '', ipAddress: '', port: '5900', password: '', viewOnly: false });

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        const newValue = type === 'checkbox' ? checked : value;
        setConnectionData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onAddConnection(connectionData);
    };

    return (
        <div className="add-server-form-container">
            <form onSubmit={handleSubmit} className="add-server-form">
                <div className="form-group">
                    <label>Nome da Conexão</label>
                    <div className="input-with-icon">
                        <ComputerIcon className="input-icon" />
                        <input
                            type="text"
                            name="name"
                            value={connectionData.name}
                            onChange={handleInputChange}
                            placeholder="Ex: Servidor Principal"
                            className="form-control"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>IP ou Hostname</label>
                    <div className="input-with-icon">
                        <SettingsEthernetIcon className="input-icon" />
                        <input
                            type="text"
                            name="ipAddress"
                            value={connectionData.ipAddress}
                            onChange={handleInputChange}
                            placeholder="Ex: 192.168.1.100"
                            className="form-control"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Porta</label>
                        <div className="input-with-icon">
                            <SettingsEthernetIcon className="input-icon" />
                            <input
                                type="number"
                                name="port"
                                value={connectionData.port}
                                onChange={handleInputChange}
                                placeholder="Padrão: 5900"
                                className="form-control"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Senha (opcional)</label>
                        <div className="input-with-icon">
                            <LockIcon className="input-icon" />
                            <input
                                type="password"
                                name="password"
                                value={connectionData.password}
                                onChange={handleInputChange}
                                placeholder="Máximo 8 caracteres"
                                className="form-control"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="viewOnly"
                            checked={connectionData.viewOnly}
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
                    <button type="button" onClick={onCancel} className="btn btn-secondary">
                        <CancelIcon sx={{ fontSize: 18, marginRight: '8px' }} />
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                        <SaveIcon sx={{ fontSize: 18, marginRight: '8px' }} />
                        Adicionar
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddVncConnectionForm;