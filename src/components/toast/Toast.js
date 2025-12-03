// src/components/toast/Toast.js
import React from 'react';
import {
    CheckCircleOutlineIcon,
    ErrorOutlineIcon,
    WarningAmberIcon,
    CloseIcon
} from '../MuiIcons';

// Ícones para cada tipo de notificação
const ICONS = {
    success: <CheckCircleOutlineIcon sx={{ fontSize: 24 }} />,
    error: <ErrorOutlineIcon sx={{ fontSize: 24 }} />,
    warning: <WarningAmberIcon sx={{ fontSize: 24 }} />,
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
                <CloseIcon sx={{ fontSize: 16 }} />
            </button>
        </div>
    );
}

export default Toast;