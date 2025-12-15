// src/components/layout/Header.js
// ✨ v4.8: Migrado para Tailwind CSS
import React from 'react';
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
    onShowQuickConnect,
    isSidebarCollapsed = false
}) {
    // Mapeamento de views para breadcrumbs
    const viewTitles = {
        'Dashboard': 'Dashboard de Monitoramento',
        'RDP/SSH': 'Servidores RDP/SSH',
        'VNC': 'Conexões VNC',
        'VNC Wall': 'Parede VNC'
    };

    // Classes base para botões de ação
    const btnBase = `
        flex items-center gap-2 px-4 py-2.5 
        bg-cream-50 dark:bg-dark-bg 
        border-2 border-gray-200 dark:border-gray-700 
        rounded-xl text-gray-500 dark:text-gray-400 
        text-sm font-semibold cursor-pointer 
        transition-all duration-200
        hover:bg-white dark:hover:bg-dark-surface 
        hover:border-primary hover:text-primary
        hover:-translate-y-0.5
    `;

    const btnActive = `
        !bg-gradient-to-br !from-primary !to-primary-hover
        !border-primary !text-white
        shadow-lg shadow-primary/30
    `;

    const btnQuickConnect = `
        !bg-gradient-to-br !from-orange-500 !to-orange-600
        !border-orange-500 !text-white
        hover:!from-orange-400 hover:!to-orange-500
        hover:shadow-lg hover:shadow-orange-500/35
    `;

    return (
        <header className={`
            fixed top-0 right-0 h-[70px]
            ${isSidebarCollapsed ? 'left-[72px]' : 'left-[260px]'}
            bg-cream-100/95 dark:bg-dark-surface/95
            border-b border-gray-200 dark:border-gray-700
            flex items-center justify-between
            px-8 gap-8 z-[90]
            transition-[left] duration-300 ease-out
            backdrop-blur-lg
            shadow-sm
        `}>
            {/* Left: Breadcrumb */}
            <div className="flex flex-col gap-1 min-w-[200px] lg:min-w-0">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white m-0 leading-tight">
                    {viewTitles[activeView] || activeView}
                </h1>
                <div className="hidden lg:flex items-center gap-1.5 text-sm text-gray-500">
                    <span className="cursor-pointer hover:text-primary transition-colors">Home</span>
                    <span className="opacity-50">›</span>
                    <span className="text-primary font-semibold">{activeView}</span>
                </div>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-xl">
                <div className="relative w-full">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none opacity-60" />
                    <input
                        type="text"
                        placeholder="Buscar servidores, grupos ou conexões..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="
                            w-full h-11 pl-12 pr-5
                            bg-cream-50 dark:bg-dark-bg
                            border-2 border-gray-200 dark:border-gray-700
                            rounded-xl text-sm
                            text-slate-900 dark:text-white
                            placeholder:text-gray-400 placeholder:opacity-60
                            transition-all duration-200 outline-none
                            focus:border-primary focus:bg-white dark:focus:bg-dark-surface
                            focus:ring-4 focus:ring-primary/10
                        "
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                {/* Edit Mode Toggle */}
                <button
                    className={`${btnBase} ${isEditModeEnabled ? btnActive : ''}`}
                    onClick={onToggleEditMode}
                    title="Modo Edição"
                >
                    <EditIcon sx={{ fontSize: 20 }} />
                    <span className="hidden lg:inline text-sm">Edição</span>
                </button>

                {/* Test Connectivity */}
                {activeView !== 'VNC Wall' && activeView !== 'Dashboard' && (
                    <button
                        className={btnBase}
                        onClick={onTestConnectivity}
                        title="Testar Conectividade"
                    >
                        <SyncIcon sx={{ fontSize: 20 }} />
                    </button>
                )}

                {/* Quick Connect VNC */}
                {activeView === 'VNC' && (
                    <button
                        className={`${btnBase} ${btnQuickConnect}`}
                        onClick={onShowQuickConnect}
                        title="Conexão VNC Rápida"
                    >
                        <FlashOnIcon sx={{ fontSize: 20 }} />
                        <span className="hidden lg:inline text-sm">Rápida</span>
                    </button>
                )}

                {/* Import AD */}
                {activeView !== 'VNC Wall' && activeView !== 'Dashboard' && (
                    <button
                        className={btnBase}
                        onClick={onShowImportAD}
                        title="Importar do AD"
                    >
                        <CloudDownloadIcon sx={{ fontSize: 20 }} />
                    </button>
                )}

                {/* Bulk Password */}
                {isEditModeEnabled && activeView !== 'VNC Wall' && activeView !== 'Dashboard' && (
                    <button
                        className={btnBase}
                        onClick={onShowBulkPassword}
                        title="Alterar Senha Global"
                    >
                        <LockIcon sx={{ fontSize: 20 }} />
                    </button>
                )}

                {/* New Group */}
                {activeView !== 'VNC Wall' && activeView !== 'Dashboard' && (
                    <button
                        className={btnBase}
                        onClick={onShowAddGroup}
                        title="Novo Grupo"
                    >
                        <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                    </button>
                )}

                {/* View Mode Toggle */}
                {activeView !== 'VNC Wall' && activeView !== 'Dashboard' && (
                    <button
                        className={btnBase}
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
                        className={btnBase}
                        onClick={onToggleAllCollapsed}
                        title={
                            allGroupsCollapsed === null ? 'Colapsar Todos os Grupos' :
                                allGroupsCollapsed === true ? 'Expandir Todos os Grupos' :
                                    'Restaurar Estado Individual'
                        }
                    >
                        {allGroupsCollapsed === true ? (
                            <UnfoldMoreIcon sx={{ fontSize: 20 }} />
                        ) : (
                            <UnfoldLessIcon sx={{ fontSize: 20 }} />
                        )}
                    </button>
                )}

                {/* Settings */}
                <button
                    className={btnBase}
                    onClick={onShowGuacamoleConfig}
                    title="Configurar Servidor Guacamole"
                >
                    <SettingsIcon sx={{ fontSize: 20 }} />
                </button>

                {/* User Avatar */}
                <div className="ml-2">
                    <div className="
                        w-10 h-10 
                        bg-gradient-to-br from-primary to-primary-hover
                        rounded-full flex items-center justify-center
                        text-white cursor-pointer
                        transition-all duration-200
                        shadow-md shadow-primary/25
                        hover:-translate-y-0.5
                        hover:shadow-lg hover:shadow-primary/35
                    ">
                        <PersonIcon sx={{ fontSize: 20 }} />
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
