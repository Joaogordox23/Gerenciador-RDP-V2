// src/components/EditServerModal.js
// ✨ v4.8: Migrado para Tailwind CSS
import React, { useState, useEffect } from 'react';
import {
    ComputerIcon,
    TerminalIcon,
    SettingsEthernetIcon,
    PersonOutlineIcon,
    LockIcon,
    DomainIcon,
    SaveIcon,
    CancelIcon,
    CloseIcon,
    InfoIcon,
    FolderIcon
} from './MuiIcons';
import PasswordStrengthIndicator from './PasswordStrengthValidator';

function EditServerModal({ server, groupId, groups, onSave, onCancel }) {
    const [serverData, setServerData] = useState({
        protocol: server.protocol || 'rdp',
        name: server.name || '',
        ipAddress: server.ipAddress || '',
        username: server.username || '',
        password: '',
        domain: server.domain || '',
        port: server.port || ''
    });

    const [selectedGroupId, setSelectedGroupId] = useState(groupId);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    const validateForm = () => {
        const newErrors = {};
        if (!serverData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!serverData.ipAddress.trim()) newErrors.ipAddress = 'IP/Hostname é obrigatório';
        if (serverData.protocol === 'ssh' && !serverData.username.trim()) {
            newErrors.username = 'Usuário é obrigatório para SSH';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setServerData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        }
    };

    const handleProtocolChange = (protocol) => {
        setServerData(prev => ({
            ...prev,
            protocol,
            port: protocol === 'ssh' ? (prev.port || '22') : '',
            domain: protocol === 'rdp' ? prev.domain : ''
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        const finalData = { ...serverData, id: server.id };
        if (!finalData.password) delete finalData.password;
        const newGroupId = selectedGroupId !== groupId ? selectedGroupId : null;
        onSave(groupId, finalData, newGroupId);
    };

    const inputBase = "w-full pl-10 pr-4 py-2.5 bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all";
    const labelClass = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="max-w-2xl w-full bg-cream-100 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-cream-50/50 dark:bg-dark-bg/50 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Editar Servidor</h3>
                    <button className="p-2 rounded-lg text-gray-500 hover:bg-red-500/20 hover:text-red-500 transition-all" onClick={onCancel}>
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
                    <form onSubmit={handleSubmit} id="edit-server-form" className="space-y-5">

                        {/* Grupo */}
                        {groups && groups.length > 1 && (
                            <div>
                                <label className={labelClass}>Grupo</label>
                                <div className="relative">
                                    <FolderIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                    <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className={inputBase}>
                                        {groups.map(g => <option key={g.id} value={g.id}>{g.groupName || g.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Protocolo */}
                        <div>
                            <label className={labelClass}>Protocolo</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => handleProtocolChange('rdp')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all
                                        ${serverData.protocol === 'rdp'
                                            ? 'bg-gradient-to-br from-primary to-primary-hover text-white shadow-md'
                                            : 'bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary'}`}>
                                    <ComputerIcon sx={{ fontSize: 18 }} /> RDP
                                </button>
                                <button type="button" onClick={() => handleProtocolChange('ssh')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all
                                        ${serverData.protocol === 'ssh'
                                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md'
                                            : 'bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-500'}`}>
                                    <TerminalIcon sx={{ fontSize: 18 }} /> SSH
                                </button>
                            </div>
                        </div>

                        {/* Nome */}
                        <div>
                            <label className={labelClass}>Nome *</label>
                            <div className="relative">
                                <ComputerIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                <input type="text" name="name" value={serverData.name} onChange={handleInputChange}
                                    className={`${inputBase} ${errors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                                    placeholder="Nome do servidor" />
                            </div>
                            {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name}</span>}
                        </div>

                        {/* IP */}
                        <div>
                            <label className={labelClass}>IP ou Hostname *</label>
                            <div className="relative">
                                <SettingsEthernetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                <input type="text" name="ipAddress" value={serverData.ipAddress} onChange={handleInputChange}
                                    className={`${inputBase} ${errors.ipAddress ? 'border-red-500' : ''}`}
                                    placeholder="192.168.1.100" />
                            </div>
                            {errors.ipAddress && <span className="text-xs text-red-500 mt-1">{errors.ipAddress}</span>}
                        </div>

                        {/* Usuário e Senha */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Usuário {serverData.protocol === 'ssh' ? '*' : ''}</label>
                                <div className="relative">
                                    <PersonOutlineIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                    <input type="text" name="username" value={serverData.username} onChange={handleInputChange}
                                        className={`${inputBase} ${errors.username ? 'border-red-500' : ''}`}
                                        placeholder="Usuário" />
                                </div>
                                {errors.username && <span className="text-xs text-red-500 mt-1">{errors.username}</span>}
                            </div>
                            <div>
                                <label className={labelClass}>Nova Senha</label>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
                                    <InfoIcon sx={{ fontSize: 12 }} />
                                    <span>Deixe em branco para manter</span>
                                </div>
                                <div className="relative">
                                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                    <input type="password" name="password" value={serverData.password} onChange={handleInputChange}
                                        className={inputBase} placeholder="Nova senha" />
                                </div>
                                <PasswordStrengthIndicator password={serverData.password} />
                            </div>
                        </div>

                        {/* Porta SSH */}
                        {serverData.protocol === 'ssh' && (
                            <div>
                                <label className={labelClass}>Porta</label>
                                <div className="relative">
                                    <SettingsEthernetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                    <input type="number" name="port" value={serverData.port} onChange={handleInputChange}
                                        className={inputBase} placeholder="22" />
                                </div>
                            </div>
                        )}

                        {/* Domínio RDP */}
                        {serverData.protocol === 'rdp' && (
                            <div>
                                <label className={labelClass}>Domínio</label>
                                <div className="relative">
                                    <DomainIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                    <input type="text" name="domain" value={serverData.domain} onChange={handleInputChange}
                                        className={inputBase} placeholder="Ex: EMPRESA" />
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-cream-50/30 dark:bg-dark-bg/30 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onCancel}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold transition-all hover:bg-gray-300">
                        <CancelIcon sx={{ fontSize: 18 }} /> Cancelar
                    </button>
                    <button type="submit" form="edit-server-form"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-br from-primary to-primary-hover text-white font-semibold shadow-md shadow-primary/30 transition-all hover:-translate-y-0.5">
                        <SaveIcon sx={{ fontSize: 18 }} /> Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditServerModal;
