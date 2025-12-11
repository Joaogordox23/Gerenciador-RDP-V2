// src/hooks/useApps.js
// Hook para gerenciamento de estado das Aplicações (Feature v4.3)

import { useState, useCallback, useEffect } from 'react';

/**
 * Hook para gerenciar grupos de aplicações e apps
 * @param {Function} toast - Função de toast para feedback
 * @returns {Object} - Estado e ações para aplicações
 */
export function useApps(toast) {
    const [appGroups, setAppGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // ==========================
    // HELPERS
    // ==========================
    const showSuccess = useCallback((message) => {
        if (toast?.success) toast.success(message);
    }, [toast]);

    const showError = useCallback((message) => {
        if (toast?.error) toast.error(message);
    }, [toast]);

    // ==========================
    // CARREGAR DADOS
    // ==========================
    const loadAppGroups = useCallback(async () => {
        if (!window.api?.apps) {
            console.warn('⚠️ API de apps não disponível');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const result = await window.api.apps.getGroups();

            if (result.success) {
                setAppGroups(result.groups);
                console.log(`📱 ${result.groups.length} grupos de aplicações carregados`);
            } else {
                console.error('Erro ao carregar apps:', result.error);
            }
        } catch (error) {
            console.error('Erro ao carregar grupos de apps:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Carrega dados na inicialização
    useEffect(() => {
        loadAppGroups();
    }, [loadAppGroups]);

    // ==========================
    // GRUPOS
    // ==========================
    const handleAddAppGroup = useCallback(async (data) => {
        if (!window.api?.apps) return null;

        try {
            const result = await window.api.apps.addGroup(data);

            if (result.success) {
                // Adiciona o novo grupo localmente
                const newGroup = {
                    id: result.id,
                    name: data.name,
                    icon: data.icon || null,
                    color: data.color || '#00AF74',
                    apps: []
                };
                setAppGroups(prev => [...prev, newGroup]);
                showSuccess(`Grupo "${data.name}" criado com sucesso!`);
                return result.id;
            } else {
                showError('Erro ao criar grupo');
                return null;
            }
        } catch (error) {
            console.error('Erro ao adicionar grupo:', error);
            showError('Erro ao criar grupo');
            return null;
        }
    }, [showSuccess, showError]);

    const handleUpdateAppGroup = useCallback(async (groupId, data) => {
        if (!window.api?.apps) return false;

        try {
            const result = await window.api.apps.updateGroup(groupId, data);

            if (result.success) {
                setAppGroups(prev => prev.map(g =>
                    g.id === groupId ? { ...g, ...data } : g
                ));
                showSuccess('Grupo atualizado!');
                return true;
            } else {
                showError('Erro ao atualizar grupo');
                return false;
            }
        } catch (error) {
            console.error('Erro ao atualizar grupo:', error);
            showError('Erro ao atualizar grupo');
            return false;
        }
    }, [showSuccess, showError]);

    const handleDeleteAppGroup = useCallback(async (groupId) => {
        if (!window.api?.apps) return false;

        try {
            const result = await window.api.apps.deleteGroup(groupId);

            if (result.success) {
                setAppGroups(prev => prev.filter(g => g.id !== groupId));
                showSuccess('Grupo removido!');
                return true;
            } else {
                showError('Erro ao remover grupo');
                return false;
            }
        } catch (error) {
            console.error('Erro ao remover grupo:', error);
            showError('Erro ao remover grupo');
            return false;
        }
    }, [showSuccess, showError]);

    // ==========================
    // APLICAÇÕES
    // ==========================
    const handleAddApp = useCallback(async (groupId, data) => {
        if (!window.api?.apps) return null;

        try {
            const result = await window.api.apps.add(groupId, data);

            if (result.success) {
                // Adiciona a app localmente
                const newApp = {
                    id: result.id,
                    groupId,
                    ...data
                };

                setAppGroups(prev => prev.map(g =>
                    g.id === groupId
                        ? { ...g, apps: [...(g.apps || []), newApp] }
                        : g
                ));
                showSuccess(`Aplicação "${data.name}" adicionada!`);
                return result.id;
            } else {
                showError('Erro ao adicionar aplicação');
                return null;
            }
        } catch (error) {
            console.error('Erro ao adicionar aplicação:', error);
            showError('Erro ao adicionar aplicação');
            return null;
        }
    }, [showSuccess, showError]);

    const handleUpdateApp = useCallback(async (appId, data) => {
        if (!window.api?.apps) return false;

        try {
            const result = await window.api.apps.update(appId, data);

            if (result.success) {
                setAppGroups(prev => prev.map(g => ({
                    ...g,
                    apps: (g.apps || []).map(app =>
                        app.id === appId ? { ...app, ...data } : app
                    )
                })));
                showSuccess('Aplicação atualizada!');
                return true;
            } else {
                showError('Erro ao atualizar aplicação');
                return false;
            }
        } catch (error) {
            console.error('Erro ao atualizar aplicação:', error);
            showError('Erro ao atualizar aplicação');
            return false;
        }
    }, [showSuccess, showError]);

    const handleDeleteApp = useCallback(async (appId) => {
        if (!window.api?.apps) return false;

        try {
            const result = await window.api.apps.delete(appId);

            if (result.success) {
                setAppGroups(prev => prev.map(g => ({
                    ...g,
                    apps: (g.apps || []).filter(app => app.id !== appId)
                })));
                showSuccess('Aplicação removida!');
                return true;
            } else {
                showError('Erro ao remover aplicação');
                return false;
            }
        } catch (error) {
            console.error('Erro ao remover aplicação:', error);
            showError('Erro ao remover aplicação');
            return false;
        }
    }, [showSuccess, showError]);

    // ==========================
    // EXECUÇÃO
    // ==========================
    const handleLaunchApp = useCallback(async (appId) => {
        if (!window.api?.apps) return false;

        try {
            const result = await window.api.apps.launch(appId);

            if (result.success) {
                console.log(`🚀 Aplicação ${appId} executada com sucesso`);
                return true;
            } else {
                showError(`Erro ao executar: ${result.error}`);
                return false;
            }
        } catch (error) {
            console.error('Erro ao executar aplicação:', error);
            showError('Erro ao executar aplicação');
            return false;
        }
    }, [showError]);

    // ==========================
    // UTILITÁRIOS
    // ==========================
    const selectFile = useCallback(async (type = 'executable') => {
        if (!window.api?.apps) return null;

        try {
            const result = await window.api.apps.selectFile(type);

            if (result.success) {
                return result.path;
            }
            return null;
        } catch (error) {
            console.error('Erro ao selecionar arquivo:', error);
            return null;
        }
    }, []);

    // ==========================
    // DRAG & DROP
    // ==========================

    // Reordena a lista de grupos e persiste no banco
    const reorderAppGroups = useCallback(async (newGroupsOrder) => {
        setAppGroups(newGroupsOrder);

        // Persiste ordem no banco
        if (window.api?.apps?.updateGroupsOrder) {
            const groupOrders = newGroupsOrder.map((g, index) => ({ id: g.id, order: index }));
            await window.api.apps.updateGroupsOrder(groupOrders);
            console.log('🔄 Ordem de grupos persistida no banco');
        }
    }, []);

    // Reordena apps dentro de um grupo e persiste no banco
    const reorderAppsInGroup = useCallback(async (groupId, newAppsOrder) => {
        setAppGroups(prev => prev.map(g =>
            g.id === groupId
                ? { ...g, apps: newAppsOrder }
                : g
        ));

        // Persiste ordem no banco
        if (window.api?.apps?.updateAppsOrder) {
            const appOrders = newAppsOrder.map((app, index) => ({ id: app.id, order: index }));
            await window.api.apps.updateAppsOrder(appOrders);
            console.log(`🔄 Ordem de apps no grupo ${groupId} persistida no banco`);
        }
    }, []);

    // Move uma app para outro grupo
    const moveAppToGroup = useCallback((appId, fromGroupId, toGroupId, destinationIndex) => {
        setAppGroups(prev => {
            const newGroups = [...prev];

            // Encontra os grupos de origem e destino
            const sourceGroupIndex = newGroups.findIndex(g => g.id === fromGroupId);
            const destGroupIndex = newGroups.findIndex(g => g.id === toGroupId);

            if (sourceGroupIndex === -1 || destGroupIndex === -1) return prev;

            // Remove a app do grupo de origem
            const sourceApps = [...(newGroups[sourceGroupIndex].apps || [])];
            const appIndex = sourceApps.findIndex(a => a.id === appId);

            if (appIndex === -1) return prev;

            const [movedApp] = sourceApps.splice(appIndex, 1);

            // Atualiza o groupId da app movida
            movedApp.groupId = toGroupId;

            // Adiciona a app no grupo de destino
            const destApps = [...(newGroups[destGroupIndex].apps || [])];
            destApps.splice(destinationIndex, 0, movedApp);

            // Atualiza ambos os grupos
            newGroups[sourceGroupIndex] = { ...newGroups[sourceGroupIndex], apps: sourceApps };
            newGroups[destGroupIndex] = { ...newGroups[destGroupIndex], apps: destApps };

            console.log(`🔄 App ${appId} movida de grupo ${fromGroupId} para ${toGroupId}`);

            return newGroups;
        });

        // TODO: Persistir no backend via API
        window.api.apps.update(appId, { groupId: toGroupId });
    }, []);

    // Conta total de apps
    const totalApps = appGroups.reduce((sum, g) => sum + (g.apps?.length || 0), 0);

    return {
        // Estado
        appGroups,
        isLoading,
        totalApps,

        // Grupos
        handleAddAppGroup,
        handleUpdateAppGroup,
        handleDeleteAppGroup,

        // Aplicações
        handleAddApp,
        handleUpdateApp,
        handleDeleteApp,

        // Execução
        handleLaunchApp,

        // Drag & Drop
        reorderAppGroups,
        reorderAppsInGroup,
        moveAppToGroup,

        // Utilitários
        selectFile,
        reloadApps: loadAppGroups
    };
}
