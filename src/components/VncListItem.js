import React, { useState, useCallback } from 'react';
import {
    EditIcon,
    DeleteIcon,
    PersonOutlineIcon,
    MonitorIcon
} from './MuiIcons';
import './VncListItem.css';

/**
 * ✨ v4.0: Componente de Conexão VNC em Modo Lista (Compacto)
 */
function VncListItem({
    connection,
    onConnect,
    onDelete,
    onUpdate,
    isEditModeEnabled,
    onEdit // Nova prop para modal global
}) {
    const handleConnect = useCallback(() => {
        if (isEditModeEnabled) return;
        onConnect(connection);
    }, [isEditModeEnabled, connection, onConnect]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        // Chama onDelete diretamente - o ConfirmationDialog é exibido pelo App.js
        onDelete();
    }, [onDelete]);

    return (
        <div
            className="vnc-list-item-card"
            onClick={handleConnect}
        >
            {/* VNC Icon */}
            <div className="vnc-list-icon">
                <MonitorIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            </div>

            {/* Server Info */}
            <div className="vnc-list-info">
                <span className="vnc-list-name">{connection.name}</span>
                <span className="vnc-list-address">
                    {connection.ipAddress}:{connection.port || 5900}
                </span>
            </div>

            {/* User Info */}
            {connection.username && (
                <div className="vnc-list-user">
                    <PersonOutlineIcon sx={{ fontSize: 14, marginRight: '4px' }} />
                    {connection.username}
                </div>
            )}

            {/* Group Badge */}
            <div className="vnc-list-group">
                {connection.groupName}
            </div>

            {/* Actions */}
            {isEditModeEnabled && (
                <div className="vnc-list-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => onEdit(connection)} // Chama modal global
                        className="vnc-action-btn"
                        title="Editar"
                    >
                        <EditIcon sx={{ fontSize: 18 }} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="vnc-action-btn delete"
                        title="Excluir"
                    >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default React.memo(VncListItem);
