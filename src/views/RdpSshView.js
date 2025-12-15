// src/views/RdpSshView.js
// ✨ v4.8: Migrado para Tailwind CSS
import React, { useState, useRef, useCallback } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import Group from '../components/Group';
import { useUI } from '../contexts/UIContext';
import {
    FolderIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ComputerIcon
} from '../components/MuiIcons';

// Icons específicos (inline para manter compatibilidade)
const TerminalIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[14px] h-[14px]">
        <polyline points="4 17 10 11 4 5"></polyline>
        <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
);

const MonitorIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[14px] h-[14px]">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
);

const ServerIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-14 h-14">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
        <line x1="6" y1="6" x2="6.01" y2="6"></line>
        <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>
);

function RdpSshView({
    filteredGroups,
    onDeleteServer,
    onUpdateServer,
    onDeleteGroup,
    onUpdateGroup,
    activeConnections,
    isEditModeEnabled,
    isConnectivityEnabled,
    onShowAddServerModal,
    viewMode = 'grid',
    onEditServer,
    onRemoteConnect,
    onOpenInTab
}) {
    const { allGroupsCollapsed } = useUI();
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('rdp-ssh-sidebar-collapsed');
        return saved === 'true';
    });

    const groupRefs = useRef({});

    const handleUpdateAndFinishEditing = (groupId, newName) => {
        onUpdateGroup(groupId, newName);
        setEditingGroupId(null);
    };

    const toggleSidebar = useCallback(() => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem('rdp-ssh-sidebar-collapsed', newState.toString());
    }, [sidebarCollapsed]);

    const scrollToGroup = useCallback((groupId) => {
        setSelectedGroupId(groupId);
        const groupElement = groupRefs.current[groupId];
        if (groupElement) {
            groupElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            groupElement.classList.add('animate-pulse');
            setTimeout(() => {
                groupElement.classList.remove('animate-pulse');
            }, 1000);
        }
    }, []);

    // Calcular estatísticas
    const totalServers = filteredGroups.reduce((acc, g) => acc + (g.servers?.length || 0), 0);
    const rdpCount = filteredGroups.reduce((acc, g) =>
        acc + (g.servers?.filter(s => (s.protocol || 'rdp') === 'rdp').length || 0), 0);
    const sshCount = filteredGroups.reduce((acc, g) =>
        acc + (g.servers?.filter(s => s.protocol === 'ssh').length || 0), 0);

    // Encontrar conexões ativas
    const activeServersList = filteredGroups
        .flatMap(g => g.servers || [])
        .filter(s => activeConnections.includes(s.id));

    return (
        <div className="flex h-[calc(100vh-140px)] gap-4 p-4">
            {/* === SIDEBAR === */}
            <div className={`
                ${sidebarCollapsed ? 'w-14 min-w-14 max-w-14 px-2 py-3' : 'w-[280px] min-w-[280px] max-w-[280px] p-4'}
                bg-cream-100 dark:bg-dark-surface
                border border-gray-200 dark:border-gray-700
                rounded-xl flex flex-col
                shadow-lg transition-all duration-300 ease-out overflow-hidden
            `}>
                {/* Header da Sidebar */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-primary">
                    <h3 className="flex items-center gap-2 m-0 text-sm font-bold text-slate-900 dark:text-white">
                        <span className="text-primary"><TerminalIcon /></span>
                        {!sidebarCollapsed && <span>Navegação</span>}
                    </h3>
                    <button
                        className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 
                            bg-cream-50 dark:bg-dark-bg text-gray-500 
                            cursor-pointer flex items-center justify-center shrink-0
                            transition-all duration-200
                            hover:bg-primary hover:text-black hover:border-primary hover:scale-105"
                        onClick={toggleSidebar}
                        title={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                    >
                        {sidebarCollapsed ? <ChevronRightIcon sx={{ fontSize: 16 }} /> : <ChevronLeftIcon sx={{ fontSize: 16 }} />}
                    </button>
                </div>

                {/* Conexões Ativas */}
                {activeServersList.length > 0 && !sidebarCollapsed && (
                    <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-4 animate-fade-in">
                        <div className="flex items-center gap-2 mb-2.5 text-xs font-semibold text-slate-900 dark:text-white">
                            <MonitorIcon />
                            <span>Conexões Ativas</span>
                            <span className="bg-gradient-to-br from-primary to-primary-hover text-black px-2 py-0.5 rounded-full text-[11px] font-bold shadow-md shadow-primary/30">
                                {activeServersList.length}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto">
                            {activeServersList.map(server => (
                                <div
                                    key={server.id}
                                    className="flex items-center gap-2 px-2.5 py-2 
                                        bg-cream-50 dark:bg-dark-bg 
                                        border border-gray-200 dark:border-gray-700 
                                        rounded-md cursor-pointer text-xs text-slate-900 dark:text-white
                                        transition-all duration-200
                                        hover:border-primary hover:bg-primary/10"
                                    onClick={() => {
                                        const group = filteredGroups.find(g =>
                                            g.servers?.some(s => s.id === server.id)
                                        );
                                        if (group) scrollToGroup(group.id);
                                    }}
                                >
                                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse"></span>
                                    <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{server.name}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase
                                        ${(server.protocol || 'rdp') === 'rdp'
                                            ? 'bg-blue-400/20 text-blue-400'
                                            : 'bg-orange-400/20 text-orange-400'
                                        }`}
                                    >
                                        {(server.protocol || 'rdp').toUpperCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Lista de Grupos */}
                {!sidebarCollapsed && (
                    <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        {filteredGroups.map(group => (
                            <div
                                key={group.id}
                                className={`flex items-center gap-2.5 px-3.5 py-3
                                    bg-cream-50 dark:bg-dark-bg 
                                    border border-gray-200 dark:border-gray-700
                                    rounded-lg cursor-pointer
                                    transition-all duration-200
                                    hover:bg-primary/10 hover:border-primary hover:translate-x-1
                                    ${selectedGroupId === group.id
                                        ? 'bg-primary/15 border-primary border-l-[3px]'
                                        : ''
                                    }`}
                                onClick={() => scrollToGroup(group.id)}
                            >
                                <span className={`shrink-0 transition-colors duration-200
                                    ${selectedGroupId === group.id ? 'text-primary' : 'text-gray-500'}`}>
                                    <FolderIcon sx={{ fontSize: 18 }} />
                                </span>
                                <span className="flex-1 text-[13px] font-semibold text-slate-900 dark:text-white 
                                    whitespace-nowrap overflow-hidden text-ellipsis">
                                    {group.groupName}
                                </span>
                                <span className="text-[11px] text-gray-500 bg-cream-100 dark:bg-dark-surface px-2 py-0.5 rounded-full shrink-0">
                                    {group.servers?.length || 0}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Estatísticas */}
                {!sidebarCollapsed && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-auto">
                        <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                            <span>Total de Servidores</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{totalServers}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                            <span>RDP</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{rdpCount}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-500">
                            <span>SSH</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{sshCount}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* === ÁREA PRINCIPAL === */}
            <div className="flex-1 overflow-y-auto min-w-0 scroll-smooth">
                <Droppable droppableId="all-groups" type="group">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                            {filteredGroups.length > 0 ? (
                                filteredGroups.map((group, index) => (
                                    <div
                                        key={group.id}
                                        ref={el => groupRefs.current[group.id] = el}
                                    >
                                        <Group
                                            groupInfo={group}
                                            index={index}
                                            onDeleteServer={onDeleteServer}
                                            onUpdateServer={onUpdateServer}
                                            onDeleteGroup={onDeleteGroup}
                                            activeConnections={activeConnections}
                                            isEditModeEnabled={isEditModeEnabled}
                                            isConnectivityEnabled={isConnectivityEnabled}
                                            isEditing={editingGroupId === group.id}
                                            onStartEdit={() => setEditingGroupId(group.id)}
                                            onCancelEdit={() => setEditingGroupId(null)}
                                            onUpdateGroup={handleUpdateAndFinishEditing}
                                            onShowAddServerModal={onShowAddServerModal}
                                            viewMode={viewMode}
                                            onEditServer={onEditServer}
                                            onRemoteConnect={onRemoteConnect}
                                            onOpenInTab={onOpenInTab}
                                            forceCollapsed={allGroupsCollapsed}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-10">
                                    <div className="w-[120px] h-[120px] rounded-full 
                                        bg-gradient-to-br from-primary/10 to-primary/5
                                        flex items-center justify-center mb-6
                                        animate-bounce"
                                    >
                                        <span className="text-primary"><ServerIcon /></span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white m-0 mb-2">
                                        Nenhum servidor encontrado
                                    </h3>
                                    <p className="text-sm text-gray-500 m-0 max-w-xs">
                                        Ative o "Modo Edição" para adicionar grupos e servidores RDP/SSH.
                                    </p>
                                </div>
                            )}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        </div>
    );
}

export default RdpSshView;
