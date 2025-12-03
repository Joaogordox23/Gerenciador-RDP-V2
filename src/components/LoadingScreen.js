import React from 'react';
import { ComputerIcon } from './MuiIcons';
import '../App.css';

const LoadingScreen = () => {
    return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="loading-icon-wrapper">
                    <ComputerIcon sx={{ fontSize: 64, color: 'var(--color-primary)' }} />
                    <div className="loading-ring"></div>
                </div>
                <h2 className="loading-text">Carregando Sistema</h2>
                <p className="loading-subtext">Sincronizando servidores e conexões...</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
