// src/components/ConfirmationDialog.js - VERSÃO MELHORADA COM ACESSIBILIDADE

import React, { useEffect, useCallback } from 'react';
import { WarningAmberIcon, InfoIcon, CloseIcon, CheckIcon, CancelIcon } from './MuiIcons';

function ConfirmationDialog({ message, onConfirm, onCancel, isOpen, title = 'Confirmação' }) {
    // Handler para tecla ESC
    const handleEscapeKey = useCallback((event) => {
        if (event.key === 'Escape' && isOpen) {
            onCancel();
        }
    }, [isOpen, onCancel]);

    // Handler para clique no overlay
    const handleOverlayClick = useCallback((event) => {
        if (event.target.classList.contains('modal-overlay')) {
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
                const firstButton = document.querySelector('.btn-cancel');
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
            className="modal-overlay"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-message"
        >
            <div className="modal-content" style={{ maxWidth: '400px' }}>
                {/* Cabeçalho do dialog */}
                <div className="modal-header">
                    <h3 id="dialog-title" className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <WarningAmberIcon sx={{ fontSize: 24, color: 'var(--color-warning)' }} />
                        {title}
                    </h3>
                    <button
                        className="modal-close"
                        onClick={onCancel}
                        aria-label="Fechar"
                        title="Fechar (ESC)"
                    >
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>

                {/* Mensagem do dialog */}
                <div className="modal-body">
                    <p id="dialog-message" style={{ margin: 0 }}>
                        {message}
                    </p>
                </div>

                {/* Botões de ação */}
                <div className="modal-footer">
                    <button
                        className="btn btn--secondary btn-cancel"
                        onClick={onCancel}
                        autoFocus
                        title="Pressione ESC para cancelar"
                    >
                        <CancelIcon sx={{ fontSize: 18, marginRight: '8px' }} />
                        Cancelar
                    </button>
                    <button
                        className="btn btn--primary btn-confirm"
                        onClick={onConfirm}
                        title="Confirmar ação"
                    >
                        <CheckIcon sx={{ fontSize: 18, marginRight: '8px' }} />
                        Confirmar
                    </button>
                </div>

                {/* Dica de atalho */}
                <div style={{ padding: '0 24px 16px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                    <small style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <InfoIcon sx={{ fontSize: 14 }} />
                        Use ESC para cancelar ou clique fora para fechar
                    </small>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationDialog;