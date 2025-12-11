// src/components/layout/Header.js
import React from 'react';
import './Header.css';
import {
    SearchIcon,
    EditIcon,
    SyncIcon,
    PersonIcon,
    CloudDownloadIcon,
    AddCircleOutlineIcon,
    LockIcon,
    GridViewIcon,
    ViewListIcon,
    SettingsIcon,
    UnfoldLessIcon,
    UnfoldMoreIcon,
    FlashOnIcon
} from '../MuiIcons';
import { useDebounce } from '../../hooks/useDebounce';

function Header({
    activeView,
    searchTerm,
    onSearchChange,
    isEditModeEnabled,
    onToggleEditMode,
    onTestConnectivity,
    onShowImportAD,
    onShowAddGroup,
    onShowBulkPassword,
    viewMode,
    onToggleViewMode,
    onShowGuacamoleConfig,
    allGroupsCollapsed,
    onToggleAllCollapsed,
    onShowQuickConnect
}) {
    // Mapeamento de views para breadcrumbs
    const viewTitles = {
        'Dashboard': 'Dashboard de Monitoramento',
        'RDP/SSH': 'Servidores RDP/SSH',
        'VNC': 'Conexões VNC',
        'VNC Wall': 'Parede VNC'
    };

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    return (
        <header className="app-header-new">
            {/* Left: Breadcrumb */}
            <div className="header-left">
                <h1 className="header-title">{viewTitles[activeView] || activeView}</h1>
                <div className="header-breadcrumb">
                    <span className="breadcrumb-item">Home</span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-item active">{activeView}</span>
                </div>
            </div>

            {/* Center: Search */}
            <div className="header-center">
                <div className="header-search">
                    <SearchIcon className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar servidores, grupos ou conexões..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="header-right">
                {/* Edit Mode Toggle */}
                <button
                    className={`header-action-btn ${isEditModeEnabled ? 'active' : ''}`}
                    onClick={onToggleEditMode}
                    title="Modo Edição"
                >
                    <EditIcon sx={{ fontSize: 20 }} />
                    <span className="action-label">Edição</span>
                </button>

                {/* Test Connectivity (show only on non-VNC Wall views) */}
                {activeView !== 'VNC Wall' && activeView !== 'Dashboard' && (
                    <button
                        className="header-action-btn"
                        onClick={onTestConnectivity}
                        title="Testar Conectividade"
                    >
                        <SyncIcon sx={{ fontSize: 20 }} />
                    </button>
                )}

                {/* Quick Connect VNC (show only on VNC view) */}
                {activeView === 'VNC' && (
                    <button
                        className="header-action-btn quick-connect-btn"
                        onClick={onShowQuickConnect}
                        title="Conexão VNC Rápida"
                    >
                        <FlashOnIcon sx={{ fontSize: 20 }} />
                        <span className="action-label">Rápida</span>
                    </button>
                )}

                {/* Import AD */}
                {activeView !== 'VNC Wall' && activeView !== 'Dashboard' && (
                    <button
                        className="header-action-btn"
                        onClick={onShowImportAD}
                        title="Importar do AD"
                    >
                        <CloudDownloadIcon sx={{ fontSize: 20 }} />
                    </button>
                )}

                {/* Bulk Password (show only when edit mode is enabled) */}
                {isEditModeEnabled && activeView !== 'VNC Wall' && activeView !== 'Dashboard' && (
                    <button
                        className="header-action-btn"
                        onClick={onShowBulkPassword}
                        title="Alterar Senha Global"
                    >
                        <LockIcon sx={{ fontSize: 20 }} />
                    </button>
                )}

                {/* New Group */}
                {activeView !== 'VNC Wall' && activeView !== 'Dashboard' && (
                    <button
                        className="header-action-btn"
                        onClick={onShowAddGroup}
                        title="Novo Grupo"
                    >
                        <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                    </button>
                )}

                {/* View Mode Toggle */}
                {activeView !== 'VNC Wall' && activeView !== 'Dashboard' && (
                    <button
                        className="header-action-btn"
                        onClick={onToggleViewMode}
                        title={viewMode === 'grid' ? 'Modo Lista' : 'Modo Grid'}
                    >
                        {viewMode === 'grid' ?
                            <ViewListIcon sx={{ fontSize: 20 }} /> :
                            <GridViewIcon sx={{ fontSize: 20 }} />
                        }
                    </button>
                )}

                {/* Collapse/Expand All Groups */}
                {activeView !== 'VNC Wall' && activeView !== 'Dashboard' && (
                    <button
                        className="header-action-btn"
                        onClick={onToggleAllCollapsed}
                        title={allGroupsCollapsed ? 'Expandir Todos os Grupos' : 'Colapsar Todos os Grupos'}
                    >
                        {allGroupsCollapsed ?
                            <UnfoldMoreIcon sx={{ fontSize: 20 }} /> :
                            <UnfoldLessIcon sx={{ fontSize: 20 }} />
                        }
                    </button>
                )}

                {/* Botão de Configuração do Servidor Guacamole */}
                <button
                    className="header-action-btn"
                    onClick={onShowGuacamoleConfig}
                    title="Configurar Servidor Guacamole"
                >
                    <SettingsIcon sx={{ fontSize: 20 }} />
                </button>

                {/* User Avatar (Placeholder) */}
                <div className="header-user">
                    <div className="user-avatar">
                        <PersonIcon sx={{ fontSize: 20 }} />
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
