// src/components/layout/Sidebar.js
// ✨ v4.8: Migrado para Tailwind CSS
import React from 'react';
import {
    DashboardIcon,
    ComputerIcon,
    VideoLabelIcon,
    GridViewIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    LightModeIcon,
    DarkModeIcon,
    AppsIcon,
    DesktopWindowsIcon
} from '../MuiIcons';

function Sidebar({ activeView, onViewChange, theme, onThemeToggle, isCollapsed, onToggleCollapse }) {
    const menuItems = [
        { id: 'Dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
        { id: 'RDP/SSH', label: 'RDP/SSH', icon: <ComputerIcon /> },
        { id: 'VNC', label: 'VNC', icon: <VideoLabelIcon /> },
        { id: 'VNC Wall', label: 'VNC Wall', icon: <GridViewIcon /> },
        { id: 'AnyDesk', label: 'AnyDesk', icon: <DesktopWindowsIcon />, color: '#EF473A' },
        { id: 'Aplicações', label: 'Aplicações', icon: <AppsIcon /> }
    ];

    return (
        <aside className={`
            fixed left-0 top-0 bottom-0 
            ${isCollapsed ? 'w-[72px]' : 'w-[260px]'}
            bg-gradient-to-b from-cream-100 to-cream-50
            dark:from-dark-surface dark:to-dark-bg
            border-r border-gray-200 dark:border-gray-700
            flex flex-col
            transition-[width] duration-300 ease-out
            z-[100]
            shadow-[2px_0_12px_rgba(0,0,0,0.08)]
        `}>
            {/* Logo Area */}
            <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-200 dark:border-gray-700 min-h-[80px]">
                <div className="
                    flex items-center justify-center
                    w-10 h-10 
                    bg-gradient-to-br from-primary to-primary-hover
                    rounded-xl text-white
                    shrink-0
                    shadow-lg shadow-primary/30
                ">
                    <ComputerIcon sx={{ fontSize: 28 }} />
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col gap-0.5 transition-opacity duration-200">
                        <div className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                            Gerenciador
                        </div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">
                            Conexões
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        className={`
                            flex items-center gap-3 
                            ${isCollapsed ? 'justify-center px-3' : 'px-4'} 
                            py-3 
                            bg-transparent border-none rounded-xl
                            text-gray-500 dark:text-gray-400
                            text-sm font-medium cursor-pointer
                            transition-all duration-200
                            relative overflow-hidden
                            hover:bg-primary/10 hover:text-primary
                            ${activeView === item.id
                                ? 'bg-primary/15 text-primary font-semibold before:scale-y-100'
                                : 'before:scale-y-0'
                            }
                            before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0
                            before:w-[3px] before:bg-primary before:transition-transform before:duration-200
                        `}
                        onClick={() => onViewChange(item.id)}
                        title={isCollapsed ? item.label : ''}
                    >
                        <span className="flex items-center justify-center text-xl shrink-0">
                            {item.icon}
                        </span>
                        {!isCollapsed && (
                            <span className="whitespace-nowrap transition-opacity duration-200">
                                {item.label}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-1">
                {/* Theme Toggle */}
                <button
                    className={`
                        flex items-center gap-3 
                        ${isCollapsed ? 'justify-center' : ''} 
                        px-3 py-2.5
                        bg-transparent 
                        border border-gray-200 dark:border-gray-700
                        rounded-lg
                        text-gray-500 dark:text-gray-400
                        text-sm font-medium cursor-pointer
                        transition-all duration-200
                        hover:bg-gray-100 dark:hover:bg-gray-800
                        hover:border-primary hover:text-primary
                    `}
                    onClick={onThemeToggle}
                    title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                >
                    <span className="flex items-center justify-center text-xl shrink-0">
                        {theme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </span>
                    {!isCollapsed && (
                        <span className="whitespace-nowrap">
                            {theme === 'dark' ? 'Light' : 'Dark'}
                        </span>
                    )}
                </button>

                {/* Collapse Toggle */}
                <button
                    className={`
                        flex items-center 
                        ${isCollapsed ? 'justify-center' : 'justify-center'} 
                        px-3 py-2.5 min-h-[42px]
                        bg-gradient-to-br from-cream-100 to-primary/10
                        dark:from-dark-surface dark:to-primary/20
                        border border-gray-200 dark:border-gray-700
                        rounded-lg
                        text-gray-500 dark:text-gray-400
                        cursor-pointer
                        transition-all duration-200
                        hover:from-primary hover:to-primary/80
                        hover:text-white hover:border-primary
                        hover:-translate-y-0.5
                        hover:shadow-lg hover:shadow-primary/30
                    `}
                    onClick={onToggleCollapse}
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                    {isCollapsed ?
                        <ChevronRightIcon sx={{ fontSize: 20 }} /> :
                        <ChevronLeftIcon sx={{ fontSize: 20 }} />
                    }
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
