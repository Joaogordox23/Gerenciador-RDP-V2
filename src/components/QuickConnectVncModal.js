/**
 * QuickConnectVncModal.js
 * Modal para conexão VNC rápida (temporária)
 * v4.4: Feature de Quick Connect
 * 
 * Migrado para Tailwind CSS
 */

import React, { useState, useCallback } from 'react';
import {
    ComputerIcon,
    SettingsEthernetIcon,
    LockIcon,
    PlayArrowIcon,
    SaveIcon,
    CancelIcon,
    FlashOnIcon
} from './MuiIcons';
import VncViewerModal from './VncViewerModal';
import Modal from './Modal';

/**
 * Modal de Conexão Rápida VNC
 * @param {boolean} isOpen - Se o modal está aberto
 * @param {function} onClose - Callback para fechar
 * @param {Array} vncGroups - Lista de grupos VNC disponíveis
 * @param {function} onSaveConnection - Callback para salvar conexão: (groupId, connectionData) => void
 */
function QuickConnectVncModal({ isOpen, onClose, vncGroups = [], onSaveConnection }) {
    // Estados do formulário
    const [formData, setFormData] = useState({
        name: '',
        ipAddress: '',
        port: '5900',
        password: ''
    });

    // Estados de controle
    const [isConnecting, setIsConnecting] = useState(false);
    const [showVncViewer, setShowVncViewer] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [connectionData, setConnectionData] = useState(null);

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

    // Conectar
    const handleConnect = useCallback(() => {
        if (!formData.ipAddress.trim()) {
            alert('Por favor, informe o IP ou hostname.');
            return;
        }

        // Prepara dados da conexão temporária
        const tempConnection = {
            id: `temp-${Date.now()}`, // ID temporário
            name: getConnectionName(),
            ipAddress: formData.ipAddress.trim(),
            port: formData.port || '5900',
            password: formData.password,
            isTemporary: true
        };

        setConnectionData(tempConnection);
        setShowVncViewer(true);
    }, [formData, getConnectionName]);

    // Quando fecha o VNC viewer
    const handleVncClose = useCallback(() => {
        setShowVncViewer(false);

        // Pergunta se quer salvar
        if (connectionData) {
            setShowSaveDialog(true);
        }
    }, [connectionData]);

    // Finaliza e reseta (definido primeiro para ser usado como dependência)
    const handleFinish = useCallback(() => {
        setShowSaveDialog(false);
        setShowVncViewer(false);
        setConnectionData(null);
        setSelectedGroupId('');
        setFormData({
            name: '',
            ipAddress: '',
            port: '5900',
            password: ''
        });
        onClose();
    }, [onClose]);

    // Salvar conexão
    const handleSaveConnection = useCallback(() => {
        if (!selectedGroupId || !connectionData) {
            alert('Selecione um grupo para salvar a conexão.');
            return;
        }

        // Chama callback para salvar (sem ID temporário, vai gerar novo no banco)
        onSaveConnection(Number(selectedGroupId), {
            name: connectionData.name,
            ipAddress: connectionData.ipAddress,
            port: connectionData.port,
            password: connectionData.password,
            protocol: 'vnc'
        });

        // Fecha tudo
        handleFinish();
    }, [selectedGroupId, connectionData, onSaveConnection, handleFinish]);

    // Não salvar, apenas fechar
    const handleDontSave = useCallback(() => {
        handleFinish();
    }, [handleFinish]);

    // Fecha o modal principal (sem conectar)
    const handleCloseModal = useCallback(() => {
        if (showVncViewer) {
            // Se VNC está aberto, fecha ele primeiro (vai mostrar diálogo)
            handleVncClose();
        } else if (showSaveDialog) {
            // Se diálogo está aberto, não fecha direto
            return;
        } else {
            onClose();
        }
    }, [showVncViewer, showSaveDialog, handleVncClose, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {/* Modal do Formulário */}
            {!showVncViewer && !showSaveDialog && (
                <Modal
                    isOpen={true}
                    onClose={handleCloseModal}
                    title="Conexão VNC Rápida"
                    icon={<FlashOnIcon sx={{ fontSize: 24 }} />}
                    size="small"
                >
                    <div className="py-2">
                        {/* Hint */}
                        <p className="
                            text-sm text-gray-400 mb-5
                            px-4 py-3
                            bg-primary/10 rounded-lg
                            border-l-3 border-primary
                        ">
                            Conecte-se temporariamente a um servidor VNC. Você poderá salvar esta conexão após desconectar.
                        </p>

                        {/* Nome (opcional) */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                Nome (opcional)
                            </label>
                            <div className="relative">
                                <ComputerIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Servidor Temporário"
                                    className="
                                        w-full pl-10 pr-4 py-2.5
                                        bg-dark-elevated border border-dark-border rounded-lg
                                        text-white placeholder-gray-500
                                        focus:border-primary focus:ring-1 focus:ring-primary/30
                                        outline-none transition-all
                                    "
                                />
                            </div>
                        </div>

                        {/* IP ou Hostname */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                IP ou Hostname *
                            </label>
                            <div className="relative">
                                <SettingsEthernetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                                <input
                                    type="text"
                                    name="ipAddress"
                                    value={formData.ipAddress}
                                    onChange={handleInputChange}
                                    placeholder="Ex: 192.168.1.100"
                                    className="
                                        w-full pl-10 pr-4 py-2.5
                                        bg-dark-elevated border border-dark-border rounded-lg
                                        text-white placeholder-gray-500
                                        focus:border-primary focus:ring-1 focus:ring-primary/30
                                        outline-none transition-all
                                    "
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>

                        {/* Porta e Senha */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Porta
                                </label>
                                <div className="relative">
                                    <SettingsEthernetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                                    <input
                                        type="number"
                                        name="port"
                                        value={formData.port}
                                        onChange={handleInputChange}
                                        placeholder="5900"
                                        className="
                                            w-full pl-10 pr-4 py-2.5
                                            bg-dark-elevated border border-dark-border rounded-lg
                                            text-white placeholder-gray-500
                                            focus:border-primary focus:ring-1 focus:ring-primary/30
                                            outline-none transition-all
                                        "
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Senha (opcional)
                                </label>
                                <div className="relative">
                                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Senha VNC"
                                        className="
                                            w-full pl-10 pr-4 py-2.5
                                            bg-dark-elevated border border-dark-border rounded-lg
                                            text-white placeholder-gray-500
                                            focus:border-primary focus:ring-1 focus:ring-primary/30
                                            outline-none transition-all
                                        "
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-border">
                            <button
                                type="button"
                                onClick={onClose}
                                className="
                                    flex items-center gap-1.5
                                    px-4 py-2
                                    bg-dark-elevated text-gray-300
                                    rounded-lg text-sm font-medium
                                    hover:bg-dark-border
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
                                    bg-primary text-black
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

            {/* VNC Viewer Modal */}
            {showVncViewer && connectionData && (
                <VncViewerModal
                    connectionInfo={connectionData}
                    onClose={handleVncClose}
                />
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
                        <p className="mb-3 text-base">
                            Deseja salvar a conexão <strong className="text-primary">"{connectionData?.name}"</strong> em um grupo?
                        </p>
                        <p className="text-sm text-gray-400 italic mb-5">
                            Se não salvar, a conexão será perdida.
                        </p>

                        {/* Select Group */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                Selecione um grupo:
                            </label>
                            <select
                                value={selectedGroupId}
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                className="
                                    w-full px-4 py-2.5
                                    bg-dark-elevated border border-dark-border rounded-lg
                                    text-white
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
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-border">
                            <button
                                type="button"
                                onClick={handleDontSave}
                                className="
                                    flex items-center gap-1.5
                                    px-4 py-2
                                    bg-dark-elevated text-gray-300
                                    rounded-lg text-sm font-medium
                                    hover:bg-dark-border
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
                                    bg-primary text-black
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
