// src/components/VncConnection.js
// ✨ v4.8: Migrado para Tailwind CSS
// ✨ v5.10: Adicionado indicador de status online/offline
import React from 'react';
import {
    EditIcon,
    DeleteIcon,
    ComputerIcon,
    PersonOutlineIcon,
    CheckCircleIcon
} from './MuiIcons';

// ✅ v5.10: Componente de indicador de status
function StatusIndicator({ status }) {
    if (status === undefined || status === null) {
        return null; // Não mostra nada se não houver verificação
    }
    if (status === 'checking') {
        return (
            <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" title="Verificando..." />
        );
    }
    if (status === true || status === 'online') {
        return (
            <span className="w-2 h-2 rounded-full bg-green-500" title="Online" />
        );
    }
    return (
        <span className="w-2 h-2 rounded-full bg-red-500" title="Offline" />
    );
}

function VncConnection({ connectionInfo, isEditModeEnabled, onDelete, onEdit, onConnect, isOpen = false, isOnline }) {

    const handleConnect = () => {
        if (isEditModeEnabled) return;
        if (onConnect) {
            onConnect({ ...connectionInfo, protocol: 'vnc' });
        }
    };

    return (
        <div
            className={`
                relative w-[260px] min-w-[260px]
                bg-cream-100 dark:bg-dark-surface
                border border-gray-200 dark:border-gray-700
                rounded-xl p-4 cursor-pointer
                transition-all duration-200 shadow-md
                hover:shadow-lg hover:-translate-y-1 hover:border-primary/50
                ${isOpen ? 'ring-2 ring-primary border-primary' : ''}
            `}
            onClick={handleConnect}
        >
            {/* Badge de conexão aberta */}
            {isOpen && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 
                    bg-primary/20 text-primary rounded-lg text-xs font-semibold">
                    <CheckCircleIcon sx={{ fontSize: 12 }} />
                    <span>Aberta</span>
                </div>
            )}

            {/* Info */}
            <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                    <ComputerIcon sx={{ fontSize: 20 }} className="text-primary" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {connectionInfo.name}
                    </span>
                    {/* ✅ v5.10: Indicador de status */}
                    <StatusIndicator status={isOnline} />
                </div>
                <div className="text-xs text-gray-500 font-mono">
                    {connectionInfo.ipAddress}:{connectionInfo.port}
                </div>
                {connectionInfo.viewOnly && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <PersonOutlineIcon sx={{ fontSize: 14 }} />
                        <span>Apenas Visualização</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            {isEditModeEnabled && (
                <div className="flex items-center gap-1 pt-2 border-t border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                        type="button"
                        title="Editar"
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    >
                        <EditIcon sx={{ fontSize: 18 }} />
                    </button>
                    <button
                        className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                        type="button"
                        title="Deletar"
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default VncConnection;