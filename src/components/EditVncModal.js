// src/components/EditVncModal.js
// ✨ v4.8: Migrado para Tailwind CSS
import React, { useState, useEffect } from 'react';
import {
    ComputerIcon,
    SettingsEthernetIcon,
    LockIcon,
    VisibilityIcon,
    SaveIcon,
    CancelIcon,
    CloseIcon,
    FolderIcon,
    InfoIcon
} from './MuiIcons';

function EditVncModal({ connection, groupId, groups, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        name: connection.name || '',
        ipAddress: connection.ipAddress || '',
        port: connection.port || 5900,
        password: '',
        viewOnly: connection.viewOnly || false
    });

    const [selectedGroupId, setSelectedGroupId] = useState(groupId);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!formData.ipAddress.trim()) newErrors.ipAddress = 'IP/Hostname é obrigatório';
        if (!formData.port) newErrors.port = 'Porta é obrigatória';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        const dataToSave = { ...formData, id: connection.id };
        if (!dataToSave.password) delete dataToSave.password;
        const newGroupId = selectedGroupId !== groupId ? selectedGroupId : null;
        onSave(groupId, dataToSave, newGroupId);
    };

    const inputBase = "w-full pl-10 pr-4 py-2.5 bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all";
    const labelClass = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="max-w-lg w-full bg-cream-100 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-cream-50/50 dark:bg-dark-bg/50 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Editar Conexão VNC</h3>
                    <button className="p-2 rounded-lg text-gray-500 hover:bg-red-500/20 hover:text-red-500 transition-all" onClick={onCancel}>
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
                    <form onSubmit={handleSubmit} id="edit-vnc-form" className="space-y-5">

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
                                {selectedGroupId !== groupId && (
                                    <div className="flex items-center gap-1 mt-1.5 text-xs text-yellow-500">
                                        <InfoIcon sx={{ fontSize: 12 }} />
                                        <span>Conexão será movida para outro grupo</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Nome */}
                        <div>
                            <label className={labelClass}>Nome *</label>
                            <div className="relative">
                                <ComputerIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} autoFocus
                                    className={`${inputBase} ${errors.name ? 'border-red-500' : ''}`} placeholder="Nome da conexão" />
                            </div>
                            {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name}</span>}
                        </div>

                        {/* IP */}
                        <div>
                            <label className={labelClass}>IP ou Hostname *</label>
                            <div className="relative">
                                <SettingsEthernetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                <input type="text" name="ipAddress" value={formData.ipAddress} onChange={handleInputChange}
                                    className={`${inputBase} ${errors.ipAddress ? 'border-red-500' : ''}`} placeholder="192.168.1.100" />
                            </div>
                            {errors.ipAddress && <span className="text-xs text-red-500 mt-1">{errors.ipAddress}</span>}
                        </div>

                        {/* Porta e Senha */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Porta *</label>
                                <div className="relative">
                                    <SettingsEthernetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                    <input type="number" name="port" value={formData.port} onChange={handleInputChange}
                                        className={`${inputBase} ${errors.port ? 'border-red-500' : ''}`} placeholder="5900" />
                                </div>
                                {errors.port && <span className="text-xs text-red-500 mt-1">{errors.port}</span>}
                            </div>
                            <div>
                                <label className={labelClass}>Nova Senha</label>
                                <div className="relative">
                                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                    <input type="password" name="password" value={formData.password} onChange={handleInputChange}
                                        className={inputBase} placeholder="Deixe em branco" />
                                </div>
                            </div>
                        </div>

                        {/* View Only */}
                        <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                            ${formData.viewOnly ? 'bg-primary/10 border border-primary' : 'bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700'}`}>
                            <input type="checkbox" name="viewOnly" checked={formData.viewOnly} onChange={handleInputChange}
                                className="w-5 h-5 rounded accent-primary" />
                            <VisibilityIcon sx={{ fontSize: 18 }} className={formData.viewOnly ? 'text-primary' : 'text-gray-400'} />
                            <span className={`text-sm font-medium ${formData.viewOnly ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}>
                                Modo Apenas Visualização
                            </span>
                        </label>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-cream-50/30 dark:bg-dark-bg/30 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onCancel}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold transition-all hover:bg-gray-300">
                        <CancelIcon sx={{ fontSize: 18 }} /> Cancelar
                    </button>
                    <button type="submit" form="edit-vnc-form"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-br from-primary to-primary-hover text-white font-semibold shadow-md shadow-primary/30 transition-all hover:-translate-y-0.5">
                        <SaveIcon sx={{ fontSize: 18 }} /> Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditVncModal;
