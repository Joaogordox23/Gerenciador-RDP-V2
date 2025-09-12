import React, { createContext, useContext, useState, useCallback } from 'react';

// Cria o Contexto que compartilhará a lógica do toast
const ToastContext = createContext(null);

// Um contador simples para garantir que cada toast tenha um ID único
let idCounter = 0;

/**
 * O Provedor (Provider) que envolve a aplicação.
 * Ele gerencia o estado de todos os toasts e fornece as funções para manipulá-los.
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    /**
     * Função para remover um toast da lista, baseada no seu ID.
     * Envolvida em useCallback para otimização.
     */
    const removeToast = useCallback((id) => {
        setToasts(currentToasts => currentToasts.filter(t => t.id !== id));
    }, []);

    /**
     * Função para adicionar um novo toast à lista.
     * Envolvida em useCallback e depende de `removeToast`.
     */
    const addToast = useCallback((message, type) => {
        const id = idCounter++;
        setToasts(currentToasts => [...currentToasts, { id, message, type }]);

        // Define um temporizador para remover o toast automaticamente após 5 segundos
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, [removeToast]);

    // Cria um objeto 'toast' com métodos de atalho para facilitar o uso
    const toast = {
        success: (message) => addToast(message, 'success'),
        error: (message) => addToast(message, 'error'),
        warning: (message) => addToast(message, 'warning'),
    };

    // Fornece o estado e as funções para todos os componentes filhos
    return (
        <ToastContext.Provider value={{ toasts, removeToast, toast }}>
            {children}
        </ToastContext.Provider>
    );
}

/**
 * O Hook customizado que os componentes usarão para acessar a funcionalidade do toast.
 * Isso abstrai a complexidade do useContext.
 */
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        // Garante que o hook seja usado dentro de um ToastProvider
        throw new Error('useToast deve ser usado dentro de um ToastProvider');
    }
    return context;
}

