// src/components/AddVncConnectionForm.js
// Migrado para Tailwind CSS

import React, { useState } from 'react';
import {
    ComputerIcon,
    SettingsEthernetIcon,
    LockIcon,
    VisibilityIcon,
    SaveIcon,
    CancelIcon
} from './MuiIcons';
import PasswordStrengthIndicator from './PasswordStrengthValidator';

function AddVncConnectionForm({ onAddConnection, onCancel }) {
    const [connectionData, setConnectionData] = useState({
        name: '',
        ipAddress: '',
        port: '5900',
        password: '',
        viewOnly: false
    });

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        const newValue = type === 'checkbox' ? checked : value;
        setConnectionData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onAddConnection(connectionData);
    };

    // Input classes
    const inputBaseClass = `
        w-full pl-10 pr-4 py-2.5
        bg-dark-elevated border border-dark-border rounded-lg
        text-white text-sm placeholder-gray-500
        focus:border-primary focus:ring-1 focus:ring-primary/30
        outline-none transition-all
    `;

    return (
        <div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Nome da Conexão */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Nome da Conexão
                    </label>
                    <div className="relative">
                        <ComputerIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                        <input
                            type="text"
                            name="name"
                            value={connectionData.name}
                            onChange={handleInputChange}
                            placeholder="Ex: Servidor Principal"
                            className={inputBaseClass}
                            autoFocus
                        />
                    </div>
                </div>

                {/* IP ou Hostname */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        IP ou Hostname
                    </label>
                    <div className="relative">
                        <SettingsEthernetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                        <input
                            type="text"
                            name="ipAddress"
                            value={connectionData.ipAddress}
                            onChange={handleInputChange}
                            placeholder="Ex: 192.168.1.100"
                            className={inputBaseClass}
                        />
                    </div>
                </div>

                {/* Porta e Senha */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Porta
                        </label>
                        <div className="relative">
                            <SettingsEthernetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                            <input
                                type="number"
                                name="port"
                                value={connectionData.port}
                                onChange={handleInputChange}
                                placeholder="Padrão: 5900"
                                className={inputBaseClass}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Senha (opcional)
                        </label>
                        <div className="relative">
                            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                            <input
                                type="password"
                                name="password"
                                value={connectionData.password}
                                onChange={handleInputChange}
                                placeholder="Máximo 8 caracteres"
                                className={inputBaseClass}
                            />
                        </div>
                        <PasswordStrengthIndicator password={connectionData.password} />
                    </div>
                </div>

                {/* View Only Checkbox */}
                <div>
                    <label className={`
                        flex items-center gap-3 px-4 py-3
                        rounded-lg border-2 cursor-pointer
                        transition-all
                        ${connectionData.viewOnly
                            ? 'bg-primary/10 border-primary'
                            : 'bg-white/5 border-dark-border hover:border-primary/50'
                        }
                    `}>
                        <input
                            type="checkbox"
                            name="viewOnly"
                            checked={connectionData.viewOnly}
                            onChange={handleInputChange}
                            className="w-4.5 h-4.5 accent-primary cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                            <VisibilityIcon
                                sx={{ fontSize: 18 }}
                                className={connectionData.viewOnly ? 'text-primary' : 'text-gray-400'}
                            />
                            <span className={`text-sm font-medium ${connectionData.viewOnly ? 'text-primary' : 'text-white'}`}>
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
                        Adicionar
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddVncConnectionForm;