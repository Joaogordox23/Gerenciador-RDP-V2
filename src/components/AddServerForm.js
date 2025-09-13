import React, { useState } from 'react';

// A propriedade foi corrigida de onServerAdded para onAddServer
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
        
        // A função chamada aqui agora corresponde ao que o App.js espera
        onAddServer(serverData);
    };

    return (
        <div className="add-server-form-container">
            <div className="form-header">
                <h3>Adicionar Novo Servidor</h3>
                <p className="form-subtitle">Preencha os detalhes do servidor RDP ou SSH.</p>
            </div>
            <form onSubmit={handleSubmit} className="add-server-form">
                <div className="form-row">
                    <label className="form-label">Protocolo</label>
                    <div className="protocol-selector">
                        {/* ... (o resto do formulário permanece o mesmo) ... */}
                        <div className="protocol-option">
                            <input type="radio" id="rdp" name="protocol" value="rdp" checked={serverData.protocol === 'rdp'} onChange={handleInputChange} />
                            <label htmlFor="rdp" className="protocol-label">🖥️ RDP</label>
                        </div>
                        <div className="protocol-option">
                            <input type="radio" id="ssh" name="protocol" value="ssh" checked={serverData.protocol === 'ssh'} onChange={handleInputChange} />
                            <label htmlFor="ssh" className="protocol-label">💻 SSH</label>
                        </div>
                    </div>
                </div>
                <div className="form-row">
                    <label className="form-label">Nome *</label>
                    <input type="text" name="name" value={serverData.name} onChange={handleInputChange} className={`form-input ${errors.name ? 'error' : ''}`} autoFocus />
                </div>
                <div className="form-row">
                    <label className="form-label">IP/Hostname *</label>
                    <input type="text" name="ipAddress" value={serverData.ipAddress} onChange={handleInputChange} className={`form-input ${errors.ipAddress ? 'error' : ''}`} />
                </div>
                <div className="form-row">
                    <label className="form-label">Usuário</label>
                    <input type="text" name="username" value={serverData.username} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-row">
                    <label className="form-label">Senha</label>
                    <input type="password" name="password" value={serverData.password} onChange={handleInputChange} className="form-input" />
                </div>
                {serverData.protocol === 'rdp' && (
                    <div className="form-row">
                        <label className="form-label">Domínio</label>
                        <input type="text" name="domain" value={serverData.domain} onChange={handleInputChange} className="form-input" />
                    </div>
                )}
                {serverData.protocol === 'ssh' && (
                     <div className="form-row">
                        <label className="form-label">Porta</label>
                        <input type="text" name="port" value={serverData.port} onChange={handleInputChange} className="form-input" placeholder="Padrão: 22" />
                    </div>
                )}
                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="btn-cancel">Cancelar</button>
                    <button type="submit" className="btn-submit">Adicionar Servidor</button>
                </div>
            </form>
        </div>
    );
}

export default AddServerForm;
