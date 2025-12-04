// src/components/AddGroupForm.js - VERSÃO AJUSTADA PARA MODAL

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
import './AddGroupForm.css'; // Importando o novo CSS

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

    // ==========================
    // RENDER
    // ==========================
    return (
        <form className="add-group-form" onSubmit={handleSubmit}>
            <div className="add-group-input-container">
                <div className="add-group-input-wrapper">
                    <div className="add-group-input-icon">
                        <FolderIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    </div>

                    <input
                        type="text"
                        value={groupName}
                        onChange={handleInputChange}
                        placeholder="Ex: Servidores de Produção"
                        className={`add-group-input ${error ? 'error' : ''} ${groupName.trim() && !error ? 'valid' : ''}`}
                        disabled={isSubmitting}
                        maxLength={50}
                        autoFocus
                    />

                    <div className="add-group-input-indicator">
                        {groupName.trim() && !error && (
                            <CheckIcon sx={{ fontSize: 18, color: 'success.main' }} />
                        )}
                        {error && (
                            <CancelIcon sx={{ fontSize: 18, color: 'error.main' }} />
                        )}
                    </div>
                </div>

                <div className="add-group-char-counter">
                    <span className={groupName.length > 40 ? 'warning' : ''}>
                        {groupName.length}/50
                    </span>
                </div>

                {error && (
                    <div className="add-group-error">
                        <WarningAmberIcon sx={{ fontSize: 18, color: 'error.main', marginRight: '6px' }} />
                        <span className="error-text">{error}</span>
                    </div>
                )}

                {!error && groupName.length === 0 && (
                    <div className="add-group-hint">
                        <InfoIcon sx={{ fontSize: 18, color: 'info.main', marginRight: '6px' }} />
                        <span className="hint-text">
                            Use nomes descritivos como "Desenvolvimento", "Produção", etc.
                        </span>
                    </div>
                )}
            </div>

            <div className="add-group-actions">
                <button
                    type="button"
                    onClick={onCancel}
                    className="add-group-cancel-btn"
                    disabled={isSubmitting}
                >
                    <CloseIcon sx={{ fontSize: 18, marginRight: '6px' }} />
                    <span className="btn-text">Cancelar</span>
                </button>

                <button
                    type="submit"
                    className={`add-group-submit-btn ${isSubmitting ? 'loading' : ''}`}
                    disabled={!groupName.trim() || error || isSubmitting}
                >
                    <span className="btn-icon">
                        {isSubmitting ? (
                            <HourglassEmptyIcon sx={{ fontSize: 18 }} className="rotating" />
                        ) : (
                            <CheckCircleIcon sx={{ fontSize: 18 }} />
                        )}
                    </span>
                    <span className="btn-text">
                        {isSubmitting ? 'Criando...' : 'Criar Grupo'}
                    </span>
                </button>
            </div>

            {isSubmitting && (
                <div className="add-group-progress">
                    <div className="progress-bar"></div>
                </div>
            )}
        </form>
    );
}

export default AddGroupForm;