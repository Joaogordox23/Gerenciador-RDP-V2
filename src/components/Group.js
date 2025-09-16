// src/components/Group.js

import React, { useState, useEffect } from 'react';
import Server from './Server';
// Removida a importação de AddServerForm, não é mais necessário aqui

// (Ícones aqui)
const AddIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> );
const EditIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> );
const DeleteIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> );
const SaveIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg> );
const CancelIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );

function Group({ 
    groupInfo,
    // onAddServer foi removido, agora recebemos onShowAddServerModal
    onShowAddServerModal,
    onDeleteServer, 
    onUpdateServer, 
    onDeleteGroup, 
    onUpdateGroup, 
    activeConnections, 
    isEditModeEnabled, 
    isConnectivityEnabled,
    isEditing,
    onStartEdit,
    onCancelEdit
}) {
    // Estado 'showAddServerForm' foi removido
    const [newGroupName, setNewGroupName] = useState(groupInfo.groupName);

    useEffect(() => {
        setNewGroupName(groupInfo.groupName);
    }, [groupInfo.groupName]);

    const handleSaveGroupName = (e) => {
        e.preventDefault();
        onUpdateGroup(groupInfo.id, newGroupName);
    };

    return (
        <div className="group-container">
            <div className="group-header">
                <div className="group-title-container">
                    {isEditing && isEditModeEnabled ? (
                        <form onSubmit={handleSaveGroupName} style={{ width: '100%' }}>
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                onBlur={handleSaveGroupName}
                                onKeyDown={(e) => { if (e.key === 'Escape') onCancelEdit(); }}
                                className="group-title-edit-input"
                                autoFocus
                                onFocus={(e) => e.target.select()}
                            />
                        </form>
                    ) : (
                        <h2 className="group-title">{groupInfo.groupName}</h2>
                    )}
                </div>

                {isEditModeEnabled && (
                    <div className="group-actions">
                        {isEditing ? (
                            <>
                                <button className="action-button-icon save" title="Salvar Nome" onClick={handleSaveGroupName}><SaveIcon /></button>
                                <button className="action-button-icon cancel" title="Cancelar Edição" onClick={onCancelEdit}><CancelIcon /></button>
                            </>
                        ) : (
                            <>
                                {/* O botão "+" agora chama a função para abrir o modal */}
                                <button className="action-button-icon add" title="Adicionar Servidor" onClick={() => onShowAddServerModal(groupInfo.id)}><AddIcon /></button>
                                <button className="action-button-icon edit" title="Editar Nome do Grupo" onClick={onStartEdit}><EditIcon /></button>
                                <button className="action-button-icon delete" title="Deletar Grupo" onClick={() => onDeleteGroup(groupInfo.id, groupInfo.groupName)}><DeleteIcon /></button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="servers-row">
                {groupInfo.servers && groupInfo.servers.map(server => (
                    <Server
                        key={server.id}
                        serverInfo={server}
                        onDelete={() => onDeleteServer(groupInfo.id, server.id, server.name)}
                        onUpdate={(updatedData) => onUpdateServer(groupInfo.id, server.id, updatedData)}
                        isActive={activeConnections.includes(server.id)}
                        isEditModeEnabled={isEditModeEnabled}
                        isConnectivityEnabled={isConnectivityEnabled}
                    />
                ))}
            </div>

            {/* O formulário inline foi completamente removido daqui */}
        </div>
    );
}

export default Group;