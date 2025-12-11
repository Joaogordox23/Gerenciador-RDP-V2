// src/components/Modal.js
// Modal base com UX consistente - NÃO fecha ao clicar fora

import React, { useEffect } from 'react';
import { CloseIcon } from './MuiIcons';
import './Modal.css';

function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    // Adiciona/remove classe no body para esconder o footer quando modal está aberto
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }

        // Cleanup ao desmontar
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [isOpen]);

    // Listener para tecla ESC fechar o modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    // Função para parar a propagação de eventos de clique.
    const handleContentClick = (e) => e.stopPropagation();

    // Determina a classe de tamanho
    const sizeClass = size === 'sm' ? 'modal-sm' : size === 'lg' ? 'modal-lg' : 'modal-md';

    return (
        // ✅ CORREÇÃO: O overlay NÃO fecha mais ao clicar fora
        // Para fechar: use o botão X ou pressione ESC
        <div className="modal-overlay">
            <div className={`modal-content ${sizeClass}`} onClick={handleContentClick}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close-btn" onClick={onClose} title="Fechar (ESC)">
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Modal;