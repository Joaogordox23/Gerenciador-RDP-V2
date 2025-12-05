/**
 * GuacamoleTestView.js
 * View para testar conexões Guacamole (RDP/VNC/SSH)
 */

import React, { useState } from 'react';
import RemoteDesktopViewer from '../components/RemoteDesktopViewer';
import './GuacamoleTestView.css';

function GuacamoleTestView() {
    const [connectionInfo, setConnectionInfo] = useState(null);
    const [formData, setFormData] = useState({
        protocol: 'vnc',
        name: 'Teste Guacamole',
        ipAddress: '',
        port: '',
        username: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Atualiza porta padrão baseado no protocolo
        if (name === 'protocol') {
            const defaultPorts = { rdp: '3389', vnc: '5900', ssh: '22' };
            setFormData(prev => ({ ...prev, port: defaultPorts[value] || '' }));
        }
    };

    const handleConnect = (e) => {
        e.preventDefault();
        console.log('🔌 Conectando via Guacamole:', formData);
        setConnectionInfo({ ...formData });
    };

    const handleDisconnect = () => {
        setConnectionInfo(null);
    };

    return (
        <div className="guacamole-test-view">
            <h2>🥑 Teste Guacamole</h2>

            {!connectionInfo ? (
                <form className="connection-form" onSubmit={handleConnect}>
                    <div className="form-group">
                        <label>Protocolo</label>
                        <select name="protocol" value={formData.protocol} onChange={handleChange}>
                            <option value="vnc">VNC</option>
                            <option value="rdp">RDP</option>
                            <option value="ssh">SSH</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>IP/Hostname</label>
                        <input
                            type="text"
                            name="ipAddress"
                            value={formData.ipAddress}
                            onChange={handleChange}
                            placeholder="192.168.1.100"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Porta</label>
                        <input
                            type="text"
                            name="port"
                            value={formData.port}
                            onChange={handleChange}
                            placeholder="5900"
                        />
                    </div>

                    {formData.protocol !== 'vnc' && (
                        <div className="form-group">
                            <label>Usuário</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Senha</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <button type="submit" className="btn-connect">
                        🔌 Conectar
                    </button>
                </form>
            ) : (
                <div className="viewer-container">
                    <RemoteDesktopViewer
                        connectionInfo={connectionInfo}
                        onDisconnect={handleDisconnect}
                        fullscreen={false}
                    />
                </div>
            )}
        </div>
    );
}

export default GuacamoleTestView;
