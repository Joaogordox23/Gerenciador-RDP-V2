/**
 * QuickConnectVncModal.js
 * Modal para conexão VNC rápida (temporária)
 * v4.4: Feature de Quick Connect
 */

import React, { useState, useCallback } from 'react';
import {
    ComputerIcon,
    SettingsEthernetIcon,
    LockIcon,
    PlayArrowIcon,
    CloseIcon,
    SaveIcon,
    CancelIcon,
    FlashOnIcon
} from './MuiIcons';
import VncViewerModal from './VncViewerModal';
import Modal from './Modal';
import './QuickConnectVncModal.css';

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
    }, [selectedGroupId, connectionData, onSaveConnection]);

    // Não salvar, apenas fechar
    const handleDontSave = useCallback(() => {
        handleFinish();
    }, []);

    // Finaliza e reseta
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
                    <div className="quick-connect-form">
                        <p className="quick-connect-hint">
                            Conecte-se temporariamente a um servidor VNC. Você poderá salvar esta conexão após desconectar.
                        </p>

                        <div className="form-group">
                            <label>Nome (opcional)</label>
                            <div className="input-with-icon">
                                <ComputerIcon className="input-icon" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Servidor Temporário"
                                    className="form-control"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>IP ou Hostname *</label>
                            <div className="input-with-icon">
                                <SettingsEthernetIcon className="input-icon" />
                                <input
                                    type="text"
                                    name="ipAddress"
                                    value={formData.ipAddress}
                                    onChange={handleInputChange}
                                    placeholder="Ex: 192.168.1.100"
                                    className="form-control"
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Porta</label>
                                <div className="input-with-icon">
                                    <SettingsEthernetIcon className="input-icon" />
                                    <input
                                        type="number"
                                        name="port"
                                        value={formData.port}
                                        onChange={handleInputChange}
                                        placeholder="5900"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Senha (opcional)</label>
                                <div className="input-with-icon">
                                    <LockIcon className="input-icon" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Senha VNC"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" onClick={onClose} className="btn btn--secondary">
                                <CancelIcon sx={{ fontSize: 18, marginRight: '6px' }} />
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConnect}
                                className="btn btn--primary"
                                disabled={!formData.ipAddress.trim()}
                            >
                                <PlayArrowIcon sx={{ fontSize: 20, marginRight: '6px' }} />
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
                    <div className="save-connection-dialog">
                        <p>
                            Deseja salvar a conexão <strong>"{connectionData?.name}"</strong> em um grupo?
                        </p>
                        <p className="save-hint">
                            Se não salvar, a conexão será perdida.
                        </p>

                        <div className="form-group">
                            <label>Selecione um grupo:</label>
                            <select
                                value={selectedGroupId}
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                className="form-control"
                            >
                                <option value="">-- Selecione um grupo --</option>
                                {vncGroups.map(group => (
                                    <option key={group.id} value={group.id}>
                                        {group.groupName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-actions">
                            <button type="button" onClick={handleDontSave} className="btn btn--secondary">
                                <CancelIcon sx={{ fontSize: 18, marginRight: '6px' }} />
                                Não Salvar
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveConnection}
                                className="btn btn--primary"
                                disabled={!selectedGroupId}
                            >
                                <SaveIcon sx={{ fontSize: 18, marginRight: '6px' }} />
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
