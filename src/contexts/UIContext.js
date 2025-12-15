// src/contexts/UIContext.js
// Contexto para estados de UI: tema, viewMode, sidebar, search, editMode

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
    // ========== Estados de Tema ==========
    const [theme, setTheme] = useState(null);

    // ========== Estados de Navegação ==========
    const [activeView, setActiveView] = useState('Dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // ========== Estados de Modo de Visualização ==========
    const [rdpViewMode, setRdpViewMode] = useState('grid');
    const [vncViewMode, setVncViewMode] = useState('grid');
    const [appsViewMode, setAppsViewMode] = useState('grid'); // ✨ v4.6

    // ========== Estados de Edição/Busca ==========
    const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // ========== Estado de Colapso de Grupos ==========
    // null = respeitando localStorage de cada grupo (padrão)
    // true = forçar colapsar todos
    // false = forçar expandir todos
    const [allGroupsCollapsed, setAllGroupsCollapsed] = useState(null);

    // ========== Ações ==========
    const toggleTheme = useCallback(() => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const toggleSidebar = useCallback(() => {
        setIsSidebarCollapsed(prev => !prev);
    }, []);

    const toggleEditMode = useCallback(() => {
        setIsEditModeEnabled(prev => !prev);
    }, []);

    // Toggle cíclico: null → true (colapsar) → false (expandir) → null (restaurar)
    const toggleAllCollapsed = useCallback(() => {
        setAllGroupsCollapsed(prev => {
            if (prev === null) return true;  // null → colapsar
            if (prev === true) return false; // colapsado → expandir
            return null;                     // expandido → restaurar padrão
        });
    }, []);

    // ========== Mudar de View (limpa busca e colapso) ==========
    const changeView = useCallback((newView) => {
        setActiveView(newView);
        setSearchTerm(''); // Limpa busca ao mudar de tela
        setAllGroupsCollapsed(null); // Reseta estado de colapso
    }, []);

    // ========== Inicialização do Tema ==========
    useEffect(() => {
        const loadTheme = async () => {
            if (window.api && window.api.getOsTheme) {
                try {
                    const osTheme = await window.api.getOsTheme();
                    setTheme(osTheme);
                } catch (error) {
                    setTheme('dark');
                }
            } else {
                setTheme('dark');
            }
        };
        loadTheme();
    }, []);

    // ========== Persistência do Tema ==========
    useEffect(() => {
        if (theme) {
            document.documentElement.setAttribute('data-color-scheme', theme);
        }
    }, [theme]);

    const value = {
        // Estados
        theme,
        activeView,
        isSidebarCollapsed,
        rdpViewMode,
        vncViewMode,
        appsViewMode,
        isEditModeEnabled,
        searchTerm,
        allGroupsCollapsed,

        // Setters
        setTheme,
        setActiveView,
        setIsSidebarCollapsed,
        setRdpViewMode,
        setVncViewMode,
        setAppsViewMode,
        setIsEditModeEnabled,
        setSearchTerm,
        setAllGroupsCollapsed,

        // Ações
        toggleTheme,
        toggleSidebar,
        toggleEditMode,
        toggleAllCollapsed,
        changeView
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
}

// Hook customizado
export function useUI() {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI deve ser usado dentro de UIProvider');
    }
    return context;
}

export default UIContext;
