// src/components/Modal.js

import React, { useEffect } from 'react';
import { CloseIcon } from './MuiIcons';

function Modal({ isOpen, onClose, title, children }) {
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

    if (!isOpen) {

        return null;
    }

    // Função para parar a propagação de eventos de clique.
    // Isso evita que um clique dentro do modal feche o próprio modal.
    const handleContentClick = (e) => e.stopPropagation();

    return (
        // O overlay é o fundo escurecido que captura o clique para fechar.
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={handleContentClick}>
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