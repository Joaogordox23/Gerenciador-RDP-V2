/**
 * ConnectionTabsContainer.js
 * Gerenciador de múltiplas conexões em abas
 * Permite acessar vários servidores simultaneamente
 */

import React, { useCallback, useMemo } from 'react';
import { useModals } from '../contexts/ModalContext';
import VncViewerModal from './VncViewerModal';
import ConnectionViewerModal from './ConnectionViewerModal';
import SshTerminal from './SshTerminal';
import { CloseIcon, MonitorIcon, TerminalIcon, ChevronLeftIcon } from './MuiIcons';
import './ConnectionTabsContainer.css';

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

    // Wrapper para fechar aba ativa
    const handleCloseActiveTab = useCallback(() => {
        if (activeTab) {
            removeTabConnection(activeTab.id);
        }
    }, [activeTab, removeTabConnection]);

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

    // Status indicator
    const getStatusClass = useCallback((status) => {
        switch (status) {
            case 'connected':
                return 'status-connected';
            case 'error':
                return 'status-error';
            case 'connecting':
            default:
                return 'status-connecting';
        }
    }, []);

    // Se não há abas, não renderiza nada
    if (tabConnections.length === 0) {
        return null;
    }

    // Se minimizado, mostra apenas barra flutuante
    if (isMinimized) {
        return (
            <div className="connection-tabs-minimized">
                <button
                    className="tabs-restore-btn"
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
        <div className="connection-tabs-container">
            {/* Barra de Abas */}
            <div className="connection-tabs-bar">
                {/* Botão Voltar */}
                <button
                    className="tabs-back-btn"
                    onClick={() => setIsMinimized(true)}
                    title="Voltar para lista de conexões"
                >
                    <ChevronLeftIcon sx={{ fontSize: 16 }} />
                    Voltar
                </button>

                {tabConnections.map(tab => (
                    <div
                        key={tab.id}
                        className={`connection-tab ${tab.id === activeTabId ? 'active' : ''}`}
                        onClick={() => switchToTab(tab.id)}
                    >
                        <span className={`tab-status ${getStatusClass(tab.status)}`} />
                        {getTabIcon(tab.type)}
                        <span className="tab-name">
                            {tab.info?.name || 'Conexão'}
                        </span>
                        <button
                            className="tab-close-btn"
                            onClick={(e) => handleCloseTab(tab.id, e)}
                            title="Fechar conexão"
                        >
                            <CloseIcon sx={{ fontSize: 14 }} />
                        </button>
                    </div>
                ))}
            </div>

            {/* ✨ v4.5: Renderiza TODAS as abas, mas mostra apenas a ativa
                Isso mantém as conexões SSH/VNC ativas ao trocar de aba */}
            <div className="connection-tabs-content">
                {tabConnections.map(tab => (
                    <div
                        key={tab.id}
                        className={`connection-tab-panel ${tab.id === activeTabId ? 'active' : 'hidden'}`}
                        style={{ display: tab.id === activeTabId ? 'flex' : 'none' }}
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

