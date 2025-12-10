/**
 * ConnectionTabsContainer.js
 * Gerenciador de múltiplas conexões em abas
 * Permite acessar vários servidores simultaneamente
 */

import React, { useCallback, useMemo } from 'react';
import { useModals } from '../contexts/ModalContext';
import VncViewerModal from './VncViewerModal';
import ConnectionViewerModal from './ConnectionViewerModal';
import { CloseIcon, MonitorIcon, TerminalIcon } from './MuiIcons';
import './ConnectionTabsContainer.css';

function ConnectionTabsContainer() {
    const {
        tabConnections,
        activeTabId,
        removeTabConnection,
        switchToTab
    } = useModals();

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

    return (
        <div className="connection-tabs-container">
            {/* Barra de Abas */}
            <div className="connection-tabs-bar">
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

            {/* Viewer da Aba Ativa */}
            <div className="connection-tabs-content">
                {activeTab && activeTab.type === 'vnc' && (
                    <VncViewerModal
                        connectionInfo={activeTab.info}
                        onClose={handleCloseActiveTab}
                    />
                )}
                {activeTab && (activeTab.type === 'rdp' || activeTab.type === 'ssh') && (
                    <ConnectionViewerModal
                        connectionInfo={activeTab.info}
                        onClose={handleCloseActiveTab}
                    />
                )}
            </div>
        </div>
    );
}

export default ConnectionTabsContainer;

