import React, { useState, useCallback } from 'react';
import {
    EditIcon,
    DeleteIcon,
    SaveIcon,
    CloseIcon,
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
    isEditModeEnabled
}) {
    const [isEditing, setIsEditing] = useState(false);

    const handleConnect = useCallback(() => {
        if (isEditModeEnabled || isEditing) return;
        onConnect(connection);
    }, [isEditModeEnabled, isEditing, connection, onConnect]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        if (window.confirm(`Tem certeza que deseja excluir "${connection.name}"?`)) {
            onDelete();
        }
    }, [connection.name, onDelete]);

    return (
        <div
            className="vnc-list-item"
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
                        onClick={() => setIsEditing(true)}
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
