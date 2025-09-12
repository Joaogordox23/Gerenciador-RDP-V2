// src/components/Group.js

import React, { useState } from 'react';
import Server from './Server';
import AddServerForm from './AddServerForm';

function Group({ groupInfo, index, activeConnections, isEditModeEnabled, onAddServer, onDeleteServer, onDeleteGroup, onUpdateServer, onUpdateGroup }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newGroupName, setNewGroupName] = useState(groupInfo.groupName);
  const [isAddingServer, setIsAddingServer] = useState(false);

  const handleServerAdd = (serverData) => {
    onAddServer(index, serverData);
    setIsAddingServer(false); // Fecha o formulário após adicionar
  };

  const handleGroupUpdateSubmit = (event) => {
    event.preventDefault();
    onUpdateGroup(index, newGroupName);
    setIsEditing(false);
  };

  return (
    <div className="group-container">
      <div className="group-header">
        {isEditing ? (
          <form onSubmit={handleGroupUpdateSubmit} className="group-edit-form">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              autoFocus
            />
            <button type="submit">Salvar</button>
            <button type="button" onClick={() => setIsEditing(false)}>Cancelar</button>
          </form>
        ) : (
          <>
            <h2 className="group-title">{groupInfo.groupName}</h2>
            {isEditModeEnabled && (
              <div className="group-header-buttons">
                <button className="add-server-button" title="Adicionar Servidor" onClick={() => setIsAddingServer(true)}>+</button>
                <button className="edit-button" title="Editar Grupo" onClick={() => setIsEditing(true)}>&#9998;</button>
                <button className="delete-button group-delete-button" title="Deletar Grupo" onClick={() => onDeleteGroup(index, groupInfo.groupName)}>
                  &times;
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="servers-row">
        {groupInfo.servers.map(server => (
          <Server
            key={server.id}
            serverInfo={server}
            isActive={activeConnections.includes(server.id)}
            isEditModeEnabled={isEditModeEnabled}
            onDelete={() => onDeleteServer(index, server.id, server.name)}
            onUpdate={(updatedData) => onUpdateServer(index, server.id, updatedData)}
          />
        ))}
      </div>

      {isAddingServer && (
        <div className="add-server-form-container">
          <AddServerForm 
            onServerAdded={handleServerAdd}
            onCancel={() => setIsAddingServer(false)}
          />
        </div>
      )}
    </div>
  );
}

export default Group;