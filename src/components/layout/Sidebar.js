// src/components/layout/Sidebar.js
import React from 'react';
import './Sidebar.css';
import {
    DashboardIcon,
    ComputerIcon,
    VideoLabelIcon,
    GridViewIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    LightModeIcon,
    DarkModeIcon
} from '../MuiIcons';

function Sidebar({ activeView, onViewChange, theme, onThemeToggle, isCollapsed, onToggleCollapse }) {
    const menuItems = [
        { id: 'Dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
        { id: 'RDP/SSH', label: 'RDP/SSH', icon: <ComputerIcon /> },
        { id: 'VNC', label: 'VNC', icon: <VideoLabelIcon /> },
        { id: 'VNC Wall', label: 'VNC Wall', icon: <GridViewIcon /> }
    ];

    return (
        <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Logo Area */}
            <div className="sidebar-logo">
                <div className="logo-icon">
                    <ComputerIcon sx={{ fontSize: 28 }} />
                </div>
                {!isCollapsed && (
                    <div className="logo-text">
                        <div className="logo-title">Gerenciador</div>
                        <div className="logo-subtitle">Conexões</div>
                    </div>
                )}
            </div>

            {/* Navigation Menu */}
            <nav className="sidebar-nav">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                        onClick={() => onViewChange(item.id)}
                        title={isCollapsed ? item.label : ''}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {!isCollapsed && <span className="nav-label">{item.label}</span>}
                    </button>
                ))}
            </nav>

            {/* Sidebar Footer */}
            <div className="sidebar-footer">
                {/* Theme Toggle */}
                <button
                    className="footer-btn theme-toggle"
                    onClick={onThemeToggle}
                    title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                >
                    <span className="nav-icon">
                        {theme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </span>
                    {!isCollapsed && (
                        <span className="nav-label">
                            {theme === 'dark' ? 'Light' : 'Dark'}
                        </span>
                    )}
                </button>

                {/* Collapse Toggle */}
                <button
                    className="footer-btn collapse-toggle"
                    onClick={onToggleCollapse}
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                    {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
