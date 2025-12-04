// src/hooks/useToast.js

import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(currentToasts => currentToasts.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message, type) => {
        const id = idCounter++;
        setToasts(currentToasts => [...currentToasts, { id, message, type }]);

        // Remove o toast automaticamente após 5 segundos
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, [removeToast]);

    // Funções de atalho para facilitar o uso
    const toast = {
        success: (message) => addToast(message, 'success'),
        error: (message) => addToast(message, 'error'),
        warning: (message) => addToast(message, 'warning'),
    };

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
            {children}
        </ToastContext.Provider>
    );
}

// O hook customizado que usaremos nos componentes
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast deve ser usado dentro de um ToastProvider');
    }
    return context;
}