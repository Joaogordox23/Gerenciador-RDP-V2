import React, { useState } from 'react';
import {
    DomainIcon,
    PersonOutlineIcon,
    LockIcon,
    SettingsEthernetIcon,
    SearchIcon,
    SaveIcon,
    CloseIcon,
    ComputerIcon,
    CancelIcon
} from './MuiIcons';
import './ADImportModal.css';

function ADImportModal({ isOpen, onClose, onImport, groups, vncGroups }) {
    const [step, setStep] = useState(1); // 1: Credenciais, 2: Seleção
    const [credentials, setCredentials] = useState({
        url: 'ldap://domain.com',
        baseDN: 'dc=domain,dc=com',
        username: 'user@domain.com',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [computers, setComputers] = useState([]);
    const [selectedComputers, setSelectedComputers] = useState(new Set());

    // Opções de Importação
    const [targetType, setTargetType] = useState('rdp'); // 'rdp' ou 'vnc'
    const [targetGroupId, setTargetGroupId] = useState('');
    const [defaultProtocol, setDefaultProtocol] = useState('rdp'); // 'rdp', 'ssh', 'vnc'

    // Filtro local
    const [searchTerm, setSearchTerm] = useState('');

    // Defaults VNC
    const [defaultVncPort, setDefaultVncPort] = useState('5900');
    const [defaultVncPassword, setDefaultVncPassword] = useState('');

    if (!isOpen) return null;

    const handleCredentialChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (!window.api || !window.api.adSearch) {
                throw new Error('API de busca AD não disponível (verifique o preload.js)');
            }

            const results = await window.api.adSearch(credentials);
            console.log('🖥️ Resultados recebidos no frontend:', results);
            setComputers(results);
            setStep(2);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Erro ao buscar no AD');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleComputer = (dnsName) => {
        setSelectedComputers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dnsName)) {
                newSet.delete(dnsName);
            } else {
                newSet.add(dnsName);
            }
            return newSet;
        });
    };

    // Computadores filtrados
    const filteredComputers = computers.filter(comp => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (comp.name && comp.name.toLowerCase().includes(term)) ||
            (comp.dnsName && comp.dnsName.toLowerCase().includes(term)) ||
            (comp.description && comp.description.toLowerCase().includes(term))
        );
    });

    const handleSelectAll = () => {
        if (selectedComputers.size === filteredComputers.length) {
            setSelectedComputers(new Set());
        } else {
            setSelectedComputers(new Set(filteredComputers.map(c => c.dnsName)));
        }
    };

    const handleImport = () => {
        if (!targetGroupId) {
            setError('Selecione um grupo de destino.');
            return;
        }

        // Importa apenas os selecionados
        const selectedList = computers.filter(c => selectedComputers.has(c.dnsName));

        // Prepara os dados para importação
        const importData = selectedList.map(comp => ({
            name: comp.name,
            ipAddress: comp.dnsName, // Usa DNS como endereço
            protocol: defaultProtocol,
            username: '', // Opcional: poderia vir do AD se mapeado
            description: comp.description,
            // Campos específicos para VNC
            port: targetType === 'vnc' ? defaultVncPort : undefined,
            password: targetType === 'vnc' ? defaultVncPassword : undefined
        }));

        onImport(Number(targetGroupId), importData, targetType);
        onClose();

        // Reset state
        setStep(1);
        setComputers([]);
        setSelectedComputers(new Set());
        setError(null);
        setSearchTerm('');
        setDefaultVncPassword('');
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content ad-import-modal">
                <div className="modal-header">
                    <h2 className="modal-title">Importar do Active Directory</h2>
                    <button className="modal-close-btn" onClick={onClose} title="Fechar">
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>

                {step === 1 && (
                    <form onSubmit={handleSearch} className="ad-form">
                        <div className="form-group">
                            <label>URL do LDAP</label>
                            <div className="input-with-icon">
                                <SettingsEthernetIcon className="input-icon" />
                                <input
                                    type="text"
                                    name="url"
                                    value={credentials.url}
                                    onChange={handleCredentialChange}
                                    required
                                    className="form-control"
                                    placeholder="ldap://192.168.1.10"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Base DN</label>
                            <div className="input-with-icon">
                                <DomainIcon className="input-icon" />
                                <input
                                    type="text"
                                    name="baseDN"
                                    value={credentials.baseDN}
                                    onChange={handleCredentialChange}
                                    required
                                    className="form-control"
                                    placeholder="dc=empresa,dc=local"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Usuário</label>
                            <div className="input-with-icon">
                                <PersonOutlineIcon className="input-icon" />
                                <input
                                    type="text"
                                    name="username"
                                    value={credentials.username}
                                    onChange={handleCredentialChange}
                                    required
                                    className="form-control"
                                    placeholder="admin@empresa.local"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Senha</label>
                            <div className="input-with-icon">
                                <LockIcon className="input-icon" />
                                <input
                                    type="password"
                                    name="password"
                                    value={credentials.password}
                                    onChange={handleCredentialChange}
                                    required
                                    className="form-control"
                                />
                            </div>
                        </div>

                        {error && <div className="error-banner">{error}</div>}

                        <div className="modal-actions">
                            <button type="button" onClick={onClose} className="btn btn--secondary">
                                <CancelIcon sx={{ fontSize: 18, marginRight: '8px' }} />
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn--primary" disabled={isLoading}>
                                <SearchIcon sx={{ fontSize: 18, marginRight: '8px' }} />
                                {isLoading ? 'Buscando...' : 'Buscar Computadores'}
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <div className="ad-results">
                        <div className="import-options">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tipo de Grupo:</label>
                                    <select
                                        value={targetType}
                                        onChange={e => {
                                            setTargetType(e.target.value);
                                            setTargetGroupId(''); // Reset grupo ao mudar tipo
                                            setDefaultProtocol(e.target.value === 'vnc' ? 'vnc' : 'rdp');
                                        }}
                                        className="form-control"
                                    >
                                        <option value="rdp">RDP/SSH</option>
                                        <option value="vnc">VNC</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Grupo de Destino:</label>
                                    <select
                                        value={targetGroupId}
                                        onChange={e => setTargetGroupId(e.target.value)}
                                        className="form-control"
                                    >
                                        <option value="">Selecione um grupo...</option>
                                        {(targetType === 'rdp' ? groups : vncGroups).map(g => (
                                            <option key={g.id} value={g.id}>{g.groupName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Protocolo Padrão:</label>
                                    <select
                                        value={defaultProtocol}
                                        onChange={e => setDefaultProtocol(e.target.value)}
                                        className="form-control"
                                    >
                                        <option value="rdp">RDP</option>
                                        <option value="ssh">SSH</option>
                                        <option value="vnc">VNC</option>
                                    </select>
                                </div>
                            </div>

                            {/* Opções extras para VNC */}
                            {targetType === 'vnc' && (
                                <div className="form-row vnc-options">
                                    <div className="form-group">
                                        <label>Porta VNC Padrão:</label>
                                        <input
                                            type="text"
                                            value={defaultVncPort}
                                            onChange={e => setDefaultVncPort(e.target.value)}
                                            placeholder="5900"
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Senha VNC Padrão (Opcional):</label>
                                        <input
                                            type="password"
                                            value={defaultVncPassword}
                                            onChange={e => setDefaultVncPassword(e.target.value)}
                                            placeholder="Senha para todos"
                                            className="form-control"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-group search-filter">
                                <div className="input-with-icon">
                                    <SearchIcon className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Filtrar computadores..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="results-list-header">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={filteredComputers.length > 0 && selectedComputers.size === filteredComputers.length}
                                    onChange={handleSelectAll}
                                />
                                Selecionar Todos ({filteredComputers.length})
                            </label>
                        </div>

                        <div className="results-list">
                            {filteredComputers.map(comp => (
                                <div key={comp.dnsName} className="result-item">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={selectedComputers.has(comp.dnsName)}
                                            onChange={() => handleToggleComputer(comp.dnsName)}
                                        />
                                        <div className="comp-info">
                                            <span className="comp-name">
                                                <ComputerIcon sx={{ fontSize: 16, marginRight: '8px', verticalAlign: 'middle' }} />
                                                {comp.name}
                                            </span>
                                            <span className="comp-dns">{comp.dnsName}</span>
                                        </div>
                                        <span className="comp-os">{comp.os}</span>
                                    </label>
                                </div>
                            ))}
                            {filteredComputers.length === 0 && (
                                <div className="no-results">Nenhum computador encontrado com esse filtro.</div>
                            )}
                        </div>

                        {error && <div className="error-banner">⚠️ {error}</div>}

                        <div className="modal-actions">
                            <button type="button" onClick={() => setStep(1)} className="btn btn--secondary">
                                <CancelIcon sx={{ fontSize: 18, marginRight: '8px' }} />
                                Voltar
                            </button>
                            <button
                                type="button"
                                onClick={handleImport}
                                className="btn btn--primary"
                                disabled={selectedComputers.size === 0 || !targetGroupId}
                            >
                                <SaveIcon sx={{ fontSize: 18, marginRight: '8px' }} />
                                Importar Selecionados ({selectedComputers.size})
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ADImportModal;
