// src/components/AddVncConnectionForm.js - Formulário para adicionar conexões VNC

import React, { useState } from 'react';

function AddVncConnectionForm({ onAddConnection, onCancel }) {
    // Estado inicial com os campos específicos para VNC
    const [connectionData, setConnectionData] = useState({
        name: '',
        ipAddress: '',
        port: '7007', // Porta padrão do VNC
        password: '',
        viewOnly: false // Modo Apenas Visualização
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!connectionData.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        }
        if (!connectionData.ipAddress.trim()) {
            newErrors.ipAddress = 'IP/Hostname é obrigatório';
        }
        if (!connectionData.port) {
            newErrors.port = 'Porta é obrigatória';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        setConnectionData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!validateForm()) return;

        const finalConnectionData = {
            ...connectionData,
            id: Date.now(),
            protocol: 'vnc' // Adiciona o protocolo para identificação futura
        };

        onAddConnection(finalConnectionData);
    };

    // Usaremos as mesmas classes CSS dos outros formulários para consistência
    return (
        <div className="add-server-form-container">
            <div className="form-header">
                <h3>🖥️ Adicionar Nova Conexão VNC</h3>
                <p className="form-subtitle">Preencha os dados para a nova conexão VNC</p>
            </div>

            <form className="add-server-form" onSubmit={handleSubmit}>
                {/* Nome da Conexão */}
                <div className="form-row">
                    <label htmlFor="vnc-name" className="form-label">🏷️ Nome da Conexão *</label>
                    <input
                        type="text"
                        id="vnc-name"
                        name="name"
                        value={connectionData.name}
                        onChange={handleInputChange}
                        placeholder="Ex: Computador da Sala"
                        className={`form-input ${errors.name ? 'error' : ''}`}
                        required
                        autoFocus
                    />
                </div>

                {/* IP/Hostname */}
                <div className="form-row">
                    <label htmlFor="vnc-ip" className="form-label">🌐 IP ou Hostname *</label>
                    <input
                        type="text"
                        id="vnc-ip"
                        name="ipAddress"
                        value={connectionData.ipAddress}
                        onChange={handleInputChange}
                        placeholder="Ex: 192.168.1.50"
                        className={`form-input ${errors.ipAddress ? 'error' : ''}`}
                        required
                    />
                </div>

                {/* Porta */}
                <div className="form-row">
                    <label htmlFor="vnc-port" className="form-label">🔌 Porta *</label>
                    <input
                        type="number"
                        id="vnc-port"
                        name="port"
                        value={connectionData.port}
                        onChange={handleInputChange}
                        placeholder="5900"
                        className={`form-input ${errors.port ? 'error' : ''}`}
                        required
                    />
                </div>

                {/* Senha */}
                <div className="form-row">
                    <label htmlFor="vnc-password" className="form-label">🔑 Senha</label>
                    <input
                        type="password"
                        id="vnc-password"
                        name="password"
                        value={connectionData.password}
                        onChange={handleInputChange}
                        placeholder="Senha de acesso VNC"
                        className="form-input"
                    />
                </div>
                
                {/* Modo Apenas Visualização */}
                <div className="form-row">
                    <div className="protocol-selector" style={{ justifyContent: 'flex-start' }}>
                         <div className="protocol-option">
                             <input
                                type="checkbox"
                                id="vnc-viewonly"
                                name="viewOnly"
                                checked={connectionData.viewOnly}
                                onChange={handleInputChange}
                            />
                            <label htmlFor="vnc-viewonly" className="protocol-label" style={{ paddingLeft: '8px' }}>
                                👁️ Conectar em modo "Apenas Visualização"
                            </label>
                        </div>
                    </div>
                </div>

                {/* Ações do formulário */}
                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="btn-cancel">
                        ❌ Cancelar
                    </button>
                    <button type="submit" className="btn-submit">
                        ✅ Adicionar Conexão
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddVncConnectionForm;
