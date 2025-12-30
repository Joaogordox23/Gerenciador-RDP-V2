// src/components/VncGroup.js
// ✨ v4.8: Migrado para Tailwind CSS
import React, { useState, useEffect } from 'react';
import VncConnection from './VncConnection';
import VncListItem from './VncListItem';

// Ícones inline
const AddIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>);
const EditIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>);
const DeleteIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const SaveIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="20 6 9 17 4 12"></polyline></svg>);
const CancelIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const ChevronDownIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="6 9 12 15 18 9"></polyline></svg>);
const ChevronRightIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="9 18 15 12 9 6"></polyline></svg>);

function VncGroup({
    groupInfo,
    isEditModeEnabled,
    onShowAddConnectionModal,
    onDeleteConnection,
    onDeleteGroup,
    onUpdateConnection,
    onVncConnect,
    isEditing,
    onStartEdit,
    onCancelEdit,
    onUpdateVncGroup,
    onEditVnc,
    viewMode = 'grid',
    forceCollapsed = null,
    openConnectionIds = new Set(),
    connectionStatus = {} // ✅ v5.10: Map de id -> status (true/false/'checking')
}) {
    const [newGroupName, setNewGroupName] = useState(groupInfo.groupName);
    const [localCollapsed, setLocalCollapsed] = useState(() => {
        const saved = localStorage.getItem(`vnc-group-collapsed-${groupInfo.id}`);
        return saved === 'true';
    });
    const [hasLocalOverride, setHasLocalOverride] = useState(false);
    // Quando forceCollapsed é null, usa estado local (padrão expandido após changeView)
    const isCollapsed = hasLocalOverride ? localCollapsed : (forceCollapsed !== null ? forceCollapsed : localCollapsed);

    useEffect(() => {
        if (forceCollapsed !== null) {
            setHasLocalOverride(false);
            setLocalCollapsed(forceCollapsed);
        } else {
            // Quando forceCollapsed volta para null (após changeView), expande os grupos
            setHasLocalOverride(false);
            setLocalCollapsed(false);
        }
    }, [forceCollapsed]);

    useEffect(() => {
        setNewGroupName(groupInfo.groupName);
    }, [groupInfo.groupName]);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setLocalCollapsed(newState);
        setHasLocalOverride(true);
        localStorage.setItem(`vnc-group-collapsed-${groupInfo.id}`, newState.toString());
    };

    const handleSaveGroupName = (e) => {
        e.preventDefault();
        onUpdateVncGroup(groupInfo.id, newGroupName);
    };

    const actionBtnBase = "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer";

    return (
        <div className="bg-cream-100 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 
            rounded-xl mb-4 overflow-hidden shadow-md">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-cream-50/50 dark:bg-dark-bg/50 border-b border-gray-200 dark:border-gray-700">
                {/* Collapse */}
                <button
                    className={`${actionBtnBase} bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 
                        text-gray-500 hover:text-primary hover:border-primary`}
                    onClick={toggleCollapse}
                    title={isCollapsed ? 'Expandir grupo' : 'Recolher grupo'}
                >
                    {isCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
                </button>

                {/* Título */}
                <div className="flex-1 min-w-0">
                    {isEditing && isEditModeEnabled ? (
                        <form onSubmit={handleSaveGroupName} className="w-full">
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                onBlur={handleSaveGroupName}
                                onKeyDown={(e) => e.key === 'Escape' && onCancelEdit()}
                                className="w-full px-3 py-1.5 bg-cream-50 dark:bg-dark-bg border-2 border-primary 
                                    rounded-lg text-sm font-semibold text-slate-900 dark:text-white outline-none"
                                autoFocus
                                onFocus={(e) => e.target.select()}
                            />
                        </form>
                    ) : (
                        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white truncate">
                            {groupInfo.groupName}
                            {isCollapsed && (
                                <span className="px-2 py-0.5 text-xs font-semibold bg-primary/20 text-primary rounded-full">
                                    {groupInfo.connections?.length || 0}
                                </span>
                            )}
                        </h2>
                    )}
                </div>

                {/* Actions */}
                {isEditModeEnabled && (
                    <div className="flex items-center gap-1">
                        {isEditing ? (
                            <>
                                <button className={`${actionBtnBase} bg-primary/20 text-primary hover:bg-primary hover:text-white`}
                                    title="Salvar" onClick={handleSaveGroupName}><SaveIcon /></button>
                                <button className={`${actionBtnBase} bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300`}
                                    title="Cancelar" onClick={onCancelEdit}><CancelIcon /></button>
                            </>
                        ) : (
                            <>
                                <button className={`${actionBtnBase} bg-primary/10 text-primary hover:bg-primary hover:text-white`}
                                    title="Adicionar Conexão" onClick={() => onShowAddConnectionModal(groupInfo.id)}><AddIcon /></button>
                                <button className={`${actionBtnBase} bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white`}
                                    title="Editar Nome" onClick={onStartEdit}><EditIcon /></button>
                                <button className={`${actionBtnBase} bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white`}
                                    title="Deletar Grupo" onClick={() => onDeleteGroup(groupInfo.id, groupInfo.groupName)}><DeleteIcon /></button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Conteúdo */}
            {!isCollapsed && (
                <div className={viewMode === 'list' ? 'divide-y divide-gray-100 dark:divide-gray-800' : 'flex flex-wrap gap-4 p-4'}>
                    {Array.isArray(groupInfo.connections) && groupInfo.connections.map(conn => (
                        viewMode === 'list' ? (
                            <VncListItem
                                key={conn.id}
                                connection={{ ...conn, groupName: groupInfo.groupName }}
                                isEditModeEnabled={isEditModeEnabled}
                                onDelete={() => onDeleteConnection(groupInfo.id, conn.id, conn.name)}
                                onEdit={() => onEditVnc(conn, groupInfo.id)}
                                onConnect={onVncConnect}
                                isActive={openConnectionIds.has(conn.id)}
                                isOnline={connectionStatus[conn.id]}
                            />
                        ) : (
                            <VncConnection
                                key={conn.id}
                                connectionInfo={conn}
                                isEditModeEnabled={isEditModeEnabled}
                                onDelete={() => onDeleteConnection(groupInfo.id, conn.id, conn.name)}
                                onEdit={() => onEditVnc(conn, groupInfo.id)}
                                onConnect={onVncConnect}
                                isOpen={openConnectionIds.has(conn.id)}
                                isOnline={connectionStatus[conn.id]}
                            />
                        )
                    ))}
                </div>
            )}
        </div>
    );
}

export default VncGroup;