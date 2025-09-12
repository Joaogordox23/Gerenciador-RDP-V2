// src/components/AddGroupForm.js - VERSÃO PREMIUM MODERNA
// Formulário de adicionar grupo com design moderno e validação

import React, { useState } from 'react';

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
        
        // Validação final
        const validationError = validateGroupName(groupName);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);
        
        try {
            // Simula delay para mostrar estado de loading
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Chama a função do parent
            onAddGroup(groupName.trim());
            
            // Limpa o formulário
            setGroupName('');
            setError('');
        } catch (err) {
            setError('Erro ao criar grupo. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setGroupName('');
        setError('');
        if (onCancel) {
            onCancel();
        }
    };

    // ==========================
    // RENDER MODERNO
    // ==========================
    return (
        <div className="add-group-form-container">
            <div className="add-group-form-header">
                <h3 className="add-group-form-title">
                    📁 Criar Novo Grupo
                </h3>
                <p className="add-group-form-subtitle">
                    Organize seus servidores em grupos personalizados
                </p>
            </div>

            <form className="add-group-form" onSubmit={handleSubmit}>
                <div className="add-group-input-container">
                    <div className="add-group-input-wrapper">
                        {/* Ícone do campo */}
                        <div className="add-group-input-icon">
                            🗂️
                        </div>
                        
                        {/* Campo de input */}
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
                        
                        {/* Indicador de validação */}
                        <div className="add-group-input-indicator">
                            {groupName.trim() && !error && (
                                <span className="validation-success">✓</span>
                            )}
                            {error && (
                                <span className="validation-error">✗</span>
                            )}
                        </div>
                    </div>

                    {/* Contador de caracteres */}
                    <div className="add-group-char-counter">
                        <span className={groupName.length > 40 ? 'warning' : ''}>
                            {groupName.length}/50
                        </span>
                    </div>

                    {/* Mensagem de erro */}
                    {error && (
                        <div className="add-group-error">
                            <span className="error-icon">⚠️</span>
                            <span className="error-text">{error}</span>
                        </div>
                    )}

                    {/* Dicas de validação */}
                    {!error && groupName.length === 0 && (
                        <div className="add-group-hint">
                            <span className="hint-icon">💡</span>
                            <span className="hint-text">
                                Use nomes descritivos como "Desenvolvimento", "Produção", etc.
                            </span>
                        </div>
                    )}
                </div>

                {/* Ações do formulário */}
                <div className="add-group-actions">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="add-group-cancel-btn"
                        disabled={isSubmitting}
                    >
                        <span className="btn-icon">❌</span>
                        <span className="btn-text">Cancelar</span>
                    </button>
                    
                    <button
                        type="submit"
                        className={`add-group-submit-btn ${isSubmitting ? 'loading' : ''}`}
                        disabled={!groupName.trim() || error || isSubmitting}
                    >
                        <span className="btn-icon">
                            {isSubmitting ? '⏳' : '✅'}
                        </span>
                        <span className="btn-text">
                            {isSubmitting ? 'Criando...' : 'Criar Grupo'}
                        </span>
                    </button>
                </div>

                {/* Barra de progresso para loading */}
                {isSubmitting && (
                    <div className="add-group-progress">
                        <div className="progress-bar"></div>
                    </div>
                )}
            </form>

            {/* Informações extras */}
            <div className="add-group-info">
                <div className="info-item">
                    <span className="info-icon">📊</span>
                    <span className="info-text">
                        Você pode adicionar quantos servidores quiser ao grupo
                    </span>
                </div>
                <div className="info-item">
                    <span className="info-icon">✏️</span>
                    <span className="info-text">
                        O nome do grupo pode ser alterado posteriormente
                    </span>
                </div>
            </div>
        </div>
    );
}

export default AddGroupForm;