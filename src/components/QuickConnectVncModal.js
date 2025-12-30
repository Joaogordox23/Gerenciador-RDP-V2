/**
 * QuickConnectVncModal.js
 * Modal para conexão VNC rápida (temporária)
 * v5.11: Corrigido para usar sistema de tabs + modo claro
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
    ComputerIcon,
    SettingsEthernetIcon,
    LockIcon,
    PlayArrowIcon,
    SaveIcon,
    CancelIcon,
    FlashOnIcon
} from './MuiIcons';
import Modal from './Modal';
import { useModals } from '../contexts/ModalContext';

/**
 * Modal de Conexão Rápida VNC
 * @param {boolean} isOpen - Se o modal está aberto
 * @param {function} onClose - Callback para fechar
 * @param {Array} vncGroups - Lista de grupos VNC disponíveis
 * @param {function} onSaveConnection - Callback para salvar conexão: (groupId, connectionData) => void
 * @param {function} onVncConnect - Callback para abrir conexão VNC: (connectionInfo) => void
 */
function QuickConnectVncModal({ isOpen, onClose, vncGroups = [], onSaveConnection, onVncConnect }) {
    // ✅ v5.11: Usa contexto para detectar quando tab temporária fecha
    const { pendingSaveConnection, setPendingSaveConnection } = useModals();

    // Estados do formulário
    const [formData, setFormData] = useState({
        name: '',
        ipAddress: '',
        port: '5900',
        password: ''
    });

    // Estados de controle
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [connectionData, setConnectionData] = useState(null);

    // ✅ v5.11: Detecta quando uma conexão temporária é fechada e mostra diálogo
    useEffect(() => {
        if (pendingSaveConnection) {
            setConnectionData(pendingSaveConnection);
            setShowSaveDialog(true);
            // Limpa o estado pendente
            setPendingSaveConnection(null);
        }
    }, [pendingSaveConnection, setPendingSaveConnection]);

    // Handler de input
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    // Gera nome automático se não preenchido
    const getConnectionName = useCallback(() => {
        if (formData.name.trim()) return formData.name.trim();
        return `VNC-${formData.ipAddress}`;
    }, [formData.name, formData.ipAddress]);

    // ✅ v5.11: Conectar usando sistema de tabs
    const handleConnect = useCallback(() => {
        if (!formData.ipAddress.trim()) {
            alert('Por favor, informe o IP ou hostname.');
            return;
        }

        // Prepara dados da conexão temporária
        const tempConnection = {
            id: `temp-${Date.now()}`,
            name: getConnectionName(),
            ipAddress: formData.ipAddress.trim(),
            port: formData.port || '5900',
            password: formData.password,
            isTemporary: true
        };

        // ✅ Usa o callback para abrir na tab
        if (onVncConnect) {
            onVncConnect(tempConnection);
        }

        // Fecha o modal e reseta formulário
        setFormData({
            name: '',
            ipAddress: '',
            port: '5900',
            password: ''
        });
        onClose();

        // Nota: O diálogo de salvar não é mais mostrado automaticamente
        // O usuário pode adicionar a conexão manualmente se desejar
    }, [formData, getConnectionName, onVncConnect, onClose]);

    // Finaliza e reseta
    const handleFinish = useCallback(() => {
        setShowSaveDialog(false);
        setConnectionData(null);
        setSelectedGroupId('');
        setFormData({
            name: '',
            ipAddress: '',
            port: '5900',
            password: ''
        });
    }, []);

    // Salvar conexão
    const handleSaveConnection = useCallback(() => {
        if (!selectedGroupId || !connectionData) {
            alert('Selecione um grupo para salvar a conexão.');
            return;
        }

        onSaveConnection(Number(selectedGroupId), {
            name: connectionData.name,
            ipAddress: connectionData.ipAddress,
            port: connectionData.port,
            password: connectionData.password,
            protocol: 'vnc'
        });

        handleFinish();
    }, [selectedGroupId, connectionData, onSaveConnection, handleFinish]);

    // Não salvar, apenas fechar
    const handleDontSave = useCallback(() => {
        handleFinish();
    }, [handleFinish]);

    if (!isOpen && !showSaveDialog) return null;

    // Classes com suporte a modo claro
    const inputClasses = `
        w-full pl-10 pr-4 py-2.5
        bg-white dark:bg-dark-elevated 
        border border-gray-300 dark:border-dark-border rounded-lg
        text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
        focus:border-primary focus:ring-1 focus:ring-primary/30
        outline-none transition-all
    `;

    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

    return (
        <>
            {/* Modal do Formulário */}
            {isOpen && !showSaveDialog && (
                <Modal
                    isOpen={true}
                    onClose={onClose}
                    title="Conexão VNC Rápida"
                    icon={<FlashOnIcon sx={{ fontSize: 24 }} />}
                    size="small"
                >
                    <div className="py-2">
                        {/* Hint */}
                        <p className="
                            text-sm text-gray-600 dark:text-gray-400 mb-5
                            px-4 py-3
                            bg-primary/10 rounded-lg
                            border-l-3 border-primary
                        ">
                            Conecte-se temporariamente a um servidor VNC. Você poderá salvar esta conexão após desconectar.
                        </p>

                        {/* Nome (opcional) */}
                        <div className="mb-4">
                            <label className={labelClasses}>
                                Nome (opcional)
                            </label>
                            <div className="relative">
                                <ComputerIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Servidor Temporário"
                                    className={inputClasses}
                                />
                            </div>
                        </div>

                        {/* IP ou Hostname */}
                        <div className="mb-4">
                            <label className={labelClasses}>
                                IP ou Hostname *
                            </label>
                            <div className="relative">
                                <SettingsEthernetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                <input
                                    type="text"
                                    name="ipAddress"
                                    value={formData.ipAddress}
                                    onChange={handleInputChange}
                                    placeholder="Ex: 192.168.1.100"
                                    className={inputClasses}
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>

                        {/* Porta e Senha */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClasses}>
                                    Porta
                                </label>
                                <div className="relative">
                                    <SettingsEthernetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                    <input
                                        type="number"
                                        name="port"
                                        value={formData.port}
                                        onChange={handleInputChange}
                                        placeholder="5900"
                                        className={inputClasses}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>
                                    Senha (opcional)
                                </label>
                                <div className="relative">
                                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Senha VNC"
                                        className={inputClasses}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-dark-border">
                            <button
                                type="button"
                                onClick={onClose}
                                className="
                                    flex items-center gap-1.5
                                    px-4 py-2
                                    bg-gray-100 dark:bg-dark-elevated text-gray-700 dark:text-gray-300
                                    rounded-lg text-sm font-medium
                                    hover:bg-gray-200 dark:hover:bg-dark-border
                                    transition-colors cursor-pointer
                                "
                            >
                                <CancelIcon sx={{ fontSize: 18 }} />
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConnect}
                                disabled={!formData.ipAddress.trim()}
                                className="
                                    flex items-center gap-1.5
                                    px-4 py-2
                                    bg-primary text-white
                                    rounded-lg text-sm font-medium
                                    hover:bg-primary-hover
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    transition-colors cursor-pointer
                                "
                            >
                                <PlayArrowIcon sx={{ fontSize: 20 }} />
                                Conectar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Diálogo de Salvar */}
            {showSaveDialog && (
                <Modal
                    isOpen={true}
                    onClose={handleDontSave}
                    title="Salvar Conexão?"
                    icon={<SaveIcon sx={{ fontSize: 24 }} />}
                    size="small"
                >
                    <div className="py-2">
                        <p className="mb-3 text-base text-gray-800 dark:text-white">
                            Deseja salvar a conexão <strong className="text-primary">"{connectionData?.name}"</strong> em um grupo?
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-5">
                            Se não salvar, a conexão será perdida.
                        </p>

                        {/* Select Group */}
                        <div className="mb-4">
                            <label className={labelClasses}>
                                Selecione um grupo:
                            </label>
                            <select
                                value={selectedGroupId}
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                className="
                                    w-full px-4 py-2.5
                                    bg-white dark:bg-dark-elevated 
                                    border border-gray-300 dark:border-dark-border rounded-lg
                                    text-gray-900 dark:text-white
                                    focus:border-primary focus:ring-1 focus:ring-primary/30
                                    outline-none transition-all
                                    cursor-pointer
                                "
                            >
                                <option value="">-- Selecione um grupo --</option>
                                {vncGroups.map(group => (
                                    <option key={group.id} value={group.id}>
                                        {group.groupName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-dark-border">
                            <button
                                type="button"
                                onClick={handleDontSave}
                                className="
                                    flex items-center gap-1.5
                                    px-4 py-2
                                    bg-gray-100 dark:bg-dark-elevated text-gray-700 dark:text-gray-300
                                    rounded-lg text-sm font-medium
                                    hover:bg-gray-200 dark:hover:bg-dark-border
                                    transition-colors cursor-pointer
                                "
                            >
                                <CancelIcon sx={{ fontSize: 18 }} />
                                Não Salvar
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveConnection}
                                disabled={!selectedGroupId}
                                className="
                                    flex items-center gap-1.5
                                    px-4 py-2
                                    bg-primary text-white
                                    rounded-lg text-sm font-medium
                                    hover:bg-primary-hover
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    transition-colors cursor-pointer
                                "
                            >
                                <SaveIcon sx={{ fontSize: 18 }} />
                                Salvar no Grupo
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}

export default QuickConnectVncModal;
