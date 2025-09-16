// src/components/VncDisplay.js

import React, { useEffect, useRef } from 'react';
import RFB from '@novnc/novnc/core/rfb';

// Componente que irá renderizar a tela da conexão VNC
function VncDisplay({ connectionInfo, onDisconnect }) {
    // useRef é usado para obter uma referência direta ao elemento <canvas>
    // onde o noVNC irá "desenhar" a tela remota.
    const vncCanvasRef = useRef(null);
    const rfbRef = useRef(null); // Para manter a instância da conexão RFB

    // useEffect é o lugar perfeito para conectar e desconectar,
    // pois ele lida com o ciclo de vida do componente.
    useEffect(() => {
    if (!connectionInfo || !connectionInfo.proxyUrl || !vncCanvasRef.current) {
        return;
    }

    // Pega a URL do proxy e a senha do objeto de conexão
    const { proxyUrl, password } = connectionInfo;
    
    // Agora, a URL já é a do nosso proxy local (ex: ws://localhost:6080)
    const rfb = new RFB(vncCanvasRef.current, proxyUrl, {
        credentials: { password: password },
    });

    rfb.addEventListener('connect', () => {
        console.log('✅ Conexão VNC via proxy estabelecida com sucesso!');
    });

    rfb.addEventListener('disconnect', (event) => {
        // O evento de desconexão pode ter detalhes úteis sobre o erro
        console.log('🔌 Conexão VNC via proxy encerrada.', event.detail);
        onDisconnect();
    });
    
    rfb.addEventListener('credentialsrequired', () => {
        console.warn('🔒 Servidor VNC requer credenciais, mas nenhuma foi fornecida.');
    });


    rfbRef.current = rfb;

    return () => {
        if (rfbRef.current) {
            rfbRef.current.disconnect();
            rfbRef.current = null;
        }
    };
}, [connectionInfo, onDisconnect]); // O efeito depende dessas props

    if (!connectionInfo) {
        return null;
    }

    return (
        <div className="vnc-display-overlay">
            <div className="vnc-toolbar">
                <div className="vnc-toolbar-info">
                    Conectado a: <strong>{connectionInfo.name}</strong> ({connectionInfo.ipAddress})
                </div>
                <button onClick={onDisconnect} className="vnc-disconnect-btn">
                    Desconectar
                </button>
            </div>
            {/* O noVNC precisa de um elemento para renderizar a tela. 
                Usamos a ref que criamos para ligar o noVNC a este div. */}
            <div ref={vncCanvasRef} className="vnc-canvas"></div>
        </div>
    );
}

export default VncDisplay;