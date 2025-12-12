// src/components/apps/AppCard.js
// Card individual de aplicação (Feature v4.3)
// v4.3.1: Suporte a Drag & Drop

import React, { useCallback } from 'react';
import {
    WebIcon,
    DesktopWindowsIcon,
    EditIcon,
    DeleteIcon,
    LaunchIcon,
    DragIndicatorIcon
} from '../MuiIcons';
import './AppCard.css';

/**
 * Card de aplicação com ícone, nome e ações
 * @param {Object} app - Dados da aplicação
 * @param {Object} dragHandleProps - Props do drag handle (react-beautiful-dnd)
 * @param {boolean} isDragging - Se está sendo arrastado
 */
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
            className={`app-card ${isEditMode ? 'edit-mode' : ''} ${isDragging ? 'dragging' : ''}`}
            onClick={handleLaunch}
            title={isEditMode ? 'Arraste para reordenar' : `Abrir ${app.name}`}
        >
            {/* Drag Handle (visível apenas em modo edição) */}
            {isEditMode && dragHandleProps && (
                <div className="app-card-drag-handle" {...dragHandleProps}>
                    <DragIndicatorIcon sx={{ fontSize: 18 }} />
                </div>
            )}

            {/* Ícone */}
            <div className={`app-card-icon ${isWeb ? 'web' : 'local'}`}>
                {app.icon ? (
                    <img
                        src={app.icon.startsWith('data:') || app.icon.startsWith('http') ? app.icon : `file:///${app.icon.replace(/\\/g, '/')}`}
                        alt={app.name}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : isWeb ? (
                    <WebIcon sx={{ fontSize: 32 }} />
                ) : (
                    <DesktopWindowsIcon sx={{ fontSize: 32 }} />
                )}
            </div>

            {/* Info */}
            <div className="app-card-info">
                <span className="app-card-name">{app.name}</span>
                {app.description && (
                    <span className="app-card-desc">{app.description}</span>
                )}
            </div>

            {/* Badge de tipo */}
            <div className={`app-card-badge ${isWeb ? 'web' : 'local'}`}>
                {isWeb ? 'WEB' : 'LOCAL'}
            </div>

            {/* Ações de edição */}
            {isEditMode && (
                <div className="app-card-actions">
                    <button
                        className="app-action-btn edit"
                        onClick={handleEdit}
                        title="Editar"
                    >
                        <EditIcon sx={{ fontSize: 18 }} />
                    </button>
                    <button
                        className="app-action-btn delete"
                        onClick={handleDelete}
                        title="Excluir"
                    >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                    </button>
                </div>
            )}

            {/* Botão de abrir (quando não está em modo edição) */}
            {!isEditMode && (
                <div className="app-card-launch">
                    <LaunchIcon sx={{ fontSize: 20 }} />
                </div>
            )}
        </div>
    );
}

export default React.memo(AppCard);

