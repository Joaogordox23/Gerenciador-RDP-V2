// src/components/LoadingOverlay.js
// ✨ v4.8: Migrado para Tailwind CSS
import React from 'react';

function LoadingOverlay({ text = 'Carregando...', variant = 'default', showProgress = false }) {
    const bgColors = {
        default: 'bg-black/50',
        connecting: 'bg-primary/30',
        testing: 'bg-blue-500/30'
    };

    return (
        <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 
            rounded-xl backdrop-blur-sm ${bgColors[variant] || bgColors.default}`}>
            {/* Spinner */}
            <div className="w-10 h-10 border-4 border-white/30 border-t-primary rounded-full animate-spin" />

            {/* Text */}
            {text && (
                <span className="text-white text-sm font-medium drop-shadow-lg">{text}</span>
            )}

            {/* Progress */}
            {showProgress && (
                <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full animate-pulse w-1/2" />
                </div>
            )}
        </div>
    );
}

export function LoadingDots({ text }) {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 
            bg-black/50 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            {text && (
                <span className="text-white text-sm font-medium drop-shadow-lg">{text}</span>
            )}
        </div>
    );
}

export default LoadingOverlay;
