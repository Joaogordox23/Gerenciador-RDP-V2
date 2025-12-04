import React, { useState, useMemo } from 'react';
import {
    LockIcon,
    PersonOutlineIcon,
    DomainIcon,
    SearchIcon,
    SaveIcon,
    CloseIcon,
    ComputerIcon,
    CancelIcon
} from './MuiIcons';
import './BulkPasswordModal.css';

function BulkPasswordModal({ isOpen, onClose, onApply, groups, vncGroups }) {
    const [step, setStep] = useState(1); // 1: Credenciais, 2: Seleção
    const [targetType, setTargetType] = useState('rdp'); // 'rdp' ou 'vnc'
    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
        domain: ''
    });
    const [selectedServers, setSelectedServers] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    // Monta lista de servidores conforme tipo (ANTES do early return)
    const allServers = useMemo(() => {
        if (targetType === 'vnc') {
            return vncGroups.flatMap(group =>
                (group.connections || []).map(conn => ({
                    ...conn,
                    groupName: group.groupName,
                    type: 'vnc'
                }))
            );
        } else {
            return groups.flatMap(group =>
                (group.servers || []).map(server => ({
                    ...server,
                    groupName: group.groupName,
                    type: 'rdp'
                }))
            );
        }
    }, [targetType, groups, vncGroups]);

    // Filtra servidores (ANTES do early return)
    const filteredServers = useMemo(() => {
        if (!searchTerm) return allServers;
        const term = searchTerm.toLowerCase();
        return allServers.filter(s =>
            s.name.toLowerCase().includes(term) ||
            s.ipAddress.toLowerCase().includes(term) ||
            s.groupName.toLowerCase().includes(term)
        );
    }, [allServers, searchTerm]);

    if (!isOpen) return null;

    const handleCredentialChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleNextStep = (e) => {
        e.preventDefault();
        setError(null);

        // Validações
        if (!credentials.password.trim()) {
            setError('A senha é obrigatória.');
            return;
        }

        if (targetType === 'rdp' && !credentials.username.trim()) {
            setError('O usuário é obrigatório para RDP/SSH.');
            return;
        }

        setStep(2);
    };

    const handleToggleServer = (serverId) => {
        setSelectedServers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(serverId)) {
                newSet.delete(serverId);
            } else {
                newSet.add(serverId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedServers.size === filteredServers.length) {
            setSelectedServers(new Set());
        } else {
            setSelectedServers(new Set(filteredServers.map(s => s.id)));
        }
    };

    const handleApply = () => {
        if (selectedServers.size === 0) {
            setError('Selecione pelo menos um servidor.');
            return;
        }

        onApply({
            type: targetType,
            servers: Array.from(selectedServers),
            credentials
        });

        // Reset
        handleClose();
    };

    const handleClose = () => {
        setStep(1);
        setCredentials({ username: '', password: '', domain: '' });
        setSelectedServers(new Set());
        setSearchTerm('');
        setError(null);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content bulk-password-modal">
                <div className="modal-header">
                    <h2 className="modal-title">Alteração de Senha Global</h2>
                    <button className="modal-close-btn" onClick={handleClose} title="Fechar">
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>

                {step === 1 && (
                    <form onSubmit={handleNextStep} className="bulk-form">
                        <div className="form-group">
                            <label className="form-label">Tipo de Servidor:</label>
                            <select
                                value={targetType}
                                onChange={e => {
                                    setTargetType(e.target.value);
                                    setCredentials({ username: '', password: '', domain: '' });
                                }}
                                className="form-control"
                            >
                                <option value="rdp">RDP/SSH</option>
                                <option value="vnc">VNC</option>
                            </select>
                        </div>

                        {targetType === 'rdp' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Novo Usuário:</label>
                                    <div className="input-with-icon">
                                        <PersonOutlineIcon className="input-icon" />
                                        <input
                                            type="text"
                                            name="username"
                                            value={credentials.username}
                                            onChange={handleCredentialChange}
                                            required
                                            className="form-control"
                                            placeholder="Ex: administrator"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Novo Domínio (Opcional):</label>
                                    <div className="input-with-icon">
                                        <DomainIcon className="input-icon" />
                                        <input
                                            type="text"
                                            name="domain"
                                            value={credentials.domain}
                                            onChange={handleCredentialChange}
                                            className="form-control"
                                            placeholder="Ex: EMPRESA"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label className="form-label">Nova Senha:</label>
                            <div className="input-with-icon">
                                <LockIcon className="input-icon" />
                                <input
                                    type="password"
                                    name="password"
                                    value={credentials.password}
                                    onChange={handleCredentialChange}
                                    required
                                    className="form-control"
                                    placeholder="Digite a nova senha"
                                />
                            </div>
                        </div>

                        {error && <div className="error-banner">{error}</div>}

                        <div className="form-actions">
                            <button type="button" onClick={handleClose} className="btn btn-secondary">
                                <CancelIcon sx={{ fontSize: 18 }} />
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary">
                                <SearchIcon sx={{ fontSize: 18 }} />
                                Próximo: Selecionar Servidores
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <div className="bulk-selection">
                        <div className="selection-header">
                            <p>Selecione os servidores que receberão as novas credenciais:</p>
                            <div className="form-group search-filter">
                                <div className="input-with-icon">
                                    <SearchIcon className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Filtrar servidores..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="results-list-header">
                            <label className={`form-checkbox-wrapper ${filteredServers.length > 0 && selectedServers.size === filteredServers.length ? 'checked' : ''}`} style={{ width: '100%', border: 'none', background: 'transparent', padding: 0 }}>
                                <input
                                    type="checkbox"
                                    checked={filteredServers.length > 0 && selectedServers.size === filteredServers.length}
                                    onChange={handleSelectAll}
                                    className="form-checkbox"
                                />
                                <span className="checkbox-label-text">Selecionar Todos ({filteredServers.length})</span>
                            </label>
                        </div>

                        <div className="results-list">
                            {filteredServers.map(server => (
                                <div key={server.id} className="result-item">
                                    <label className={`form-checkbox-wrapper ${selectedServers.has(server.id) ? 'checked' : ''}`} style={{ width: '100%' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedServers.has(server.id)}
                                            onChange={() => handleToggleServer(server.id)}
                                            className="form-checkbox"
                                        />
                                        <div className="server-info" style={{ marginLeft: '8px' }}>
                                            <span className="server-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                                                <ComputerIcon sx={{ fontSize: 16 }} />
                                                {server.name}
                                            </span>
                                            <span className="server-details" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                                {server.ipAddress} • {server.groupName}
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            ))}
                            {filteredServers.length === 0 && (
                                <div className="no-results">Nenhum servidor encontrado.</div>
                            )}
                        </div>

                        {error && <div className="error-banner">⚠️ {error}</div>}

                        <div className="form-actions">
                            <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
                                <CancelIcon sx={{ fontSize: 18 }} />
                                Voltar
                            </button>
                            <button
                                type="button"
                                onClick={handleApply}
                                className="btn btn-primary"
                                disabled={selectedServers.size === 0}
                            >
                                <SaveIcon sx={{ fontSize: 18 }} />
                                Aplicar ({selectedServers.size} selecionados)
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BulkPasswordModal;
