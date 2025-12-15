// src/components/apps/AppListItem.js
// Componente de item de lista para aplicações
import React, { useCallback } from 'react';
import {
    WebIcon,
    DesktopWindowsIcon,
    EditIcon,
    DeleteIcon,
    LaunchIcon,
    DragIndicatorIcon
} from '../MuiIcons';

function AppListItem({
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
                flex items-center gap-3 w-full
                bg-cream-100 dark:bg-dark-surface
                border border-gray-200 dark:border-gray-700 rounded-lg
                px-3 py-2 cursor-pointer transition-all duration-200
                hover:shadow-md hover:border-primary/50
                ${isDragging ? 'shadow-xl ring-2 ring-primary' : ''}
                ${isEditMode ? 'cursor-grab' : ''}
            `}
            onClick={handleLaunch}
            title={isEditMode ? 'Arraste para reordenar' : `Abrir ${app.name}`}
        >
            {/* Drag Handle */}
            {isEditMode && dragHandleProps && (
                <div className="p-1 text-gray-400 hover:text-primary cursor-grab shrink-0" {...dragHandleProps}>
                    <DragIndicatorIcon sx={{ fontSize: 16 }} />
                </div>
            )}

            {/* Ícone */}
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                ${isWeb ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                {app.icon ? (
                    <img
                        src={app.icon.startsWith('data:') || app.icon.startsWith('http') ? app.icon : `file:///${app.icon.replace(/\\/g, '/')}`}
                        alt={app.name}
                        className="w-6 h-6 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : isWeb ? (
                    <WebIcon sx={{ fontSize: 20 }} />
                ) : (
                    <DesktopWindowsIcon sx={{ fontSize: 20 }} />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {app.name}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded shrink-0
                        ${isWeb ? 'bg-blue-500/20 text-blue-500' : 'bg-purple-500/20 text-purple-500'}`}>
                        {isWeb ? 'WEB' : 'LOCAL'}
                    </span>
                </div>
                {app.description && (
                    <span className="block text-xs text-gray-500 truncate">{app.description}</span>
                )}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                {isEditMode ? (
                    <>
                        <button
                            type="button"
                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                            onClick={handleEdit}
                            title="Editar"
                        >
                            <EditIcon sx={{ fontSize: 14 }} />
                        </button>
                        <button
                            type="button"
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                            onClick={handleDelete}
                            title="Excluir"
                        >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                        </button>
                    </>
                ) : (
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <LaunchIcon sx={{ fontSize: 16 }} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default React.memo(AppListItem);
