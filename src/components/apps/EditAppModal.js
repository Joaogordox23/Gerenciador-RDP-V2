// src/components/apps/EditAppModal.js
// Modal para criar/editar aplicação (Feature v4.3)

import React, { useState, useCallback, useEffect } from 'react';
import Modal from '../Modal';
import {
    WebIcon,
    DesktopWindowsIcon,
    FolderOpenIcon
} from '../MuiIcons';
import './EditAppModal.css';

/**
 * Modal para criar ou editar uma aplicação
 */
function EditAppModal({
    isOpen,
    onClose,
    onSave,
    app = null, // null = nova aplicação
    groupId,
    groups = [],
    selectFile
}) {
    const isEditing = !!app;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'web',
        path: '',
        icon: '',
        arguments: ''
    });
    const [selectedGroupId, setSelectedGroupId] = useState(groupId);
    const [errors, setErrors] = useState({});

    // Preenche dados quando editando
    useEffect(() => {
        if (app) {
            setFormData({
                name: app.name || '',
                description: app.description || '',
                type: app.type || 'web',
                path: app.path || '',
                icon: app.icon || '',
                arguments: app.arguments || ''
            });
            setSelectedGroupId(app.groupId || groupId);
        } else {
            setFormData({
                name: '',
                description: '',
                type: 'web',
                path: '',
                icon: '',
                arguments: ''
            });
            setSelectedGroupId(groupId);
        }
        setErrors({});
    }, [app, groupId, isOpen]);

    const handleChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpa erro do campo
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    }, [errors]);

    const handleSelectFile = useCallback(async () => {
        if (!selectFile) return;

        const filePath = await selectFile('executable');
        if (filePath) {
            handleChange('path', filePath);
        }
    }, [selectFile, handleChange]);

    // ✨ v4.6: Seletor de ícone local
    const handleSelectIcon = useCallback(async () => {
        if (!selectFile) return;

        const result = await selectFile('image');
        console.log('📷 Ícone selecionado:', result ? result.substring(0, 50) + '...' : 'null');
        if (result) {
            handleChange('icon', result);
        }
    }, [selectFile, handleChange]);

    const validate = useCallback(() => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        }

        if (!formData.path.trim()) {
            newErrors.path = formData.type === 'web' ? 'URL é obrigatória' : 'Caminho é obrigatório';
        } else if (formData.type === 'web') {
            // Validação básica de URL
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

        const data = {
            ...formData,
            groupId: selectedGroupId
        };

        onSave(isEditing ? app.id : null, data, selectedGroupId);
    }, [formData, selectedGroupId, validate, onSave, isEditing, app]);

    if (!isOpen) return null;

    const modalTitle = isEditing ? 'Editar Aplicação' : 'Nova Aplicação';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="md">
            <form onSubmit={handleSubmit} className="edit-app-modal">
                {/* Toggle de Tipo */}
                <div className="app-type-toggle">
                    <button
                        type="button"
                        className={`type-btn ${formData.type === 'web' ? 'active' : ''}`}
                        onClick={() => handleChange('type', 'web')}
                    >
                        <WebIcon sx={{ fontSize: 20 }} />
                        <span>Web</span>
                    </button>
                    <button
                        type="button"
                        className={`type-btn ${formData.type === 'local' ? 'active' : ''}`}
                        onClick={() => handleChange('type', 'local')}
                    >
                        <DesktopWindowsIcon sx={{ fontSize: 20 }} />
                        <span>Local</span>
                    </button>
                </div>

                {/* Nome */}
                <div className="form-group">
                    <label className="form-label">Nome *</label>
                    <input
                        type="text"
                        className={`form-control ${errors.name ? 'error' : ''}`}
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Nome da aplicação"
                        autoFocus
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                {/* Descrição */}
                <div className="form-group">
                    <label className="form-label">Descrição</label>
                    <input
                        type="text"
                        className="form-control"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Descrição breve (opcional)"
                    />
                </div>

                {/* Path / URL */}
                <div className="form-group">
                    <label className="form-label">
                        {formData.type === 'web' ? 'URL *' : 'Caminho do Executável *'}
                    </label>
                    <div className="input-with-button">
                        <input
                            type="text"
                            className={`form-control ${errors.path ? 'error' : ''}`}
                            value={formData.path}
                            onChange={(e) => handleChange('path', e.target.value)}
                            placeholder={formData.type === 'web' ? 'https://exemplo.com' : 'C:\\Program Files\\...'}
                        />
                        {formData.type === 'local' && (
                            <button
                                type="button"
                                className="btn-browse"
                                onClick={handleSelectFile}
                                title="Procurar arquivo"
                            >
                                <FolderOpenIcon sx={{ fontSize: 18 }} />
                            </button>
                        )}
                    </div>
                    {errors.path && <span className="error-text">{errors.path}</span>}
                </div>

                {/* Argumentos (apenas para local) */}
                {formData.type === 'local' && (
                    <div className="form-group">
                        <label className="form-label">Argumentos</label>
                        <input
                            type="text"
                            className="form-control"
                            value={formData.arguments}
                            onChange={(e) => handleChange('arguments', e.target.value)}
                            placeholder="Argumentos de linha de comando (opcional)"
                        />
                    </div>
                )}

                {/* ✨ v4.6: Ícone Customizado */}
                <div className="form-group">
                    <label className="form-label">Ícone Personalizado</label>
                    <div className="icon-input-row">
                        {formData.icon && (
                            <img
                                src={formData.icon}
                                alt="Preview"
                                className="icon-preview"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        )}
                        <div className="input-with-button" style={{ flex: 1 }}>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.icon}
                                onChange={(e) => handleChange('icon', e.target.value)}
                                placeholder="URL ou caminho local do ícone"
                            />
                            <button
                                type="button"
                                className="btn-browse"
                                onClick={handleSelectIcon}
                                title="Procurar imagem"
                            >
                                <FolderOpenIcon sx={{ fontSize: 18 }} />
                            </button>
                        </div>
                    </div>
                    <span className="form-hint">URL, caminho local, ou deixe vazio para ícone padrão</span>
                </div>

                {/* Grupo */}
                {groups.length > 1 && (
                    <div className="form-group">
                        <label className="form-label">Grupo</label>
                        <select
                            className="form-control"
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                        >
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Actions */}
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {isEditing ? 'Salvar' : 'Adicionar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default EditAppModal;

