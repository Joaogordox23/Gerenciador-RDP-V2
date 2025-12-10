// src/contexts/ModalContext.js
// Contexto para estados de modais, dialogs e conexões ativas

import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
    // ========== Estados de Modais de Formulário ==========
    const [showAddGroupForm, setShowAddGroupForm] = useState(false);
    const [addingToGroupId, setAddingToGroupId] = useState(null);
    const [showADModal, setShowADModal] = useState(false);
    const [showBulkPasswordModal, setShowBulkPasswordModal] = useState(false);

    // ========== Estados de Edição ==========
    const [editingServer, setEditingServer] = useState(null);
    const [editingVncConnection, setEditingVncConnection] = useState(null);

    // ========== Estados de Conexões Ativas ==========
    const [activeVncConnection, setActiveVncConnection] = useState(null);
    const [activeRemoteConnection, setActiveRemoteConnection] = useState(null);

    // ========== Estados de Diálogo de Confirmação ==========
    const [dialogConfig, setDialogConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        type: 'confirm'
    });

    // ========== Ações para Modais ==========
    const openAddGroupForm = useCallback(() => {
        setShowAddGroupForm(true);
    }, []);

    const closeAddGroupForm = useCallback(() => {
        setShowAddGroupForm(false);
    }, []);

    const openAddServerToGroup = useCallback((groupId) => {
        setAddingToGroupId(groupId);
    }, []);

    const closeAddServerToGroup = useCallback(() => {
        setAddingToGroupId(null);
    }, []);

    const openADModal = useCallback(() => {
        setShowADModal(true);
    }, []);

    const closeADModal = useCallback(() => {
        setShowADModal(false);
    }, []);

    const openBulkPasswordModal = useCallback(() => {
        setShowBulkPasswordModal(true);
    }, []);

    const closeBulkPasswordModal = useCallback(() => {
        setShowBulkPasswordModal(false);
    }, []);

    // ========== Ações para Edição ==========
    const startEditServer = useCallback((server) => {
        setEditingServer(server);
    }, []);

    const closeEditServer = useCallback(() => {
        setEditingServer(null);
    }, []);

    const startEditVncConnection = useCallback((connection) => {
        setEditingVncConnection(connection);
    }, []);

    const closeEditVncConnection = useCallback(() => {
        setEditingVncConnection(null);
    }, []);

    // ========== Ações para Conexões Ativas ==========
    const openVncConnection = useCallback((connection) => {
        setActiveVncConnection(connection);
    }, []);

    const closeVncConnection = useCallback(() => {
        setActiveVncConnection(null);
    }, []);

    const openRemoteConnection = useCallback((connection) => {
        setActiveRemoteConnection(connection);
    }, []);

    const closeRemoteConnection = useCallback(() => {
        setActiveRemoteConnection(null);
    }, []);

    // ========== Ações para Diálogo de Confirmação ==========
    const showConfirmDialog = useCallback((config) => {
        setDialogConfig({
            isOpen: true,
            title: config.title || 'Confirmação',
            message: config.message || '',
            onConfirm: config.onConfirm || (() => { }),
            onCancel: config.onCancel || (() => { }),
            confirmText: config.confirmText || 'Confirmar',
            cancelText: config.cancelText || 'Cancelar',
            type: config.type || 'confirm'
        });
    }, []);

    const closeDialog = useCallback(() => {
        setDialogConfig(prev => ({ ...prev, isOpen: false }));
    }, []);

    const value = {
        // Estados de Modais
        showAddGroupForm,
        addingToGroupId,
        showADModal,
        showBulkPasswordModal,

        // Estados de Edição
        editingServer,
        editingVncConnection,

        // Estados de Conexões
        activeVncConnection,
        activeRemoteConnection,

        // Estado de Diálogo
        dialogConfig,

        // Setters diretos (para compatibilidade)
        setShowAddGroupForm,
        setAddingToGroupId,
        setShowADModal,
        setShowBulkPasswordModal,
        setEditingServer,
        setEditingVncConnection,
        setActiveVncConnection,
        setActiveRemoteConnection,
        setDialogConfig,

        // Ações semânticas
        openAddGroupForm,
        closeAddGroupForm,
        openAddServerToGroup,
        closeAddServerToGroup,
        openADModal,
        closeADModal,
        openBulkPasswordModal,
        closeBulkPasswordModal,
        startEditServer,
        closeEditServer,
        startEditVncConnection,
        closeEditVncConnection,
        openVncConnection,
        closeVncConnection,
        openRemoteConnection,
        closeRemoteConnection,
        showConfirmDialog,
        closeDialog
    };

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    );
}

// Hook customizado
export function useModals() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModals deve ser usado dentro de ModalProvider');
    }
    return context;
}

export default ModalContext;
