// src/views/RdpSshView.js

import React from 'react';
import Group from '../components/Group';
import AddGroupForm from '../components/AddGroupForm';

function RdpSshView({
    groups,
    filteredGroups,
    showAddGroupForm,
    setShowAddGroupForm,
    handleAddGroup,
    searchTerm,
    // Props que serão passadas para o componente Group
    ...groupProps 
}) {
    return (
        <>
            {showAddGroupForm && (
                <AddGroupForm 
                    onAddGroup={handleAddGroup}
                    onCancel={() => setShowAddGroupForm(false)}
                />
            )}

            {filteredGroups.length === 0 ? (
                <div className="empty-state">
                    {groups.length === 0 ? (
                        <>
                            <h3>👋 Bem-vindo ao Gerenciador RDP/SSH</h3>
                            <p>Comece criando seu primeiro grupo de servidores</p>
                            <button
                                onClick={() => setShowAddGroupForm(true)}
                                className="toolbar-btn"
                                style={{ marginTop: '1rem' }}
                            >
                                ➕ Criar Primeiro Grupo
                            </button>
                        </>
                    ) : (
                        <>
                            <h3>🔍 Nenhum resultado encontrado</h3>
                            <p>Tente ajustar sua busca por "{searchTerm}"</p>
                        </>
                    )}
                </div>
            ) : (
                filteredGroups.map(group => (
                    <Group
                        key={group.id}
                        groupInfo={group}
                        {...groupProps} // Passa todas as outras props necessárias para o Group
                    />
                ))
            )}
        </>
    );
}

export default RdpSshView;