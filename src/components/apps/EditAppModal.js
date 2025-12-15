// src/components/apps/EditAppModal.js
// ✨ v4.8: Migrado para Tailwind CSS
import React, { useState, useCallback, useEffect } from 'react';
import Modal from '../Modal';
import {
    WebIcon,
    DesktopWindowsIcon,
    FolderOpenIcon
} from '../MuiIcons';

function EditAppModal({
    isOpen,
    onClose,
    onSave,
    app = null,
    groupId,
    groups = [],
    selectFile
}) {
    const isEditing = !!app;

    const [formData, setFormData] = useState({
        name: '', description: '', type: 'web', path: '', icon: '', arguments: ''
    });
    const [selectedGroupId, setSelectedGroupId] = useState(groupId);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (app) {
            setFormData({
                name: app.name || '', description: app.description || '',
                type: app.type || 'web', path: app.path || '',
                icon: app.icon || '', arguments: app.arguments || ''
            });
            setSelectedGroupId(app.groupId || groupId);
        } else {
            setFormData({ name: '', description: '', type: 'web', path: '', icon: '', arguments: '' });
            setSelectedGroupId(groupId);
        }
        setErrors({});
    }, [app, groupId, isOpen]);

    const handleChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    }, [errors]);

    const handleSelectFile = useCallback(async () => {
        if (!selectFile) return;
        const filePath = await selectFile('executable');
        if (filePath) handleChange('path', filePath);
    }, [selectFile, handleChange]);

    const handleSelectIcon = useCallback(async () => {
        if (!selectFile) return;
        const result = await selectFile('image');
        if (result) handleChange('icon', result);
    }, [selectFile, handleChange]);

    const validate = useCallback(() => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!formData.path.trim()) {
            newErrors.path = formData.type === 'web' ? 'URL é obrigatória' : 'Caminho é obrigatório';
        } else if (formData.type === 'web') {
            if (!formData.path.startsWith('http://') && !formData.path.startsWith('https://')) {
                newErrors.path = 'URL deve começar com http:// ou https://';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (!validate()) return;
        const data = { ...formData, groupId: selectedGroupId };
        onSave(isEditing ? app.id : null, data, selectedGroupId);
    }, [formData, selectedGroupId, validate, onSave, isEditing, app]);

    if (!isOpen) return null;

    const inputBase = "w-full px-4 py-2.5 bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all";
    const labelClass = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Aplicação' : 'Nova Aplicação'} size="md">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Toggle de Tipo */}
                <div className="flex gap-2">
                    <button type="button" onClick={() => handleChange('type', 'web')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all
                            ${formData.type === 'web'
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md'
                                : 'bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-500'}`}>
                        <WebIcon sx={{ fontSize: 20 }} /> Web
                    </button>
                    <button type="button" onClick={() => handleChange('type', 'local')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all
                            ${formData.type === 'local'
                                ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md'
                                : 'bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-purple-500'}`}>
                        <DesktopWindowsIcon sx={{ fontSize: 20 }} /> Local
                    </button>
                </div>

                {/* Nome */}
                <div>
                    <label className={labelClass}>Nome *</label>
                    <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)}
                        className={`${inputBase} ${errors.name ? 'border-red-500' : ''}`}
                        placeholder="Nome da aplicação" autoFocus />
                    {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name}</span>}
                </div>

                {/* Descrição */}
                <div>
                    <label className={labelClass}>Descrição</label>
                    <input type="text" value={formData.description} onChange={(e) => handleChange('description', e.target.value)}
                        className={inputBase} placeholder="Descrição breve (opcional)" />
                </div>

                {/* Path / URL */}
                <div>
                    <label className={labelClass}>{formData.type === 'web' ? 'URL *' : 'Caminho do Executável *'}</label>
                    <div className="flex gap-2">
                        <input type="text" value={formData.path} onChange={(e) => handleChange('path', e.target.value)}
                            className={`flex-1 ${inputBase} ${errors.path ? 'border-red-500' : ''}`}
                            placeholder={formData.type === 'web' ? 'https://exemplo.com' : 'C:\\Program Files\\...'} />
                        {formData.type === 'local' && (
                            <button type="button" onClick={handleSelectFile}
                                className="px-3 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-primary transition-all">
                                <FolderOpenIcon sx={{ fontSize: 18 }} />
                            </button>
                        )}
                    </div>
                    {errors.path && <span className="text-xs text-red-500 mt-1">{errors.path}</span>}
                </div>

                {/* Argumentos */}
                {formData.type === 'local' && (
                    <div>
                        <label className={labelClass}>Argumentos</label>
                        <input type="text" value={formData.arguments} onChange={(e) => handleChange('arguments', e.target.value)}
                            className={inputBase} placeholder="Argumentos de linha de comando (opcional)" />
                    </div>
                )}

                {/* Ícone */}
                <div>
                    <label className={labelClass}>Ícone Personalizado</label>
                    <div className="flex items-center gap-3">
                        {formData.icon && (
                            <img src={formData.icon} alt="Preview"
                                className="w-12 h-12 rounded-lg object-contain bg-gray-100 dark:bg-gray-800"
                                onError={(e) => e.target.style.display = 'none'} />
                        )}
                        <div className="flex-1 flex gap-2">
                            <input type="text" value={formData.icon} onChange={(e) => handleChange('icon', e.target.value)}
                                className={`flex-1 ${inputBase}`} placeholder="URL ou caminho do ícone" />
                            <button type="button" onClick={handleSelectIcon}
                                className="px-3 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-primary transition-all">
                                <FolderOpenIcon sx={{ fontSize: 18 }} />
                            </button>
                        </div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">URL, caminho local, ou deixe vazio para ícone padrão</span>
                </div>

                {/* Grupo */}
                {groups.length > 1 && (
                    <div>
                        <label className={labelClass}>Grupo</label>
                        <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(Number(e.target.value))} className={inputBase}>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold transition-all hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button type="submit"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-br from-primary to-primary-hover text-white font-semibold shadow-md shadow-primary/30 transition-all hover:-translate-y-0.5">
                        {isEditing ? 'Salvar' : 'Adicionar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default EditAppModal;
