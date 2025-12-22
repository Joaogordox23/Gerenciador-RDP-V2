// src/hooks/useAnyDesk.js
// Hook para gerenciar conexões AnyDesk

import { useState, useCallback } from 'react';

export function useAnyDesk() {
    const [anydeskGroups, setAnydeskGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Carregar todos os grupos com conexões
    const loadGroups = useCallback(async () => {
        setLoading(true);
        try {
            const groups = await window.api.db.anydesk.getGroups();
            setAnydeskGroups(groups);
            setError(null);
        } catch (err) {
            console.error('Erro ao carregar grupos AnyDesk:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Adicionar grupo
    const addGroup = useCallback(async (name, icon = null, color = '#EF473A') => {
        try {
            const result = await window.api.db.anydesk.addGroup({ name, icon, color });
            if (result.success) {
                await loadGroups();
                return { success: true, id: result.id };
            }
            return { success: false, error: result.error };
        } catch (err) {
            console.error('Erro ao adicionar grupo:', err);
            return { success: false, error: err.message };
        }
    }, [loadGroups]);

    // Atualizar grupo
    const updateGroup = useCallback(async (id, name, icon = null, color = null) => {
        try {
            const result = await window.api.db.anydesk.updateGroup({ id, name, icon, color });
            if (result.success) {
                await loadGroups();
            }
            return result;
        } catch (err) {
            console.error('Erro ao atualizar grupo:', err);
            return { success: false, error: err.message };
        }
    }, [loadGroups]);

    // Deletar grupo
    const deleteGroup = useCallback(async (id) => {
        try {
            const result = await window.api.db.anydesk.deleteGroup(id);
            if (result.success) {
                await loadGroups();
            }
            return result;
        } catch (err) {
            console.error('Erro ao deletar grupo:', err);
            return { success: false, error: err.message };
        }
    }, [loadGroups]);

    // Adicionar conexão
    const addConnection = useCallback(async (groupId, connection) => {
        try {
            const result = await window.api.db.anydesk.addConnection({
                groupId,
                name: connection.name,
                anydeskId: connection.anydeskId,
                description: connection.description || '',
                password: connection.password || ''
            });
            if (result.success) {
                await loadGroups();
            }
            return result;
        } catch (err) {
            console.error('Erro ao adicionar conexão:', err);
            return { success: false, error: err.message };
        }
    }, [loadGroups]);

    // Atualizar conexão
    const updateConnection = useCallback(async (id, connection) => {
        try {
            const result = await window.api.db.anydesk.updateConnection({
                id,
                name: connection.name,
                anydeskId: connection.anydeskId,
                description: connection.description,
                password: connection.password
            });
            if (result.success) {
                await loadGroups();
            }
            return result;
        } catch (err) {
            console.error('Erro ao atualizar conexão:', err);
            return { success: false, error: err.message };
        }
    }, [loadGroups]);

    // Deletar conexão
    const deleteConnection = useCallback(async (id) => {
        try {
            const result = await window.api.db.anydesk.deleteConnection(id);
            if (result.success) {
                await loadGroups();
            }
            return result;
        } catch (err) {
            console.error('Erro ao deletar conexão:', err);
            return { success: false, error: err.message };
        }
    }, [loadGroups]);

    // Conectar a um AnyDesk
    const connect = useCallback(async (anydeskId, password = null) => {
        try {
            const result = await window.api.anydesk.connect(anydeskId, password);
            return result;
        } catch (err) {
            console.error('Erro ao conectar AnyDesk:', err);
            return { success: false, error: err.message };
        }
    }, []);

    // Verificar se AnyDesk está instalado
    const checkInstalled = useCallback(async () => {
        try {
            return await window.api.anydesk.checkInstalled();
        } catch (err) {
            return { installed: false, error: err.message };
        }
    }, []);

    return {
        anydeskGroups,
        loading,
        error,
        loadGroups,
        addGroup,
        updateGroup,
        deleteGroup,
        addConnection,
        updateConnection,
        deleteConnection,
        connect,
        checkInstalled
    };
}

export default useAnyDesk;
