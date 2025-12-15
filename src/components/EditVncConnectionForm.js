// src/components/EditVncConnectionForm.js (v4.2: Com seleção de grupo)
// Migrado para Tailwind CSS

import React, { useState } from 'react';
import {
    ComputerIcon,
    SettingsEthernetIcon,
    LockIcon,
    VisibilityIcon,
    SaveIcon,
    CancelIcon,
    FolderIcon,
    InfoIcon
} from './MuiIcons';

function EditVncConnectionForm({ connectionInfo, onSave, onCancel, groups, currentGroupId }) {
    const [formData, setFormData] = useState({ ...connectionInfo });
    const [selectedGroupId, setSelectedGroupId] = useState(currentGroupId);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!formData.ipAddress.trim()) newErrors.ipAddress = 'IP/Hostname é obrigatório';
        if (!formData.port) newErrors.port = 'Porta é obrigatória';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleGroupChange = (event) => {
        setSelectedGroupId(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (validateForm()) {
            // Remove a senha do objeto se estiver vazia para não sobrescrever
            const dataToSave = { ...formData };
            if (!dataToSave.password) {
                delete dataToSave.password;
            }

            // Adiciona o novo groupId se foi alterado
            if (selectedGroupId !== currentGroupId) {
                dataToSave.newGroupId = selectedGroupId;
            }

            onSave(dataToSave);
        }
    };

    // Input classes
    const inputBaseClass = `
        w-full pl-10 pr-4 py-2.5
        bg-dark-elevated border border-dark-border rounded-lg
        text-white text-sm placeholder-gray-500
        focus:border-primary focus:ring-1 focus:ring-primary/30
        outline-none transition-all
    `;

    const inputErrorClass = 'border-red-500 focus:border-red-500 focus:ring-red-500/30';

    return (
        <div onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Header */}
                <h3 className="text-sm font-semibold text-white mb-2">Editando Conexão VNC</h3>

                {/* Seleção de Grupo */}
                {groups && groups.length > 1 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Grupo
                        </label>
                        <div className="relative">
                            <FolderIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                            <select
                                name="groupId"
                                value={selectedGroupId}
                                onChange={handleGroupChange}
                                className={`${inputBaseClass} cursor-pointer appearance-none`}
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2300d9b5' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center'
                                }}
                            >
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.groupName}</option>
                                ))}
                            </select>
                        </div>
                        {selectedGroupId !== currentGroupId && (
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-md mt-2 text-xs text-amber-400">
                                <InfoIcon sx={{ fontSize: 16 }} />
                                <span>⚠️ Conexão será movida para outro grupo</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Nome */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Nome *
                    </label>
                    <div className="relative">
                        <ComputerIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`${inputBaseClass} ${errors.name ? inputErrorClass : ''}`}
                            autoFocus
                        />
                    </div>
                    {errors.name && <span className="text-xs text-red-400 mt-1 block">{errors.name}</span>}
                </div>

                {/* IP/Hostname */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        IP/Hostname *
                    </label>
                    <div className="relative">
                        <SettingsEthernetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                        <input
                            type="text"
                            name="ipAddress"
                            value={formData.ipAddress}
                            onChange={handleInputChange}
                            className={`${inputBaseClass} ${errors.ipAddress ? inputErrorClass : ''}`}
                        />
                    </div>
                    {errors.ipAddress && <span className="text-xs text-red-400 mt-1 block">{errors.ipAddress}</span>}
                </div>

                {/* Porta e Senha */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Porta *
                        </label>
                        <div className="relative">
                            <SettingsEthernetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                            <input
                                type="number"
                                name="port"
                                value={formData.port}
                                onChange={handleInputChange}
                                className={`${inputBaseClass} ${errors.port ? inputErrorClass : ''}`}
                            />
                        </div>
                        {errors.port && <span className="text-xs text-red-400 mt-1 block">{errors.port}</span>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Nova Senha
                        </label>
                        <div className="relative">
                            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                            <input
                                type="password"
                                name="password"
                                onChange={handleInputChange}
                                className={inputBaseClass}
                                placeholder="Deixe em branco para manter"
                            />
                        </div>
                    </div>
                </div>

                {/* View Only Checkbox */}
                <div>
                    <label className={`
                        flex items-center gap-3 px-4 py-3
                        rounded-lg border-2 cursor-pointer
                        transition-all
                        ${formData.viewOnly
                            ? 'bg-primary/10 border-primary'
                            : 'bg-white/5 border-dark-border hover:border-primary/50'
                        }
                    `}>
                        <input
                            type="checkbox"
                            name="viewOnly"
                            checked={formData.viewOnly}
                            onChange={handleInputChange}
                            className="w-4.5 h-4.5 accent-primary cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                            <VisibilityIcon
                                sx={{ fontSize: 18 }}
                                className={formData.viewOnly ? 'text-primary' : 'text-gray-400'}
                            />
                            <span className={`text-sm font-medium ${formData.viewOnly ? 'text-primary' : 'text-white'}`}>
                                Modo Apenas Visualização
                            </span>
                        </div>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-dark-border">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="
                            flex items-center gap-2
                            px-4 py-2
                            bg-dark-elevated text-gray-300
                            rounded-lg text-sm font-medium
                            hover:bg-dark-border
                            transition-colors cursor-pointer
                        "
                    >
                        <CancelIcon sx={{ fontSize: 18 }} />
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="
                            flex items-center gap-2
                            px-4 py-2
                            bg-primary text-black
                            rounded-lg text-sm font-medium
                            hover:bg-primary-hover
                            transition-colors cursor-pointer
                        "
                    >
                        <SaveIcon sx={{ fontSize: 18 }} />
                        Salvar
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditVncConnectionForm;
