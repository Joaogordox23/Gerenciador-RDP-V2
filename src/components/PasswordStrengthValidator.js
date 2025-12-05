// PasswordStrengthValidator.js - Componente React para validação de senha forte
import React, { useState, useEffect } from 'react';
import { LockIcon } from './MuiIcons';

/**
 * Valida força da senha
 * @param {string} password  - Senha a ser validada
 * @returns {object} - { score: 0-4, feedback: string, isValid: boolean }
 */
export function validatePasswordStrength(password) {
    if (!password) {
        return { score: 0, feedback: 'Digite uma senha', isValid: false, level: 'none' };
    }

    let score = 0;
    const feedback = [];

    // Critério 1: Tamanho (mínimo 8 caracteres)
    if (password.length >= 8) {
        score++;
    } else {
        feedback.push('Mínimo 8 caracteres');
    }

    // Critério 2: Letra minúscula
    if (/[a-z]/.test(password)) {
        score++;
    } else {
        feedback.push('Adicione letra minúsc ula');
    }

    // Critério 3: Letra maiúscula
    if (/[A-Z]/.test(password)) {
        score++;
    } else {
        feedback.push('Adicione letra MAIÚSCULA');
    }

    // Critério 4: Número
    if (/[0-9]/.test(password)) {
        score++;
    } else {
        feedback.push('Adicione número');
    }

    // Critério bônus: Caractere especial
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        score++;
    }

    const levels = {
        0: { level: 'none', text: 'Sem senha', color: '#858585' },
        1: { level: 'weak', text: 'Muito fraca', color: '#E02040' },
        2: { level: 'fair', text: 'Fraca', color: '#FF8C00' },
        3: { level: 'good', text: 'Boa', color: '#FFB020' },
        4: { level: 'strong', text: 'Forte', color: '#00B368' },
        5: { level: 'very-strong', text: 'Muito forte', color: '#00D580' }
    };

    const result = levels[score] || levels[0];

    return {
        score,
        ...result,
        feedback: feedback.join(', '),
        isValid: score >= 4 // Requer ao menos 8 caracteres + minúscula + maiúscula + número
    };
}

/**
 * Componente visual de força de senha
 */
export function PasswordStrengthIndicator({ password, showRequirements = false }) {
    const [strength, setStrength] = useState(validatePasswordStrength(''));

    useEffect(() => {
        const result = validatePasswordStrength(password);
        setStrength(result);
    }, [password]);

    if (!password && !showRequirements) return null;

    return (
        <div className="password-strength-indicator" style={{ marginTop: '8px' }}>
            {/* Barra de força */}
            <div className="strength-bar-container" style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '8px'
            }}>
                {[1, 2, 3, 4].map((level) => (
                    <div
                        key={level}
                        className={`strength-bar-segment ${strength.score >= level ? 'filled' : ''}`}
                        style={{
                            flex: 1,
                            height: '4px',
                            backgroundColor: strength.score >= level ? strength.color : '#E5E7EB',
                            borderRadius: '2px',
                            transition: 'background-color 0.3s ease'
                        }}
                    />
                ))}
            </div>

            {/* Texto de força */}
            {password && (
                <div className="strength-text" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: strength.color,
                    fontWeight: 500
                }}>
                    <LockIcon sx={{ fontSize: 14 }} />
                    <span>Senha {strength.text}</span>
                </div>
            )}

            {/* Feedback de requisitos */}
            {strength.feedback && !strength.isValid && (
                <div className="strength-feedback" style={{
                    fontSize: '11px',
                    color: '#6B7280',
                    marginTop: '4px'
                }}>
                    {strength.feedback}
                </div>
            )}

            {/* Lista de requisitos (opcional) */}
            {showRequirements && (
                <div className="password-requirements" style={{
                    fontSize: '11px',
                    color: '#6B7280',
                    marginTop: '8px',
                    paddingLeft: '8px'
                }}>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>Requisitos de senha:</div>
                    <ul style={{ margin: 0, paddingLeft: '16px' }}>
                        <li style={{ color: password.length >= 8 ? '#00B368' : '#6B7280' }}>
                            Mínimo 8 caracteres
                        </li>
                        <li style={{ color: /[a-z]/.test(password) ? '#00B368' : '#6B7280' }}>
                            Pelo menos uma letra minúscula
                        </li>
                        <li style={{ color: /[A-Z]/.test(password) ? '#00B368' : '#6B7280' }}>
                            Pelo menos uma letra MAIÚSCULA
                        </li>
                        <li style={{ color: /[0-9]/.test(password) ? '#00B368' : '#6B7280' }}>
                            Pelo menos um número
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}

export default PasswordStrengthIndicator;
