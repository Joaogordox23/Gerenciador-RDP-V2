// src/components/apps/AppCard.js
// ✨ v4.9: Corrigido posicionamento dos botões de edição
import React, { useCallback } from 'react';
import {
    WebIcon,
    DesktopWindowsIcon,
    EditIcon,
    DeleteIcon,
    LaunchIcon,
    DragIndicatorIcon
} from '../MuiIcons';

function AppCard({
    app,
    onLaunch,
    onEdit,
    onDelete,
    isEditMode = false,
    dragHandleProps = null,
    isDragging = false
}) {
    const handleLaunch = useCallback(() => {
        if (!isEditMode && onLaunch) {
            onLaunch(app.id);
        }
    }, [isEditMode, onLaunch, app.id]);

    const handleEdit = useCallback((e) => {
        e.stopPropagation();
        if (onEdit) onEdit(app);
    }, [onEdit, app]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        if (onDelete) onDelete(app.id);
    }, [onDelete, app.id]);

    const isWeb = app.type === 'web';

    return (
        <div
            className={`
                relative w-[180px] bg-cream-100 dark:bg-dark-surface
                border border-gray-200 dark:border-gray-700 rounded-xl
                p-4 ${isEditMode ? 'pb-12' : 'pb-4'}
                cursor-pointer transition-all duration-200 group
                hover:shadow-lg hover:-translate-y-1 hover:border-primary/50
                ${isDragging ? 'shadow-2xl ring-2 ring-primary scale-105' : 'shadow-md'}
                ${isEditMode ? 'cursor-grab' : ''}
            `}
            onClick={handleLaunch}
            title={isEditMode ? 'Arraste para reordenar' : `Abrir ${app.name}`}
        >
            {/* Drag Handle */}
            {isEditMode && dragHandleProps && (
                <div className="absolute top-2 left-2 p-1 text-gray-400 hover:text-primary cursor-grab" {...dragHandleProps}>
                    <DragIndicatorIcon sx={{ fontSize: 16 }} />
                </div>
            )}

            {/* Badge de tipo */}
            <div className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded
                ${isWeb ? 'bg-blue-500/20 text-blue-500' : 'bg-purple-500/20 text-purple-500'}`}>
                {isWeb ? 'WEB' : 'LOCAL'}
            </div>

            {/* Ícone */}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 mt-2
                ${isWeb ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                {app.icon ? (
                    <img
                        src={app.icon.startsWith('data:') || app.icon.startsWith('http') ? app.icon : `file:///${app.icon.replace(/\\/g, '/')}`}
                        alt={app.name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : isWeb ? (
                    <WebIcon sx={{ fontSize: 32 }} />
                ) : (
                    <DesktopWindowsIcon sx={{ fontSize: 32 }} />
                )}
            </div>

            {/* Info */}
            <div className="text-center">
                <span className="block font-semibold text-sm text-slate-900 dark:text-white truncate">{app.name}</span>
                {app.description && (
                    <span className="block text-xs text-gray-500 truncate mt-1">{app.description}</span>
                )}
            </div>

            {/* Ações de edição - agora com mais espaço abaixo do nome */}
            {isEditMode && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2"
                    onClick={e => e.stopPropagation()}>
                    <button
                        type="button"
                        className="p-1.5 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                        onClick={handleEdit}
                        title="Editar"
                    >
                        <EditIcon sx={{ fontSize: 16 }} />
                    </button>
                    <button
                        type="button"
                        className="p-1.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                        onClick={handleDelete}
                        title="Excluir"
                    >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                    </button>
                </div>
            )}

            {/* Botão de abrir */}
            {!isEditMode && (
                <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-primary/10 text-primary
                    opacity-0 group-hover:opacity-100 transition-opacity">
                    <LaunchIcon sx={{ fontSize: 18 }} />
                </div>
            )}
        </div>
    );
}

export default React.memo(AppCard);
