// src/components/layout/Footer.js
import React, { useState, useEffect, useCallback } from 'react';
import './Footer.css';
import { RefreshIcon } from '../MuiIcons';

function Footer({ onSyncComplete }) {
    // Estado para última sincronização e loading
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Carregar última sincronização ao montar
    useEffect(() => {
        const loadLastSyncTime = async () => {
            try {
                if (window.api && window.api.db && window.api.db.getLastSyncTime) {
                    const time = await window.api.db.getLastSyncTime();
                    setLastSyncTime(time);
                }
            } catch (error) {
                console.error('Erro ao carregar última sincronização:', error);
            }
        };
        loadLastSyncTime();
    }, []);

    // Handler para sincronização manual
    const handleSync = useCallback(async () => {
        if (isSyncing) return;

        setIsSyncing(true);
        try {
            if (window.api && window.api.db && window.api.db.forceSync) {
                console.log('🔄 Iniciando sincronização manual...');
                const result = await window.api.db.forceSync();

                if (result.success) {
                    setLastSyncTime(result.lastSyncTime);
                    console.log(`✅ Sincronização concluída: ${result.imported} importados`);

                    // Notificar componente pai para atualizar dados
                    if (onSyncComplete && result.groups && result.vncGroups) {
                        onSyncComplete(result.groups, result.vncGroups);
                    }
                } else {
                    console.error('❌ Erro na sincronização:', result.error);
                }
            }
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, onSyncComplete]);

    // Formatar data para exibição
    const formatSyncTime = (isoString) => {
        if (!isoString) return 'Nunca sincronizado';
        try {
            const date = new Date(isoString);
            return `Última sincronização: ${date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })}`;
        } catch {
            return 'Data inválida';
        }
    };

    return (
        <footer className="app-footer">
            <div className="footer-left">
                <span className="footer-version">v4.2.0</span>
            </div>

            <div className="footer-center">
                <span className="sync-status" title={formatSyncTime(lastSyncTime)}>
                    {formatSyncTime(lastSyncTime)}
                </span>
            </div>

            <div className="footer-right">
                <button
                    className={`footer-sync-btn ${isSyncing ? 'syncing' : ''}`}
                    onClick={handleSync}
                    disabled={isSyncing}
                    title="Sincronizar arquivos do disco"
                >
                    <RefreshIcon className={isSyncing ? 'spin' : ''} />
                    <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                </button>
            </div>
        </footer>
    );
}

export default Footer;
