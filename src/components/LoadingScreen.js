import React from 'react';
import { RocketIcon } from 'lucide-react';
import '../App.css';

const LoadingScreen = () => {
    return (
        <div className="loading-screen-overlay">
            <div className="loading-popup glass-panel">
                <div className="rocket-container">
                    <div className="rocket-orbit"></div>
                    <RocketIcon className="rocket-icon" size={48} />
                    <div className="rocket-particles">
                        <span></span><span></span><span></span>
                    </div>
                </div>
                <h2 className="loading-title">Iniciando Propulsores</h2>
                <p className="loading-subtitle">Preparando ambiente de alta performance...</p>

                <div className="loading-progress-bar">
                    <div className="loading-progress-fill"></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
