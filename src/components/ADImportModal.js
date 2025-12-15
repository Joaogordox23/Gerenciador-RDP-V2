// src/components/ADImportModal.js
// ✨ v4.8: Migrado para Tailwind CSS
import React, { useState, useEffect } from 'react';
import {
    DomainIcon, PersonOutlineIcon, LockIcon, SettingsEthernetIcon,
    SearchIcon, SaveIcon, CloseIcon, ComputerIcon, CancelIcon
} from './MuiIcons';

function ADImportModal({ isOpen, onClose, onImport, groups, vncGroups }) {
    const [step, setStep] = useState(1);
    const [credentials, setCredentials] = useState({
        url: 'ldap://domain.com', baseDN: 'dc=domain,dc=com',
        username: 'user@domain.com', password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [computers, setComputers] = useState([]);
    const [selectedComputers, setSelectedComputers] = useState(new Set());
    const [targetType, setTargetType] = useState('rdp');
    const [targetGroupId, setTargetGroupId] = useState('');
    const [defaultProtocol, setDefaultProtocol] = useState('rdp');
    const [searchTerm, setSearchTerm] = useState('');
    const [defaultVncPort, setDefaultVncPort] = useState('5900');
    const [defaultVncPassword, setDefaultVncPassword] = useState('');

    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

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
            if (!window.api || !window.api.adSearch) throw new Error('API AD não disponível');
            const results = await window.api.adSearch(credentials);
            setComputers(results);
            setStep(2);
        } catch (err) {
            setError(err.message || 'Erro ao buscar no AD');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleComputer = (dnsName) => {
        setSelectedComputers(prev => {
            const newSet = new Set(prev);
            newSet.has(dnsName) ? newSet.delete(dnsName) : newSet.add(dnsName);
            return newSet;
        });
    };

    const filteredComputers = computers.filter(comp => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (comp.name?.toLowerCase().includes(term) || comp.dnsName?.toLowerCase().includes(term));
    });

    const handleSelectAll = () => {
        if (selectedComputers.size === filteredComputers.length) setSelectedComputers(new Set());
        else setSelectedComputers(new Set(filteredComputers.map(c => c.dnsName)));
    };

    const handleImport = () => {
        if (!targetGroupId) { setError('Selecione um grupo de destino.'); return; }
        const selectedList = computers.filter(c => selectedComputers.has(c.dnsName));
        const importData = selectedList.map(comp => ({
            name: comp.name, ipAddress: comp.dnsName, protocol: defaultProtocol,
            port: targetType === 'vnc' ? defaultVncPort : undefined,
            password: targetType === 'vnc' ? defaultVncPassword : undefined
        }));
        onImport(Number(targetGroupId), importData, targetType);
        onClose();
        setStep(1); setComputers([]); setSelectedComputers(new Set()); setError(null);
    };

    const inputBase = "w-full pl-10 pr-4 py-2.5 bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:border-primary outline-none transition-all";
    const labelClass = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5";
    const btnPrimary = "flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-br from-primary to-primary-hover text-white font-semibold shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50";
    const btnSecondary = "flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold transition-all hover:bg-gray-300";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="max-w-2xl w-full bg-cream-100 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-cream-50/50 dark:bg-dark-bg/50 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Importar do Active Directory</h2>
                    <button className="p-2 rounded-lg text-gray-500 hover:bg-red-500/20 hover:text-red-500 transition-all" onClick={onClose}>
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {step === 1 && (
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div>
                                <label className={labelClass}>URL do LDAP</label>
                                <div className="relative">
                                    <SettingsEthernetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                    <input type="text" name="url" value={credentials.url} onChange={handleCredentialChange} required
                                        className={inputBase} placeholder="ldap://192.168.1.10" />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Base DN</label>
                                <div className="relative">
                                    <DomainIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                    <input type="text" name="baseDN" value={credentials.baseDN} onChange={handleCredentialChange} required
                                        className={inputBase} placeholder="dc=empresa,dc=local" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Usuário</label>
                                    <div className="relative">
                                        <PersonOutlineIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                        <input type="text" name="username" value={credentials.username} onChange={handleCredentialChange} required
                                            className={inputBase} placeholder="admin@empresa.local" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Senha</label>
                                    <div className="relative">
                                        <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                        <input type="password" name="password" value={credentials.password} onChange={handleCredentialChange} required
                                            className={inputBase} />
                                    </div>
                                </div>
                            </div>
                            {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm">{error}</div>}
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={onClose} className={btnSecondary}><CancelIcon sx={{ fontSize: 18 }} /> Cancelar</button>
                                <button type="submit" className={btnPrimary} disabled={isLoading}>
                                    <SearchIcon sx={{ fontSize: 18 }} /> {isLoading ? 'Buscando...' : 'Buscar Computadores'}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            {/* Options */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>Tipo</label>
                                    <select value={targetType} onChange={e => { setTargetType(e.target.value); setTargetGroupId(''); setDefaultProtocol(e.target.value === 'vnc' ? 'vnc' : 'rdp'); }}
                                        className="w-full px-4 py-2.5 bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                                        <option value="rdp">RDP/SSH</option>
                                        <option value="vnc">VNC</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Grupo Destino</label>
                                    <select value={targetGroupId} onChange={e => setTargetGroupId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                                        <option value="">Selecione...</option>
                                        {(targetType === 'rdp' ? groups : vncGroups).map(g => <option key={g.id} value={g.id}>{g.groupName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Protocolo</label>
                                    <select value={defaultProtocol} onChange={e => setDefaultProtocol(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                                        <option value="rdp">RDP</option>
                                        <option value="ssh">SSH</option>
                                        <option value="vnc">VNC</option>
                                    </select>
                                </div>
                            </div>

                            {targetType === 'vnc' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Porta VNC</label>
                                        <input type="text" value={defaultVncPort} onChange={e => setDefaultVncPort(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm" placeholder="5900" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Senha VNC</label>
                                        <input type="password" value={defaultVncPassword} onChange={e => setDefaultVncPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm" placeholder="Opcional" />
                                    </div>
                                </div>
                            )}

                            {/* Filter */}
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className={inputBase} placeholder="Filtrar computadores..." />
                            </div>

                            {/* Select All */}
                            <label className="flex items-center gap-2 p-3 bg-cream-50 dark:bg-dark-bg rounded-lg cursor-pointer">
                                <input type="checkbox" checked={filteredComputers.length > 0 && selectedComputers.size === filteredComputers.length}
                                    onChange={handleSelectAll} className="w-4 h-4 rounded accent-primary" />
                                <span className="text-sm font-medium text-slate-900 dark:text-white">Selecionar Todos ({filteredComputers.length})</span>
                            </label>

                            {/* List */}
                            <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                                {filteredComputers.map(comp => (
                                    <label key={comp.dnsName} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all
                                        ${selectedComputers.has(comp.dnsName) ? 'bg-primary/10 border border-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                        <input type="checkbox" checked={selectedComputers.has(comp.dnsName)} onChange={() => handleToggleComputer(comp.dnsName)}
                                            className="w-4 h-4 rounded accent-primary" />
                                        <ComputerIcon sx={{ fontSize: 16 }} className="text-gray-400" />
                                        <div className="flex-1 min-w-0">
                                            <span className="block text-sm font-medium text-slate-900 dark:text-white truncate">{comp.name}</span>
                                            <span className="text-xs text-gray-500">{comp.dnsName}</span>
                                        </div>
                                        {comp.os && <span className="text-xs text-gray-400">{comp.os}</span>}
                                    </label>
                                ))}
                                {filteredComputers.length === 0 && <div className="text-center py-4 text-gray-500 text-sm">Nenhum computador encontrado</div>}
                            </div>

                            {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm">⚠️ {error}</div>}

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setStep(1)} className={btnSecondary}><CancelIcon sx={{ fontSize: 18 }} /> Voltar</button>
                                <button type="button" onClick={handleImport} className={btnPrimary} disabled={selectedComputers.size === 0 || !targetGroupId}>
                                    <SaveIcon sx={{ fontSize: 18 }} /> Importar ({selectedComputers.size})
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ADImportModal;
