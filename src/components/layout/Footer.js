// src/components/layout/Footer.js
// ✨ v4.8: Migrado para Tailwind CSS
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshIcon } from '../MuiIcons';

function Footer({ onSyncComplete, isSidebarCollapsed = false }) {
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
        <footer className={`
            fixed bottom-0 right-0 h-10
            ${isSidebarCollapsed ? 'left-[72px]' : 'left-[260px]'}
            bg-cream-100 dark:bg-dark-surface
            border-t border-gray-200 dark:border-gray-700
            flex items-center justify-between
            px-6 z-[90]
            transition-[left] duration-300 ease-out
        `}>
            {/* Left Section: Version */}
            <div className="flex items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 opacity-70">
                    v5.8.0
                </span>
            </div>

            {/* Center Section: Sync Status */}
            <div className="hidden md:flex items-center">
                <span
                    className="text-xs text-gray-500 dark:text-gray-400 opacity-80"
                    title={formatSyncTime(lastSyncTime)}
                >
                    {formatSyncTime(lastSyncTime)}
                </span>
            </div>

            {/* Right Section: DevTools + Sync Button */}
            <div className="flex items-center gap-2">
                {/* DevTools Button (apenas para desenvolvedores) */}
                <button
                    className="
                        flex items-center gap-1
                        px-2 py-1.5
                        bg-cream-50 dark:bg-dark-bg
                        border border-gray-200 dark:border-gray-700
                        rounded-md
                        text-xs font-medium text-gray-400 dark:text-gray-500
                        cursor-pointer
                        transition-all duration-200
                        hover:bg-white dark:hover:bg-dark-surface hover:border-yellow-500 hover:text-yellow-500
                        opacity-50 hover:opacity-100
                    "
                    onClick={() => window.api?.openDevTools?.()}
                    title="Abrir DevTools (F12)"
                >
                    🔧
                </button>

                {/* Sync Button */}
                <button
                    className={`
                        flex items-center gap-1.5 
                        px-3 py-1.5
                        bg-cream-50 dark:bg-dark-bg
                        border border-gray-200 dark:border-gray-700
                        rounded-md
                        text-xs font-medium
                        cursor-pointer
                        transition-all duration-200
                        ${isSyncing
                            ? 'text-primary border-primary opacity-60 cursor-not-allowed'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-dark-surface hover:border-primary hover:text-primary'
                        }
                    `}
                    onClick={handleSync}
                    disabled={isSyncing}
                    title="Sincronizar arquivos do disco"
                >
                    <RefreshIcon
                        className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                    />
                    <span className="hidden md:inline">
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                    </span>
                </button>
            </div>
        </footer>
    );
}

export default Footer;
