// src/components/ConfirmationDialog.js
// ✨ v4.8: Migrado para Tailwind CSS
import React, { useEffect, useCallback } from 'react';
import { WarningAmberIcon, InfoIcon, CloseIcon, CheckIcon, CancelIcon } from './MuiIcons';

function ConfirmationDialog({ message, onConfirm, onCancel, isOpen, title = 'Confirmação' }) {
    const handleEscapeKey = useCallback((event) => {
        if (event.key === 'Escape' && isOpen) onCancel();
    }, [isOpen, onCancel]);

    const handleOverlayClick = useCallback((event) => {
        if (event.target.classList.contains('modal-overlay')) onCancel();
    }, [onCancel]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                const firstButton = document.querySelector('.btn-cancel');
                if (firstButton) firstButton.focus();
            }, 100);
        }
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleEscapeKey]);

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay fixed inset-0 z-[9999] flex items-center justify-center p-4 
                bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
        >
            <div className="max-w-[400px] w-full bg-cream-100 dark:bg-dark-surface 
                border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl 
                overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 
                    bg-cream-50/50 dark:bg-dark-bg/50 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                        <WarningAmberIcon sx={{ fontSize: 24 }} className="text-yellow-500" />
                        {title}
                    </h3>
                    <button
                        className="p-2 rounded-lg text-gray-500 hover:bg-red-500/20 hover:text-red-500 transition-all"
                        onClick={onCancel}
                        title="Fechar (ESC)"
                    >
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 
                    bg-cream-50/30 dark:bg-dark-bg/30 border-t border-gray-200 dark:border-gray-700">
                    <button
                        className="btn-cancel flex items-center gap-2 px-4 py-2 rounded-lg 
                            bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 
                            font-semibold transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                        onClick={onCancel}
                        autoFocus
                    >
                        <CancelIcon sx={{ fontSize: 18 }} />
                        Cancelar
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 rounded-lg 
                            bg-gradient-to-br from-primary to-primary-hover text-white 
                            font-semibold shadow-md shadow-primary/30 transition-all 
                            hover:-translate-y-0.5"
                        onClick={onConfirm}
                    >
                        <CheckIcon sx={{ fontSize: 18 }} />
                        Confirmar
                    </button>
                </div>

                {/* Hint */}
                <div className="px-6 pb-4 flex items-center gap-1 text-xs text-gray-500">
                    <InfoIcon sx={{ fontSize: 14 }} />
                    Use ESC para cancelar ou clique fora para fechar
                </div>
            </div>
        </div>
    );
}

export default ConfirmationDialog;