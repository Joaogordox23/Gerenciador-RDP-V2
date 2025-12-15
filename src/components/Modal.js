// src/components/Modal.js
// ✨ v4.8: Migrado para Tailwind CSS
import React, { useEffect } from 'react';
import { CloseIcon } from './MuiIcons';

function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
        return () => document.body.classList.remove('overflow-hidden');
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleContentClick = (e) => e.stopPropagation();

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl'
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 
            bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className={`${sizeClasses[size] || sizeClasses.md} w-full 
                bg-cream-100 dark:bg-dark-surface 
                border border-gray-200 dark:border-gray-700 
                rounded-2xl shadow-2xl overflow-hidden animate-slide-up`}
                onClick={handleContentClick}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 
                    bg-cream-50/50 dark:bg-dark-bg/50 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                    <button
                        className="p-2 rounded-lg text-gray-500 hover:bg-red-500/20 hover:text-red-500 transition-all"
                        onClick={onClose}
                        title="Fechar (ESC)"
                    >
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>
                {/* Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Modal;