/**
 * ConnectionTabsContainer.js
 * Gerenciador de múltiplas conexões em abas
 * Permite acessar vários servidores simultaneamente
 * 
 * Migrado para Tailwind CSS
 */

import React, { useCallback, useMemo } from 'react';
import { useModals } from '../contexts/ModalContext';
import VncViewerModal from './VncViewerModal';
import ConnectionViewerModal from './ConnectionViewerModal';
import SshTerminal from './SshTerminal';
import { CloseIcon, MonitorIcon, TerminalIcon, ChevronLeftIcon } from './MuiIcons';

function ConnectionTabsContainer() {
    const {
        tabConnections,
        activeTabId,
        removeTabConnection,
        switchToTab
    } = useModals();

    // Estado para minimizar o container (voltar para lista)
    const [isMinimized, setIsMinimized] = React.useState(false);

    // Encontra a aba ativa (useMemo para performance)
    const activeTab = useMemo(() =>
        tabConnections.find(tab => tab.id === activeTabId) || null,
        [tabConnections, activeTabId]
    );

    // Fecha uma aba específica
    const handleCloseTab = useCallback((tabId, e) => {
        e.stopPropagation();
        removeTabConnection(tabId);
    }, [removeTabConnection]);

    // Ícone baseado no tipo de conexão
    const getTabIcon = useCallback((type) => {
        switch (type) {
            case 'vnc':
                return <MonitorIcon sx={{ fontSize: 16 }} />;
            case 'ssh':
                return <TerminalIcon sx={{ fontSize: 16 }} />;
            case 'rdp':
            default:
                return <MonitorIcon sx={{ fontSize: 16 }} />;
        }
    }, []);

    // Status indicator colors
    const getStatusClasses = useCallback((status) => {
        switch (status) {
            case 'connected':
                return 'bg-primary';
            case 'error':
                return 'bg-red-500';
            case 'connecting':
            default:
                return 'bg-amber-500 animate-pulse';
        }
    }, []);

    // Se não há abas, não renderiza nada
    if (tabConnections.length === 0) {
        return null;
    }

    // Se minimizado, mostra apenas barra flutuante
    if (isMinimized) {
        return (
            <div className="fixed bottom-20 right-5 z-[9990]">
                <button
                    className="
                        flex items-center gap-2 px-5 py-3
                        bg-gradient-to-br from-dark-surface to-dark-elevated
                        border border-primary rounded-xl
                        text-white text-sm font-semibold
                        shadow-lg shadow-black/30
                        hover:bg-primary hover:text-black
                        hover:-translate-y-0.5
                        transition-all duration-300
                        cursor-pointer
                    "
                    onClick={() => setIsMinimized(false)}
                    title="Restaurar conexões"
                >
                    <MonitorIcon sx={{ fontSize: 16 }} />
                    <span>{tabConnections.length} conexão(ões) ativa(s)</span>
                </button>
            </div>
        );
    }

    return (
        <div className="
            fixed inset-0 z-[9999]
            flex flex-col
            bg-dark-bg
            pb-[env(safe-area-inset-bottom,0)]
        ">
            {/* Barra de Abas */}
            <div className="
                flex items-center
                min-h-[40px] px-2 gap-0.5
                bg-dark-surface
                border-b border-dark-border
                overflow-x-auto
                shrink-0
                scrollbar-thin scrollbar-thumb-dark-border
            ">
                {/* Botão Voltar */}
                <button
                    className="
                        flex items-center justify-center gap-1.5
                        px-3 py-1.5 mr-3
                        bg-primary/15 border border-primary rounded-md
                        text-primary text-xs font-semibold
                        hover:bg-primary hover:text-black
                        transition-all duration-200
                        shrink-0 cursor-pointer
                    "
                    onClick={() => setIsMinimized(true)}
                    title="Voltar para lista de conexões"
                >
                    <ChevronLeftIcon sx={{ fontSize: 16 }} />
                    Voltar
                </button>

                {/* Tabs */}
                {tabConnections.map(tab => (
                    <div
                        key={tab.id}
                        className={`
                            flex items-center gap-2
                            px-3 py-2
                            rounded-t-lg
                            cursor-pointer
                            text-sm
                            min-w-[120px] max-w-[200px]
                            transition-all duration-200
                            relative
                            ${tab.id === activeTabId
                                ? 'bg-dark-bg text-white border-b-2 border-primary'
                                : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                            }
                        `}
                        onClick={() => switchToTab(tab.id)}
                    >
                        {/* Status Indicator */}
                        <span className={`
                            w-2 h-2 rounded-full shrink-0
                            ${getStatusClasses(tab.status)}
                        `} />

                        {/* Icon */}
                        {getTabIcon(tab.type)}

                        {/* Name */}
                        <span className="flex-1 truncate">
                            {tab.info?.name || 'Conexão'}
                        </span>

                        {/* Close Button */}
                        <button
                            className="
                                flex items-center justify-center
                                w-[18px] h-[18px]
                                bg-transparent border-none rounded
                                text-gray-400
                                opacity-60
                                hover:opacity-100 hover:bg-red-500/20 hover:text-red-500
                                transition-all duration-200
                                shrink-0 cursor-pointer
                            "
                            onClick={(e) => handleCloseTab(tab.id, e)}
                            title="Fechar conexão"
                        >
                            <CloseIcon sx={{ fontSize: 14 }} />
                        </button>
                    </div>
                ))}
            </div>

            {/* ✨ v5.0: Renderiza TODAS as abas mantidas montadas  
                Usando visibility em vez de display:none para não desmontar componentes */}
            <div className="flex-1 relative min-h-0">
                {tabConnections.map(tab => (
                    <div
                        key={tab.id}
                        className="flex flex-col absolute inset-0 pb-1 min-h-0"
                        style={{
                            visibility: tab.id === activeTabId ? 'visible' : 'hidden',
                            zIndex: tab.id === activeTabId ? 1 : 0
                        }}
                    >
                        {tab.type === 'vnc' && (
                            <VncViewerModal
                                connectionInfo={tab.info}
                                onClose={() => removeTabConnection(tab.id)}
                            />
                        )}
                        {tab.type === 'rdp' && (
                            <ConnectionViewerModal
                                connectionInfo={tab.info}
                                onClose={() => removeTabConnection(tab.id)}
                            />
                        )}
                        {tab.type === 'ssh' && (
                            <SshTerminal
                                connectionInfo={tab.info}
                                onClose={() => removeTabConnection(tab.id)}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ConnectionTabsContainer;
