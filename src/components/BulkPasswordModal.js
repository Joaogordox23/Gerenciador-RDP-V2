// src/components/BulkPasswordModal.js
// ✨ v4.8: Migrado para Tailwind CSS
import React, { useState, useMemo, useEffect } from 'react';
import {
    LockIcon, PersonOutlineIcon, DomainIcon, SearchIcon,
    SaveIcon, CloseIcon, ComputerIcon, CancelIcon
} from './MuiIcons';
import PasswordStrengthIndicator from './PasswordStrengthValidator';

function BulkPasswordModal({ isOpen, onClose, onApply, groups, vncGroups }) {
    const [step, setStep] = useState(1);
    const [targetType, setTargetType] = useState('rdp');
    const [credentials, setCredentials] = useState({ username: '', password: '', domain: '' });
    const [selectedServers, setSelectedServers] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    const allServers = useMemo(() => {
        if (targetType === 'vnc') {
            return vncGroups.flatMap(group => (group.connections || []).map(conn => ({ ...conn, groupName: group.groupName, type: 'vnc' })));
        } else {
            return groups.flatMap(group => (group.servers || []).map(server => ({ ...server, groupName: group.groupName, type: 'rdp' })));
        }
    }, [targetType, groups, vncGroups]);

    const filteredServers = useMemo(() => {
        if (!searchTerm) return allServers;
        const term = searchTerm.toLowerCase();
        return allServers.filter(s => s.name.toLowerCase().includes(term) || s.ipAddress.toLowerCase().includes(term) || s.groupName.toLowerCase().includes(term));
    }, [allServers, searchTerm]);

    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'Escape') handleClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isOpen) return null;

    const handleCredentialChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleNextStep = (e) => {
        e.preventDefault();
        setError(null);
        if (!credentials.password.trim()) { setError('A senha é obrigatória.'); return; }
        if (targetType === 'rdp' && !credentials.username.trim()) { setError('O usuário é obrigatório para RDP/SSH.'); return; }
        setStep(2);
    };

    const handleToggleServer = (serverId) => {
        setSelectedServers(prev => {
            const newSet = new Set(prev);
            newSet.has(serverId) ? newSet.delete(serverId) : newSet.add(serverId);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedServers.size === filteredServers.length) setSelectedServers(new Set());
        else setSelectedServers(new Set(filteredServers.map(s => s.id)));
    };

    const handleApply = () => {
        if (selectedServers.size === 0) { setError('Selecione pelo menos um servidor.'); return; }
        onApply({ type: targetType, servers: Array.from(selectedServers), credentials });
        handleClose();
    };

    const handleClose = () => {
        setStep(1); setCredentials({ username: '', password: '', domain: '' });
        setSelectedServers(new Set()); setSearchTerm(''); setError(null); onClose();
    };

    const inputBase = "w-full pl-10 pr-4 py-2.5 bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:border-primary outline-none transition-all";
    const labelClass = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5";
    const btnPrimary = "flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-br from-primary to-primary-hover text-white font-semibold shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50";
    const btnSecondary = "flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold transition-all hover:bg-gray-300";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="max-w-xl w-full bg-cream-100 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-cream-50/50 dark:bg-dark-bg/50 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Alteração de Senha Global</h2>
                    <button className="p-2 rounded-lg text-gray-500 hover:bg-red-500/20 hover:text-red-500 transition-all" onClick={handleClose}>
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {step === 1 && (
                        <form onSubmit={handleNextStep} className="space-y-4">
                            <div>
                                <label className={labelClass}>Tipo de Servidor</label>
                                <select value={targetType} onChange={e => { setTargetType(e.target.value); setCredentials({ username: '', password: '', domain: '' }); }}
                                    className="w-full px-4 py-2.5 bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                                    <option value="rdp">RDP/SSH</option>
                                    <option value="vnc">VNC</option>
                                </select>
                            </div>

                            {targetType === 'rdp' && (
                                <>
                                    <div>
                                        <label className={labelClass}>Novo Usuário</label>
                                        <div className="relative">
                                            <PersonOutlineIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                            <input type="text" name="username" value={credentials.username} onChange={handleCredentialChange} required
                                                className={inputBase} placeholder="Ex: administrator" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Novo Domínio (Opcional)</label>
                                        <div className="relative">
                                            <DomainIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                            <input type="text" name="domain" value={credentials.domain} onChange={handleCredentialChange}
                                                className={inputBase} placeholder="Ex: EMPRESA" />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className={labelClass}>Nova Senha</label>
                                <div className="relative">
                                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                    <input type="password" name="password" value={credentials.password} onChange={handleCredentialChange} required
                                        className={inputBase} placeholder="Digite a nova senha" />
                                </div>
                                <PasswordStrengthIndicator password={credentials.password} />
                            </div>

                            {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm">{error}</div>}

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={handleClose} className={btnSecondary}><CancelIcon sx={{ fontSize: 18 }} /> Cancelar</button>
                                <button type="submit" className={btnPrimary}><SearchIcon sx={{ fontSize: 18 }} /> Próximo</button>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Selecione os servidores que receberão as novas credenciais:</p>

                            {/* Filter */}
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className={inputBase} placeholder="Filtrar servidores..." />
                            </div>

                            {/* Select All */}
                            <label className="flex items-center gap-2 p-3 bg-cream-50 dark:bg-dark-bg rounded-lg cursor-pointer">
                                <input type="checkbox" checked={filteredServers.length > 0 && selectedServers.size === filteredServers.length}
                                    onChange={handleSelectAll} className="w-4 h-4 rounded accent-primary" />
                                <span className="text-sm font-medium text-slate-900 dark:text-white">Selecionar Todos ({filteredServers.length})</span>
                            </label>

                            {/* List */}
                            <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                                {filteredServers.map(server => (
                                    <label key={server.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all
                                        ${selectedServers.has(server.id) ? 'bg-primary/10 border border-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                        <input type="checkbox" checked={selectedServers.has(server.id)} onChange={() => handleToggleServer(server.id)}
                                            className="w-4 h-4 rounded accent-primary" />
                                        <ComputerIcon sx={{ fontSize: 16 }} className="text-gray-400" />
                                        <div className="flex-1 min-w-0">
                                            <span className="block text-sm font-medium text-slate-900 dark:text-white truncate">{server.name}</span>
                                            <span className="text-xs text-gray-500">{server.ipAddress} • {server.groupName}</span>
                                        </div>
                                    </label>
                                ))}
                                {filteredServers.length === 0 && <div className="text-center py-4 text-gray-500 text-sm">Nenhum servidor encontrado</div>}
                            </div>

                            {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm">⚠️ {error}</div>}

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setStep(1)} className={btnSecondary}><CancelIcon sx={{ fontSize: 18 }} /> Voltar</button>
                                <button type="button" onClick={handleApply} className={btnPrimary} disabled={selectedServers.size === 0}>
                                    <SaveIcon sx={{ fontSize: 18 }} /> Aplicar ({selectedServers.size})
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BulkPasswordModal;
