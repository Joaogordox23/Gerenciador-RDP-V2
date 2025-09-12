// src/components/toast/ToastContainer.js

import React from 'react';
import { useToast } from '../../hooks/useToast';
import Toast from './Toast'; // Criaremos este arquivo a seguir

function ToastContainer() {
    const { toasts, removeToast } = useToast();

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

export default ToastContainer;