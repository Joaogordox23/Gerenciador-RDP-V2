// src/components/AddGroupForm.js - VERSÃO MIGRADA PARA TAILWIND

import React, { useState } from 'react';
import {
    FolderIcon,
    InfoIcon,
    CloseIcon,
    CheckCircleIcon,
    HourglassEmptyIcon,
    WarningAmberIcon,
    CheckIcon,
    CancelIcon
} from './MuiIcons';

function AddGroupForm({ onAddGroup, onCancel }) {
    // Estados do formulário
    const [groupName, setGroupName] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ==========================
    // VALIDAÇÃO EM TEMPO REAL
    // ==========================
    const validateGroupName = (name) => {
        if (!name.trim()) {
            return 'Nome do grupo é obrigatório';
        }
        if (name.trim().length < 2) {
            return 'Nome deve ter pelo menos 2 caracteres';
        }
        if (name.trim().length > 50) {
            return 'Nome deve ter no máximo 50 caracteres';
        }
        if (!/^[a-zA-Z0-9\s\-_áéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]+$/.test(name.trim())) {
            return 'Nome pode conter apenas letras, números, espaços e hífens';
        }
        return '';
    };

    // ==========================
    // HANDLERS
    // ==========================
    const handleInputChange = (event) => {
        const value = event.target.value;
        setGroupName(value);

        // Validação em tempo real
        const validationError = validateGroupName(value);
        setError(validationError);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const validationError = validateGroupName(groupName);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            onAddGroup(groupName.trim());
        } catch (err) {
            setError('Erro ao criar grupo. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Input border classes
    const getInputBorderClass = () => {
        if (error) return 'border-red-500 focus:ring-red-500/20';
        if (groupName.trim()) return 'border-green-500 focus:ring-green-500/20';
        return 'border-white/10 focus:border-primary focus:ring-primary/20';
    };

    // ==========================
    // RENDER
    // ==========================
    return (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {/* Input Container */}
            <div className="flex flex-col gap-2">
                {/* Input Wrapper */}
                <div className="relative flex items-center">
                    {/* Icon */}
                    <div className="absolute left-3 z-10 flex items-center justify-center pointer-events-none">
                        <FolderIcon sx={{ fontSize: 20 }} className="text-primary" />
                    </div>

                    {/* Input */}
                    <input
                        type="text"
                        value={groupName}
                        onChange={handleInputChange}
                        placeholder="Ex: Servidores de Produção"
                        className={`
                            w-full h-11 pl-11 pr-10 py-3
                            rounded-lg border-2
                            bg-white/5 text-white text-sm
                            placeholder-gray-400/60
                            outline-none
                            transition-all duration-200
                            focus:bg-white/10 focus:ring-4
                            dark:bg-white/5
                            ${getInputBorderClass()}
                        `}
                        disabled={isSubmitting}
                        maxLength={50}
                        autoFocus
                    />

                    {/* Indicator */}
                    <div className="absolute right-3 z-10 flex items-center justify-center">
                        {groupName.trim() && !error && (
                            <CheckIcon sx={{ fontSize: 18 }} className="text-green-500" />
                        )}
                        {error && (
                            <CancelIcon sx={{ fontSize: 18 }} className="text-red-500" />
                        )}
                    </div>
                </div>

                {/* Character Counter */}
                <div className="text-right text-xs text-gray-400">
                    <span className={groupName.length > 40 ? 'text-amber-400' : ''}>
                        {groupName.length}/50
                    </span>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="
                        flex items-center gap-1.5
                        px-3 py-2.5 rounded-lg
                        bg-red-500/10 border border-red-500/20
                        text-red-400 text-xs
                    ">
                        <WarningAmberIcon sx={{ fontSize: 18 }} />
                        <span className="flex-1">{error}</span>
                    </div>
                )}

                {/* Hint Message */}
                {!error && groupName.length === 0 && (
                    <div className="
                        flex items-center gap-1.5
                        px-3 py-2.5 rounded-lg
                        bg-primary/10 border border-primary/20
                        text-gray-400 text-xs
                    ">
                        <InfoIcon sx={{ fontSize: 18 }} className="text-primary" />
                        <span className="flex-1">
                            Use nomes descritivos como "Desenvolvimento", "Produção", etc.
                        </span>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-2 border-t border-white/10 dark:border-white/10">
                {/* Cancel Button */}
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="
                        h-10 px-5 rounded-lg
                        inline-flex items-center justify-center gap-2
                        bg-white/5 border-2 border-white/10
                        text-gray-400 text-sm font-semibold
                        hover:bg-white/10 hover:border-white/20 hover:text-white
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all cursor-pointer
                    "
                >
                    <CloseIcon sx={{ fontSize: 18 }} />
                    <span className="whitespace-nowrap">Cancelar</span>
                </button>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!groupName.trim() || error || isSubmitting}
                    className={`
                        h-10 px-5 rounded-lg
                        inline-flex items-center justify-center gap-2
                        bg-gradient-to-br from-primary to-teal-600
                        text-black text-sm font-semibold
                        shadow-lg shadow-primary/30
                        hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40
                        active:translate-y-0 active:shadow-md
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0
                        transition-all cursor-pointer
                        ${isSubmitting ? 'pointer-events-none' : ''}
                    `}
                >
                    <span className="flex items-center justify-center">
                        {isSubmitting ? (
                            <HourglassEmptyIcon sx={{ fontSize: 18 }} className="animate-spin" />
                        ) : (
                            <CheckCircleIcon sx={{ fontSize: 18 }} />
                        )}
                    </span>
                    <span className="whitespace-nowrap">
                        {isSubmitting ? 'Criando...' : 'Criar Grupo'}
                    </span>
                </button>
            </div>

            {/* Progress Bar */}
            {isSubmitting && (
                <div className="h-0.5 bg-white/10 rounded overflow-hidden mt-2">
                    <div className="
                        h-full w-full
                        bg-gradient-to-r from-primary to-teal-300
                        animate-[progress_1s_ease-in-out_infinite]
                    " />
                </div>
            )}
        </form>
    );
}

export default AddGroupForm;