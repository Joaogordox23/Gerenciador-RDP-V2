// src/components/AddVncConnectionForm.js (VERSÃO COM UX CORRIGIDA)
import React, { useState } from 'react';

function AddVncConnectionForm({ onAddConnection, onCancel }) {
    const [connectionData, setConnectionData] = useState({ name: '', ipAddress: '', port: '5900', password: '', viewOnly: false });

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        const newValue = type === 'checkbox' ? checked : value;
        setConnectionData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        // Adicionar validação aqui se necessário
        onAddConnection(connectionData);
    };

    return (
        <div className="add-group-form-container">
            <div className="add-group-form-header">
                <h3 className="add-group-form-title">📺 Nova Conexão VNC</h3>
                <p className="add-group-form-subtitle">Preencha os dados para a nova conexão VNC</p>
            </div>
            <form onSubmit={handleSubmit} className="add-group-form" style={{padding: 'var(--space-24)'}}>
                <div className="form-row">
                    <label className="form-label">Nome da Conexão</label>
                    <input type="text" name="name" value={connectionData.name} onChange={handleInputChange} placeholder="Ex: Servidor Principal" className="form-input" autoFocus />
                </div>
                <div className="form-row">
                    <label className="form-label">IP ou Hostname</label>
                    <input type="text" name="ipAddress" value={connectionData.ipAddress} onChange={handleInputChange} placeholder="Ex: 192.168.1.100" className="form-input" />
                </div>
                <div className="form-row">
                    <label className="form-label">Porta</label>
                    <input type="number" name="port" value={connectionData.port} onChange={handleInputChange} placeholder="Padrão: 5900" className="form-input" />
                </div>
                <div className="form-row">
                    <label className="form-label">Senha (opcional)</label>
                    <input type="password" name="password" value={connectionData.password} onChange={handleInputChange} placeholder="Máximo 8 caracteres" className="form-input" />
                </div>
                <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" id="viewOnlyCheckbox" name="viewOnly" checked={connectionData.viewOnly} onChange={handleInputChange} />
                    <label htmlFor="viewOnlyCheckbox">Modo Apenas Visualização</label>
                </div>
                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="btn-cancel">Cancelar</button>
                    <button type="submit" className="btn-submit">Adicionar Conexão</button>
                </div>
            </form>
        </div>
    );
}

export default AddVncConnectionForm;