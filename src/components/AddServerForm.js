import React, { useState } from 'react';
import {
    ComputerIcon,
    TerminalIcon,
    PersonOutlineIcon,
    LockIcon,
    DomainIcon,
    SettingsEthernetIcon,
    SaveIcon,
    CancelIcon
} from './MuiIcons';
import PasswordStrengthIndicator from './PasswordStrengthValidator';

/**
 * AddServerForm - Formulário para adicionar novo servidor
 * Migrado para Tailwind CSS
 */
function AddServerForm({ onAddServer, onCancel }) {
    const [serverData, setServerData] = useState({
        protocol: 'rdp',
        name: '',
        ipAddress: '',
        username: '',
        password: '',
        domain: '',
        port: ''
    });
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!serverData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!serverData.ipAddress.trim()) newErrors.ipAddress = 'IP/Hostname é obrigatório';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setServerData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!validate()) return;
        onAddServer(serverData);
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
        <div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Protocol Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Protocolo
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {/* RDP Option */}
                        <label className={`
                            flex items-center gap-3 px-4 py-3
                            rounded-lg border-2 cursor-pointer
                            transition-all
                            ${serverData.protocol === 'rdp'
                                ? 'bg-primary/10 border-primary'
                                : 'bg-white/5 border-dark-border hover:border-primary/50'
                            }
                        `}>
                            <input
                                type="radio"
                                name="protocol"
                                value="rdp"
                                checked={serverData.protocol === 'rdp'}
                                onChange={handleInputChange}
                                className="hidden"
                            />
                            <div className="flex-1">
                                <span className={`block text-sm font-semibold ${serverData.protocol === 'rdp' ? 'text-primary' : 'text-white'}`}>
                                    RDP
                                </span>
                                <span className="block text-xs text-gray-400">
                                    Remote Desktop Protocol
                                </span>
                            </div>
                            <ComputerIcon sx={{ fontSize: 20 }} className={serverData.protocol === 'rdp' ? 'text-primary' : 'text-gray-500'} />
                        </label>

                        {/* SSH Option */}
                        <label className={`
                            flex items-center gap-3 px-4 py-3
                            rounded-lg border-2 cursor-pointer
                            transition-all
                            ${serverData.protocol === 'ssh'
                                ? 'bg-primary/10 border-primary'
                                : 'bg-white/5 border-dark-border hover:border-primary/50'
                            }
                        `}>
                            <input
                                type="radio"
                                name="protocol"
                                value="ssh"
                                checked={serverData.protocol === 'ssh'}
                                onChange={handleInputChange}
                                className="hidden"
                            />
                            <div className="flex-1">
                                <span className={`block text-sm font-semibold ${serverData.protocol === 'ssh' ? 'text-primary' : 'text-white'}`}>
                                    SSH
                                </span>
                                <span className="block text-xs text-gray-400">
                                    Secure Shell
                                </span>
                            </div>
                            <TerminalIcon sx={{ fontSize: 20 }} className={serverData.protocol === 'ssh' ? 'text-primary' : 'text-gray-500'} />
                        </label>
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
                            autoFocus
                            placeholder="Ex: Servidor Financeiro"
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
                            value={serverData.ipAddress}
                            onChange={handleInputChange}
                            className={`${inputBaseClass} ${errors.ipAddress ? inputErrorClass : ''}`}
                            placeholder="Ex: 192.168.1.100 ou srv-fin.local"
                        />
                    </div>
                    {errors.ipAddress && <span className="text-xs text-red-400 mt-1 block">{errors.ipAddress}</span>}
                </div>

                {/* Usuário e Senha */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Usuário
                        </label>
                        <div className="relative">
                            <PersonOutlineIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                            <input
                                type="text"
                                name="username"
                                value={serverData.username}
                                onChange={handleInputChange}
                                className={inputBaseClass}
                                placeholder="Ex: admin"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Senha
                        </label>
                        <div className="relative">
                            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                            <input
                                type="password"
                                name="password"
                                value={serverData.password}
                                onChange={handleInputChange}
                                className={inputBaseClass}
                                placeholder="Opcional"
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
                                placeholder="Ex: EMPRESA (Opcional)"
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
                                type="text"
                                name="port"
                                value={serverData.port}
                                onChange={handleInputChange}
                                className={inputBaseClass}
                                placeholder="Padrão: 22"
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

export default AddServerForm;
