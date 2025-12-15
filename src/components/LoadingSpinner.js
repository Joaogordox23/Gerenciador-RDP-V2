import React from 'react';

/**
 * LoadingSpinner - Premium Glassmorphism Loading Overlay
 * Migrado para Tailwind CSS
 */
function LoadingSpinner({ message = 'Carregando...' }) {
    return (
        <div className="
            fixed inset-0
            bg-black/70 backdrop-blur-xl
            flex items-center justify-center
            z-[9999]
            animate-fade-in
        ">
            <div className="
                bg-dark-surface/95 backdrop-blur-xl backdrop-saturate-150
                border border-dark-border/30
                rounded-2xl
                px-16 py-12 md:px-12 md:py-9 sm:px-9 sm:py-7
                flex flex-col items-center gap-6
                shadow-[0_24px_72px_rgba(0,0,0,0.4),0_12px_36px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]
                animate-scale-in
            ">
                {/* Spinner Container */}
                <div className="relative w-20 h-20 md:w-16 md:h-16 sm:w-13 sm:h-13">
                    {/* Ring 1 - Outer */}
                    <div className="
                        absolute inset-0
                        border-4 border-transparent border-t-primary
                        rounded-full
                        animate-[spin_1.5s_cubic-bezier(0.68,-0.55,0.27,1.55)_infinite]
                    " />

                    {/* Ring 2 - Middle */}
                    <div className="
                        absolute
                        w-[70%] h-[70%]
                        top-[15%] left-[15%]
                        border-4 border-transparent border-t-primary-hover
                        rounded-full
                        animate-[spin_1.2s_cubic-bezier(0.68,-0.55,0.27,1.55)_infinite_-0.5s]
                    " />

                    {/* Ring 3 - Inner */}
                    <div className="
                        absolute
                        w-[40%] h-[40%]
                        top-[30%] left-[30%]
                        border-4 border-transparent border-t-teal-300
                        rounded-full
                        animate-[spin_0.9s_cubic-bezier(0.68,-0.55,0.27,1.55)_infinite_-1s]
                    " />
                </div>

                {/* Message */}
                <p className="
                    m-0 text-base font-semibold
                    text-white text-center
                    animate-pulse
                    md:text-sm sm:text-xs
                ">
                    {message}
                </p>
            </div>
        </div>
    );
}

export default LoadingSpinner;
