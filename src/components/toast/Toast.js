// src/components/toast/Toast.js

import React from 'react';

// Ícones para cada tipo de notificação
const ICONS = {
    success: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
    error: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
    warning: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>,
};

function Toast({ message, type, onClose }) {
    const toastClass = `toast-item ${type}`;
    const iconClass = `toast-icon ${type}`;
    const IconComponent = ICONS[type] || null;

    return (
        <div className={toastClass}>
            {IconComponent && <div className={iconClass}>{IconComponent}</div>}
            <div className="toast-message">{message}</div>
            <button className="toast-close-button" onClick={onClose}>
                &times;
            </button>
        </div>
    );
}

export default Toast;