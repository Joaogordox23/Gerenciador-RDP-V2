// src/views/AnyDeskView.js
// Tela de gerenciamento de conexões AnyDesk

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useUI } from '../contexts/UIContext';
import {
    AddIcon, EditIcon, DeleteIcon, PlayArrowIcon, ChevronRightIcon,
    ChevronLeftIcon, FolderOpenIcon, DesktopWindowsIcon, SearchIcon, GridViewIcon, ListIcon
} from '../components/MuiIcons';

// Componente Card de Conexão AnyDesk
function AnyDeskCard({ connection, onConnect, onEdit, onDelete, isEditMode }) {
    const [connecting, setConnecting] = useState(false);

    const handleConnect = async () => {
        setConnecting(true);
        try {
            await onConnect(connection);
        } finally {
            setConnecting(false);
        }
    };

    return (
        <div className="group relative bg-white dark:bg-dark-card rounded-xl border-2 border-gray-200 dark:border-gray-700 
            hover:border-primary hover:shadow-lg transition-all duration-300 overflow-hidden">
            {/* Header com cor primária */}
            <div className="h-2 bg-gradient-to-r from-primary to-primary-hover" />

            <div className="p-4">
                {/* Nome e ID */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {connection.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {connection.anydeskId}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ml-2">
                        <DesktopWindowsIcon sx={{ fontSize: 20 }} className="text-primary" />
                    </div>
                </div>

                {/* Descrição */}
                {connection.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                        {connection.description}
                    </p>
                )}

                {/* Ações */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="flex-1 py-2 px-3 rounded-lg bg-primary text-white font-medium text-sm
                            hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {connecting ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <PlayArrowIcon sx={{ fontSize: 18 }} />
                        )}
                        {connecting ? 'Conectando...' : 'Conectar'}
                    </button>

                    {isEditMode && (
                        <>
                            <button
                                onClick={() => onEdit(connection)}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 
                                    hover:border-primary hover:text-primary transition-colors"
                            >
                                <EditIcon sx={{ fontSize: 16 }} />
                            </button>
                            <button
                                onClick={() => onDelete(connection)}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 
                                    hover:border-red-500 hover:text-red-500 transition-colors"
                            >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Componente Grupo AnyDesk
function AnyDeskGroup({ group, isEditMode, forceCollapsed, onConnect, onEditConnection, onDeleteConnection,
    onAddConnection, onEditGroup, onDeleteGroup }) {
    const [localCollapsed, setLocalCollapsed] = useState(false);
    const [hasLocalOverride, setHasLocalOverride] = useState(false);
    const isCollapsed = hasLocalOverride ? localCollapsed : (forceCollapsed !== null ? forceCollapsed : localCollapsed);

    useEffect(() => {
        if (forceCollapsed !== null) {
            setHasLocalOverride(false);
            setLocalCollapsed(forceCollapsed);
        } else {
            setHasLocalOverride(false);
            setLocalCollapsed(false);
        }
    }, [forceCollapsed]);

    const toggleCollapse = () => {
        setLocalCollapsed(!isCollapsed);
        setHasLocalOverride(true);
    };

    return (
        <div className="mb-4">
            {/* Header do Grupo */}
            <div
                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-100 to-gray-50 
                    dark:from-gray-800 dark:to-gray-750 rounded-xl cursor-pointer hover:from-gray-200 
                    hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-650 transition-all"
                onClick={toggleCollapse}
            >
                <div className="flex items-center gap-3">
                    <span className={`transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}>
                        <ChevronRightIcon sx={{ fontSize: 20 }} className="text-gray-500" />
                    </span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary">
                        <FolderOpenIcon sx={{ fontSize: 16 }} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                        <span className="text-xs text-gray-500">{group.connections?.length || 0} conexões</span>
                    </div>
                </div>

                {isEditMode && (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => onAddConnection(group.id)}
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            title="Adicionar conexão"
                        >
                            <AddIcon sx={{ fontSize: 16 }} />
                        </button>
                        <button
                            onClick={() => onEditGroup(group)}
                            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Editar grupo"
                        >
                            <EditIcon sx={{ fontSize: 16 }} />
                        </button>
                        <button
                            onClick={() => onDeleteGroup(group)}
                            className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            title="Excluir grupo"
                        >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                        </button>
                    </div>
                )}
            </div>

            {/* Conexões */}
            {!isCollapsed && group.connections?.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-3 pl-8">
                    {group.connections.map(conn => (
                        <AnyDeskCard
                            key={conn.id}
                            connection={conn}
                            onConnect={onConnect}
                            onEdit={onEditConnection}
                            onDelete={onDeleteConnection}
                            isEditMode={isEditMode}
                        />
                    ))}
                </div>
            )}

            {!isCollapsed && (!group.connections || group.connections.length === 0) && (
                <div className="text-center py-8 text-gray-400 text-sm pl-8">
                    Nenhuma conexão neste grupo
                </div>
            )}
        </div>
    );
}

// Componente Principal
function AnyDeskView() {
    const { isEditModeEnabled, searchTerm, allGroupsCollapsed } = useUI();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anydeskInstalled, setAnydeskInstalled] = useState(null);

    // Modal states
    const [showAddGroupModal, setShowAddGroupModal] = useState(false);
    const [showAddConnectionModal, setShowAddConnectionModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [editingGroupId, setEditingGroupId] = useState(null);

    // Form states
    const [formData, setFormData] = useState({ name: '', anydeskId: '', description: '', password: '' });
    const [groupFormData, setGroupFormData] = useState({ name: '', color: '#00AF74' });

    // Load groups
    const loadGroups = useCallback(async () => {
        try {
            const result = await window.api.anydeskDb.getGroups();
            setGroups(result);
        } catch (err) {
            console.error('Erro ao carregar grupos AnyDesk:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Check AnyDesk installation
    useEffect(() => {
        window.api.anydesk.checkInstalled().then(result => {
            setAnydeskInstalled(result.installed);
        });
        loadGroups();
    }, [loadGroups]);

    // Filter by search term
    const filteredGroups = useMemo(() => {
        if (!searchTerm) return groups;
        const term = searchTerm.toLowerCase();
        return groups.map(group => ({
            ...group,
            connections: group.connections?.filter(conn =>
                conn.name?.toLowerCase().includes(term) ||
                conn.anydeskId?.toLowerCase().includes(term) ||
                conn.description?.toLowerCase().includes(term)
            )
        })).filter(group => group.connections?.length > 0 || group.name.toLowerCase().includes(term));
    }, [groups, searchTerm]);

    // Connect to AnyDesk
    const handleConnect = async (connection) => {
        try {
            const result = await window.api.anydesk.connect(connection.anydeskId, connection.password);
            if (result.success) {
                await window.api.anydeskDb.updateLastConnected(connection.id);
                console.log(`✅ Conectando AnyDesk: ${connection.anydeskId}`);
            } else {
                alert(`Erro ao conectar: ${result.error}`);
            }
        } catch (err) {
            alert(`Erro: ${err.message}`);
        }
    };

    // Add group
    const handleAddGroup = async () => {
        if (!groupFormData.name.trim()) return;
        const result = await window.api.anydeskDb.addGroup({
            name: groupFormData.name,
            color: groupFormData.color
        });
        if (result.success) {
            setShowAddGroupModal(false);
            setGroupFormData({ name: '', color: '#00AF74' });
            loadGroups();
        }
    };

    // Add connection
    const handleAddConnection = async () => {
        if (!formData.name.trim() || !formData.anydeskId.trim() || !editingGroupId) return;
        const result = await window.api.anydeskDb.addConnection({
            groupId: editingGroupId,
            name: formData.name,
            anydeskId: formData.anydeskId,
            description: formData.description,
            password: formData.password
        });
        if (result.success) {
            setShowAddConnectionModal(false);
            setFormData({ name: '', anydeskId: '', description: '', password: '' });
            setEditingGroupId(null);
            loadGroups();
        }
    };

    // Edit connection
    const handleEditConnection = (connection) => {
        setSelectedConnection(connection);
        setFormData({
            name: connection.name,
            anydeskId: connection.anydeskId,
            description: connection.description || '',
            password: connection.password || ''
        });
        setShowEditModal(true);
    };

    // Save edit
    const handleSaveEdit = async () => {
        if (!formData.name.trim() || !formData.anydeskId.trim() || !selectedConnection) return;
        const result = await window.api.anydeskDb.updateConnection({
            id: selectedConnection.id,
            name: formData.name,
            anydeskId: formData.anydeskId,
            description: formData.description,
            password: formData.password
        });
        if (result.success) {
            setShowEditModal(false);
            setSelectedConnection(null);
            setFormData({ name: '', anydeskId: '', description: '', password: '' });
            loadGroups();
        }
    };

    // Delete connection
    const handleDeleteConnection = async (connection) => {
        if (!window.confirm(`Excluir conexão "${connection.name}"?`)) return;
        await window.api.anydeskDb.deleteConnection(connection.id);
        loadGroups();
    };

    // Delete group
    const handleDeleteGroup = async (group) => {
        if (!window.confirm(`Excluir grupo "${group.name}" e todas as conexões?`)) return;
        await window.api.anydeskDb.deleteGroup(group.id);
        loadGroups();
    };

    const btnPrimary = "px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors flex items-center gap-2";
    const btnSecondary = "px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors";

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6 overflow-auto">
            {/* Warning if AnyDesk not installed */}
            {anydeskInstalled === false && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        ⚠️ AnyDesk não foi detectado. As conexões tentarão usar o protocolo <code>anydesk:</code>.
                    </p>
                </div>
            )}

            {/* Groups */}
            {filteredGroups.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <DesktopWindowsIcon sx={{ fontSize: 64 }} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhuma conexão AnyDesk</p>
                    <p className="text-sm mb-4">Ative o modo edição e crie um grupo para começar</p>
                    {isEditModeEnabled && (
                        <button onClick={() => setShowAddGroupModal(true)} className={btnPrimary}>
                            <AddIcon sx={{ fontSize: 18 }} /> Novo Grupo
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex-1">
                    {filteredGroups.map(group => (
                        <AnyDeskGroup
                            key={group.id}
                            group={group}
                            isEditMode={isEditModeEnabled}
                            forceCollapsed={allGroupsCollapsed}
                            onConnect={handleConnect}
                            onEditConnection={handleEditConnection}
                            onDeleteConnection={handleDeleteConnection}
                            onAddConnection={(groupId) => {
                                setEditingGroupId(groupId);
                                setShowAddConnectionModal(true);
                            }}
                            onEditGroup={(g) => {
                                setSelectedGroup(g);
                                setGroupFormData({ name: g.name, color: g.color || '#00AF74' });
                            }}
                            onDeleteGroup={handleDeleteGroup}
                        />
                    ))}

                    {/* Botão Novo Grupo no final da lista */}
                    {isEditModeEnabled && (
                        <button
                            onClick={() => setShowAddGroupModal(true)}
                            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 
                                text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary 
                                transition-colors flex items-center justify-center gap-2 mt-4"
                        >
                            <AddIcon sx={{ fontSize: 20 }} /> Adicionar Novo Grupo
                        </button>
                    )}
                </div>
            )}

            {/* Modal: Add Group */}
            {showAddGroupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-6 w-96 shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Novo Grupo</h3>
                        <input
                            type="text"
                            placeholder="Nome do grupo"
                            value={groupFormData.name}
                            onChange={e => setGroupFormData({ ...groupFormData, name: e.target.value })}
                            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowAddGroupModal(false)} className={btnSecondary}>Cancelar</button>
                            <button onClick={handleAddGroup} className={btnPrimary}>Criar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add Connection */}
            {showAddConnectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-6 w-[450px] shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Nova Conexão AnyDesk</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Nome da conexão"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                                autoFocus
                            />
                            <input
                                type="text"
                                placeholder="ID AnyDesk (ex: 123 456 789)"
                                value={formData.anydeskId}
                                onChange={e => setFormData({ ...formData, anydeskId: e.target.value })}
                                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white font-mono"
                            />
                            <input
                                type="password"
                                placeholder="Senha (opcional - para unattended)"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                            />
                            <textarea
                                placeholder="Descrição (opcional)"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white resize-none"
                                rows={2}
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => { setShowAddConnectionModal(false); setEditingGroupId(null); }} className={btnSecondary}>
                                Cancelar
                            </button>
                            <button onClick={handleAddConnection} className={btnPrimary}>Adicionar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Edit Connection */}
            {showEditModal && selectedConnection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-6 w-[450px] shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Editar Conexão</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Nome da conexão"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                            />
                            <input
                                type="text"
                                placeholder="ID AnyDesk"
                                value={formData.anydeskId}
                                onChange={e => setFormData({ ...formData, anydeskId: e.target.value })}
                                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white font-mono"
                            />
                            <input
                                type="password"
                                placeholder="Senha (opcional)"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                            />
                            <textarea
                                placeholder="Descrição"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white resize-none"
                                rows={2}
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => { setShowEditModal(false); setSelectedConnection(null); }} className={btnSecondary}>
                                Cancelar
                            </button>
                            <button onClick={handleSaveEdit} className={btnPrimary}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnyDeskView;
