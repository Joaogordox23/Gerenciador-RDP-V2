// src/components/ConfirmationDialog.js - VERSÃO MELHORADA COM ACESSIBILIDADE

import React, { useEffect, useCallback } from 'react';

function ConfirmationDialog({ message, onConfirm, onCancel, isOpen, title = 'Confirmação' }) {
    // Handler para tecla ESC
    const handleEscapeKey = useCallback((event) => {
        if (event.key === 'Escape' && isOpen) {
            onCancel();
        }
    }, [isOpen, onCancel]);

    // Handler para clique no overlay
    const handleOverlayClick = useCallback((event) => {
        if (event.target.classList.contains('dialog-overlay')) {
            onCancel();
        }
    }, [onCancel]);

    // Adiciona listeners para teclado
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            
            // Impede scroll do body quando dialog está aberto
            document.body.style.overflow = 'hidden';
            
            // Foca o primeiro botão
            setTimeout(() => {
                const firstButton = document.querySelector('.dialog-button.cancel');
                if (firstButton) {
                    firstButton.focus();
                }
            }, 100);
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleEscapeKey]);

    if (!isOpen) {
        return null; // Se não estiver aberto, não renderiza nada
    }

    return (
        <div 
            className="dialog-overlay" 
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-message"
        >
            <div className="dialog-box">
                {/* Cabeçalho do dialog */}
                <div className="dialog-header">
                    <h3 id="dialog-title" className="dialog-title">
                        ⚠️ {title}
                    </h3>
                    <button
                        className="dialog-close"
                        onClick={onCancel}
                        aria-label="Fechar"
                        title="Fechar (ESC)"
                    >
                        ×
                    </button>
                </div>

                {/* Mensagem do dialog */}
                <div className="dialog-content">
                    <p id="dialog-message" className="dialog-message">
                        {message}
                    </p>
                </div>

                {/* Botões de ação */}
                <div className="dialog-buttons">
                    <button
                        className="dialog-button cancel"
                        onClick={onCancel}
                        autoFocus
                        title="Pressione ESC para cancelar"
                    >
                        Cancelar
                    </button>
                    <button
                        className="dialog-button confirm"
                        onClick={onConfirm}
                        title="Confirmar ação"
                    >
                        Confirmar
                    </button>
                </div>

                {/* Dica de atalho */}
                <div className="dialog-hint">
                    <small>💡 Use ESC para cancelar ou clique fora para fechar</small>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationDialog;