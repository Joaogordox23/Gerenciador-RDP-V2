// src/components/EditServerForm.js (v4.2: Com seleção de grupo)
// Migrado para Tailwind CSS

import React, { useState } from 'react';
import {
    ComputerIcon,
    TerminalIcon,
    SettingsEthernetIcon,
    PersonOutlineIcon,
    LockIcon,
    DomainIcon,
    SaveIcon,
    CancelIcon,
    InfoIcon,
    FolderIcon
} from './MuiIcons';
import PasswordStrengthIndicator from './PasswordStrengthValidator';

function EditServerForm({ serverInfo, onSave, onCancel, groups, currentGroupId }) {
    const [serverData, setServerData] = useState({
        protocol: serverInfo.protocol || 'rdp',
        name: serverInfo.name || '',
        ipAddress: serverInfo.ipAddress || '',
        username: serverInfo.username || '',
        password: '', // A senha não é preenchida por segurança
        domain: serverInfo.domain || '',
        port: serverInfo.port || ''
    });

    const [selectedGroupId, setSelectedGroupId] = useState(currentGroupId);
    const [errors, setErrors] = useState({});

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

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setServerData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
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

    const handleGroupChange = (event) => {
        setSelectedGroupId(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!validateForm()) return;

        // Prepara os dados para salvar, omitindo a senha se estiver vazia
        const finalData = { ...serverData };
        if (!finalData.password) {
            delete finalData.password;
        }

        // Adiciona o novo groupId se foi alterado
        if (selectedGroupId !== currentGroupId) {
            finalData.newGroupId = selectedGroupId;
        }

        onSave(finalData);
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
        <div onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Header */}
                <h3 className="text-sm font-semibold text-white mb-2">Editar Servidor</h3>

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
                                <span>⚠️ Servidor será movido para outro grupo</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Protocol Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Protocolo
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {/* RDP Option */}
                        <button
                            type="button"
                            onClick={() => handleProtocolChange('rdp')}
                            className={`
                                flex items-center justify-center gap-2 px-4 py-3
                                rounded-lg border-2 cursor-pointer
                                transition-all
                                ${serverData.protocol === 'rdp'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-white/5 border-dark-border text-gray-400 hover:border-primary/50'
                                }
                            `}
                        >
                            <ComputerIcon sx={{ fontSize: 20 }} />
                            <span className="font-semibold">RDP</span>
                        </button>

                        {/* SSH Option */}
                        <button
                            type="button"
                            onClick={() => handleProtocolChange('ssh')}
                            className={`
                                flex items-center justify-center gap-2 px-4 py-3
                                rounded-lg border-2 cursor-pointer
                                transition-all
                                ${serverData.protocol === 'ssh'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-white/5 border-dark-border text-gray-400 hover:border-primary/50'
                                }
                            `}
                        >
                            <TerminalIcon sx={{ fontSize: 20 }} />
                            <span className="font-semibold">SSH</span>
                        </button>
                    </div>
                </div>

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
                            value={serverData.name}
                            onChange={handleInputChange}
                            className={`${inputBaseClass} ${errors.name ? inputErrorClass : ''}`}
                            placeholder="Ex: Servidor Principal"
                            autoFocus
                        />
                    </div>
                    {errors.name && <span className="text-xs text-red-400 mt-1 block">{errors.name}</span>}
                </div>

                {/* IP ou Hostname */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        IP ou Hostname *
                    </label>
                    <div className="relative">
                        <SettingsEthernetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                        <input
                            type="text"
                            name="ipAddress"
                            value={serverData.ipAddress}
                            onChange={handleInputChange}
                            className={`${inputBaseClass} ${errors.ipAddress ? inputErrorClass : ''}`}
                            placeholder="Ex: 192.168.1.100"
                        />
                    </div>
                    {errors.ipAddress && <span className="text-xs text-red-400 mt-1 block">{errors.ipAddress}</span>}
                </div>

                {/* Usuário e Senha */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Usuário {serverData.protocol === 'ssh' ? '*' : ''}
                        </label>
                        <div className="relative">
                            <PersonOutlineIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                            <input
                                type="text"
                                name="username"
                                value={serverData.username}
                                onChange={handleInputChange}
                                className={`${inputBaseClass} ${errors.username ? inputErrorClass : ''}`}
                                placeholder="Usuário"
                            />
                        </div>
                        {errors.username && <span className="text-xs text-red-400 mt-1 block">{errors.username}</span>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Nova Senha
                        </label>
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-md mb-2 text-xs text-blue-400">
                            <InfoIcon sx={{ fontSize: 16 }} />
                            <span>💡 Deixe em branco para manter a senha atual</span>
                        </div>
                        <div className="relative">
                            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                            <input
                                type="password"
                                name="password"
                                value={serverData.password}
                                onChange={handleInputChange}
                                className={inputBaseClass}
                                placeholder="Digite nova senha ou deixe vazio"
                            />
                        </div>
                        <PasswordStrengthIndicator password={serverData.password} />
                    </div>
                </div>

                {/* Domínio (RDP only) */}
                {serverData.protocol === 'rdp' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Domínio
                        </label>
                        <div className="relative">
                            <DomainIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                            <input
                                type="text"
                                name="domain"
                                value={serverData.domain}
                                onChange={handleInputChange}
                                className={inputBaseClass}
                                placeholder="Ex: EMPRESA"
                            />
                        </div>
                    </div>
                )}

                {/* Porta (SSH only) */}
                {serverData.protocol === 'ssh' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Porta
                        </label>
                        <div className="relative">
                            <SettingsEthernetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                            <input
                                type="number"
                                name="port"
                                value={serverData.port}
                                onChange={handleInputChange}
                                className={inputBaseClass}
                                placeholder="22"
                            />
                        </div>
                    </div>
                )}

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

export default EditServerForm;