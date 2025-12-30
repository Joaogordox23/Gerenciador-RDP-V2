// src/views/VncView.js
// ✨ v4.8: Migrado para Tailwind CSS
// ✨ v5.10: Adicionado ping de conexões
// ✨ v5.11: Importação CSV
import React, { useState, useMemo, useRef, useCallback } from 'react';
import VncGroup from '../components/VncGroup';
import VncCsvImportModal from '../components/VncCsvImportModal';
import { useUI } from '../contexts/UIContext';
import { useModals } from '../contexts/ModalContext';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    FolderIcon,
    MonitorIcon,
    CloseIcon,
    RefreshIcon,
    UploadFileIcon
} from '../components/MuiIcons';

function VncView({
    vncGroups,
    onAddGroup,
    isEditModeEnabled,
    onUpdateVncGroup,
    onVncConnect,
    onShowAddConnectionModal,
    viewMode = 'grid',
    ...groupProps
}) {
    const { allGroupsCollapsed } = useUI();
    const { tabConnections, removeTabConnection, switchToTab } = useModals();
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('vnc-sidebar-collapsed');
        return saved === 'true';
    });
    const [selectedGroupId, setSelectedGroupId] = useState(null);

    // ✅ v5.10: Estado para status de ping das conexões
    const [connectionStatus, setConnectionStatus] = useState({});
    const [isPinging, setIsPinging] = useState(false);

    // ✅ v5.11: Estado para modal de importação CSV
    const [showCsvImport, setShowCsvImport] = useState(false);

    // Ref para área principal (scroll)
    const mainAreaRef = useRef(null);
    // Refs para cada grupo
    const groupRefs = useRef({});

    // Filtra apenas conexões VNC ativas
    const activeVncConnections = useMemo(() =>
        tabConnections.filter(tab => tab.type === 'vnc'),
        [tabConnections]
    );

    // IDs das conexões abertas para highlight
    const openConnectionIds = useMemo(() =>
        new Set(activeVncConnections.map(tab => tab.info?.id)),
        [activeVncConnections]
    );

    const handleUpdateAndFinishEditing = (groupId, newName) => {
        onUpdateVncGroup(groupId, newName);
        setEditingGroupId(null);
    };

    // Navegar para grupo específico
    const scrollToGroup = useCallback((groupId) => {
        setSelectedGroupId(groupId);
        const groupElement = groupRefs.current[groupId];
        if (groupElement) {
            groupElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, []);

    // Fechar todas as conexões VNC
    const handleCloseAllVnc = useCallback(() => {
        activeVncConnections.forEach(tab => {
            removeTabConnection(tab.id);
        });
    }, [activeVncConnections, removeTabConnection]);

    // Contagem total de conexões cadastradas
    const totalConnections = useMemo(() => {
        return vncGroups.reduce((acc, g) => acc + (g.connections?.length || 0), 0);
    }, [vncGroups]);

    // ✅ v5.10: Função para pingar todas as conexões
    const checkAllConnections = useCallback(async () => {
        if (isPinging) return;
        setIsPinging(true);

        // Coleta todas as conexões
        const allConnections = vncGroups.flatMap(g => g.connections || []);
        if (allConnections.length === 0) {
            setIsPinging(false);
            return;
        }

        // Marca todas como 'checking'
        const checkingStatus = {};
        allConnections.forEach(conn => {
            checkingStatus[conn.id] = 'checking';
        });
        setConnectionStatus(checkingStatus);

        // Pinga em paralelo (máximo 5 simultâneas para não sobrecarregar)
        const batchSize = 5;
        const results = { ...checkingStatus };

        for (let i = 0; i < allConnections.length; i += batchSize) {
            const batch = allConnections.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(async (conn) => {
                    try {
                        const isOnline = await window.api.vnc.checkAvailability(conn);
                        return { id: conn.id, online: isOnline };
                    } catch {
                        return { id: conn.id, online: false };
                    }
                })
            );

            // Atualiza resultados incrementalmente
            batchResults.forEach(({ id, online }) => {
                results[id] = online;
            });
            setConnectionStatus({ ...results });
        }

        setIsPinging(false);
        console.log(`✅ [VncView] Ping concluído: ${allConnections.length} conexões verificadas`);
    }, [vncGroups, isPinging]);

    return (
        <div className="flex h-[calc(100vh-140px)] gap-4 p-4">
            {/* Sidebar de Navegação Rápida */}
            <div className={`
                ${isSidebarCollapsed ? 'w-14 min-w-14 max-w-14 px-2 py-3' : 'w-[280px] min-w-[280px] max-w-[280px] p-4'}
                bg-cream-100 dark:bg-dark-surface
                border border-gray-200 dark:border-gray-700
                rounded-xl flex flex-col
                shadow-lg transition-all duration-300 ease-out overflow-hidden
            `}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-primary">
                    {!isSidebarCollapsed && (
                        <h3 className="m-0 text-sm font-bold text-slate-900 dark:text-white">
                            Grupos VNC ({totalConnections})
                        </h3>
                    )}
                    <div className="flex items-center gap-1">
                        {/* ✅ v5.10: Botão de Ping */}
                        {!isSidebarCollapsed && (
                            <button
                                className={`w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700
                                    bg-cream-50 dark:bg-dark-bg text-gray-500
                                    cursor-pointer flex items-center justify-center shrink-0
                                    transition-all duration-200
                                    hover:bg-primary hover:text-black hover:border-primary hover:scale-105
                                    ${isPinging ? 'animate-spin' : ''}`}
                                onClick={checkAllConnections}
                                disabled={isPinging}
                                title="Verificar status de todas as conexões"
                            >
                                <RefreshIcon sx={{ fontSize: 16 }} />
                            </button>
                        )}
                        {/* ✅ v5.11: Botão de Importar CSV */}
                        {!isSidebarCollapsed && (
                            <button
                                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700
                                    bg-cream-50 dark:bg-dark-bg text-gray-500
                                    cursor-pointer flex items-center justify-center shrink-0
                                    transition-all duration-200
                                    hover:bg-green-500 hover:text-white hover:border-green-500 hover:scale-105"
                                onClick={() => setShowCsvImport(true)}
                                title="Importar conexões VNC via CSV"
                            >
                                <UploadFileIcon sx={{ fontSize: 16 }} />
                            </button>
                        )}
                        <button
                            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700
                                bg-cream-50 dark:bg-dark-bg text-gray-500
                                cursor-pointer flex items-center justify-center shrink-0
                                transition-all duration-200
                                hover:bg-primary hover:text-black hover:border-primary hover:scale-105"
                            onClick={() => {
                                const newState = !isSidebarCollapsed;
                                setIsSidebarCollapsed(newState);
                                localStorage.setItem('vnc-sidebar-collapsed', newState.toString());
                            }}
                            title={isSidebarCollapsed ? 'Expandir' : 'Recolher'}
                        >
                            {isSidebarCollapsed ?
                                <ChevronRightIcon sx={{ fontSize: 16 }} /> :
                                <ChevronLeftIcon sx={{ fontSize: 16 }} />
                            }
                        </button>
                    </div>
                </div>

                {/* Seção de Conexões Ativas */}
                {activeVncConnections.length > 0 && !isSidebarCollapsed && (
                    <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-4 animate-fade-in">
                        <div className="flex items-center gap-2 mb-2.5 text-xs font-semibold text-slate-900 dark:text-white">
                            <span className="bg-gradient-to-br from-primary to-primary-hover text-black px-2 py-0.5 rounded-full text-[11px] font-bold">
                                {activeVncConnections.length}
                            </span>
                            <span>Conexões Ativas</span>
                            <button
                                className="ml-auto flex items-center gap-1 px-2 py-1 
                                    bg-red-500/10 border border-red-500/30 rounded-md
                                    text-red-500 text-[11px] font-semibold
                                    cursor-pointer transition-all duration-200
                                    hover:bg-red-500/20 hover:border-red-500"
                                onClick={handleCloseAllVnc}
                                title="Fechar todas as conexões"
                            >
                                <CloseIcon sx={{ fontSize: 14 }} />
                                Fechar Todas
                            </button>
                        </div>
                        <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto">
                            {activeVncConnections.map(tab => (
                                <div
                                    key={tab.id}
                                    className="flex items-center gap-2 px-2.5 py-2 
                                        bg-cream-50 dark:bg-dark-bg 
                                        border border-gray-200 dark:border-gray-700 
                                        rounded-md cursor-pointer text-xs
                                        transition-all duration-200
                                        hover:border-primary hover:bg-primary/10"
                                    onClick={() => switchToTab(tab.id)}
                                    title={`Ir para ${tab.info?.name}`}
                                >
                                    <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse
                                        ${tab.status === 'connected' ? 'bg-primary' : 'bg-yellow-500'}`}
                                    ></span>
                                    <MonitorIcon sx={{ fontSize: 14 }} className="text-gray-400" />
                                    <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis text-slate-900 dark:text-white">
                                        {tab.info?.name}
                                    </span>
                                    <button
                                        className="p-1 rounded text-gray-400 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeTabConnection(tab.id);
                                        }}
                                    >
                                        <CloseIcon sx={{ fontSize: 12 }} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Lista de Grupos */}
                {!isSidebarCollapsed && (
                    <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        {vncGroups.map(group => (
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
                                title={`Ir para ${group.groupName}`}
                            >
                                <FolderIcon sx={{ fontSize: 16 }} className={`shrink-0 transition-colors
                                    ${selectedGroupId === group.id ? 'text-primary' : 'text-gray-400'}`}
                                />
                                <span className="flex-1 text-[13px] font-semibold text-slate-900 dark:text-white 
                                    whitespace-nowrap overflow-hidden text-ellipsis">
                                    {group.groupName}
                                </span>
                                <span className="text-[11px] text-gray-500 bg-cream-100 dark:bg-dark-surface px-2 py-0.5 rounded-full shrink-0">
                                    {group.connections?.length || 0}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Área Principal com Grupos */}
            <div className="flex-1 overflow-y-auto min-w-0 scroll-smooth" ref={mainAreaRef}>
                {Array.isArray(vncGroups) && vncGroups.length > 0 ? (
                    vncGroups.map(group => (
                        <div
                            key={group.id}
                            ref={el => groupRefs.current[group.id] = el}
                            className={selectedGroupId === group.id ? 'animate-pulse' : ''}
                        >
                            <VncGroup
                                groupInfo={group}
                                isEditModeEnabled={isEditModeEnabled}
                                isEditing={editingGroupId === group.id}
                                onStartEdit={() => setEditingGroupId(group.id)}
                                onCancelEdit={() => setEditingGroupId(null)}
                                onUpdateVncGroup={handleUpdateAndFinishEditing}
                                onVncConnect={onVncConnect}
                                onShowAddConnectionModal={onShowAddConnectionModal}
                                viewMode={viewMode}
                                forceCollapsed={allGroupsCollapsed}
                                openConnectionIds={openConnectionIds}
                                connectionStatus={connectionStatus}
                                {...groupProps}
                            />
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-10">
                        <div className="w-[100px] h-[100px] rounded-full 
                            bg-gradient-to-br from-primary/10 to-primary/5
                            flex items-center justify-center mb-6"
                        >
                            <MonitorIcon sx={{ fontSize: 48 }} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white m-0 mb-2">
                            Nenhum grupo VNC encontrado.
                        </h3>
                        <p className="text-sm text-gray-500 m-0 max-w-xs">
                            Ative o "Modo Edição" para usar o botão "Novo Grupo" na barra de ferramentas e começar.
                        </p>
                    </div>
                )}
            </div>

            {/* ✅ v5.11: Modal de Importação CSV */}
            <VncCsvImportModal
                isOpen={showCsvImport}
                onClose={() => setShowCsvImport(false)}
                onImportComplete={() => {
                    // Recarrega a página para atualizar os grupos
                    window.location.reload();
                }}
            />
        </div>
    );
}

export default VncView;