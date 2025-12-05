// LoadingOverlay.js - Componente de feedback visual para operações assíncronas
import React from 'react';
import './LoadingOverlay.css';

/**
 * Componente de overlay de loading com spinner e texto
 * @param {string} text - Texto a ser exibido (opcional)
 * @param {string} variant - Variante de estilo: 'default' | 'connecting' | 'testing'
 * @param {boolean} showProgress - Mostrar barra de progresso indeterminada
 */
function LoadingOverlay({ text = 'Carregando...', variant = 'default', showProgress = false }) {
    return (
        <div className={`loading-overlay ${variant}`}>
            <div className="loading-spinner" />
            {text && <span className="loading-text">{text}</span>}
            {showProgress && (
                <div className="loading-progress">
                    <div className="loading-progress-bar" />
                </div>
            )}
        </div>
    );
}

/**
 * Variante com dots pulsantes ao invés de spinner
 */
export function LoadingDots({ text }) {
    return (
        <div className="loading-overlay">
            <div className="loading-pulse-dot">
                <span />
                <span />
                <span />
            </div>
            {text && <span className="loading-text">{text}</span>}
        </div>
    );
}

export default LoadingOverlay;
