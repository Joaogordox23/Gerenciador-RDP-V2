// src/components/VncListItem.js
// ✨ v4.8: Migrado para Tailwind CSS
import React, { useCallback } from 'react';
import {
    EditIcon,
    DeleteIcon,
    PersonOutlineIcon,
    MonitorIcon
} from './MuiIcons';

function VncListItem({
    connection,
    onConnect,
    onDelete,
    onUpdate,
    isEditModeEnabled,
    onEdit,
    isActive = false
}) {
    const handleConnect = useCallback(() => {
        if (isEditModeEnabled) return;
        onConnect(connection);
    }, [isEditModeEnabled, connection, onConnect]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        onDelete();
    }, [onDelete]);

    const actionBtn = "p-1.5 rounded-lg transition-all duration-200 hover:scale-110";

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200
                hover:bg-primary/5 border-b border-gray-100 dark:border-gray-800 last:border-b-0
                ${isActive ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
            onClick={handleConnect}
        >
            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <MonitorIcon sx={{ fontSize: 20 }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <span className="block font-semibold text-sm text-slate-900 dark:text-white truncate">
                    {connection.name}
                </span>
                <span className="text-xs text-gray-500 font-mono">
                    {connection.ipAddress}:{connection.port || 5900}
                </span>
            </div>

            {/* User */}
            {connection.username && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <PersonOutlineIcon sx={{ fontSize: 14 }} />
                    {connection.username}
                </div>
            )}

            <span className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 
                text-gray-600 dark:text-gray-400 rounded-lg">
                {connection.groupName}
            </span>

            {/* Connection Open Badge */}
            {isActive && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    Aberta
                </span>
            )}

            {/* Actions */}
            {isEditModeEnabled && (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => onEdit(connection)}
                        className={`${actionBtn} bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white`}
                        title="Editar"
                    >
                        <EditIcon sx={{ fontSize: 16 }} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className={`${actionBtn} bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white`}
                        title="Excluir"
                    >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default React.memo(VncListItem);
