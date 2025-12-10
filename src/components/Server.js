import React, { useState, useCallback, useMemo } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { useConnectivity } from '../hooks/useConnectivity';
import './Server.css';
import {
  EditIcon,
  DeleteIcon,
  RefreshIcon,
  MonitorHeartIcon,
  HourglassEmptyIcon,
  CircleIcon,
  SyncIcon,
  HelpOutlineIcon,
  CheckCircleOutlineIcon,
  CancelIcon,
  WarningAmberIcon,
  ErrorOutlineIcon,
  PersonOutlineIcon,
  BarChartIcon,
  LinkIcon,
  AccessTimeIcon,
  OpenInNewIcon
} from './MuiIcons';
import LoadingOverlay from './LoadingOverlay';

function Server({
  serverInfo,
  onDelete,
  onUpdate,
  isActive,
  isEditModeEnabled,
  index,
  isConnectivityEnabled = true,
  onEdit,
  onRemoteConnect, // Conexão Guacamole (modal único)
  onOpenInTab // Conexão em nova aba (sistema de abas)
}) {
  const [isConnecting, setIsConnecting] = useState(false);

  const {
    results,
    isTesting,
    monitoredServers,
    generateServerKey,
    testServer,
    startMonitoring,
    stopMonitoring
  } = useConnectivity();

  // Memoizar chave do servidor para performance
  const serverKey = useMemo(() => generateServerKey(serverInfo), [serverInfo, generateServerKey]);
  const connectivityResult = results.get(serverKey);
  const isCurrentlyTesting = isTesting.has(serverKey);
  const isMonitored = monitoredServers.has(serverKey);

  // === HANDLERS ===
  const handleConnect = useCallback(async () => {
    if (isEditModeEnabled) return;

    setIsConnecting(true);
    const protocol = serverInfo.protocol || 'rdp';

    try {
      // SSH: Usa terminal nativo (xterm.js) via sistema de abas
      if (protocol === 'ssh' && onOpenInTab) {
        console.log('🔐 Conectando SSH nativo:', serverInfo.name);
        onOpenInTab(serverInfo, 'ssh');
      }
      // RDP: Usa Guacamole se disponível, senão mstsc.exe
      else if (onRemoteConnect) {
        console.log('🥑 Conectando via Guacamole:', serverInfo.name);
        onRemoteConnect(serverInfo);
      } else if (window.api?.connection?.connect) {
        console.log('🖥️ Conectando via mstsc.exe:', serverInfo.name);
        await window.api.connection.connect(serverInfo);
      } else {
        console.error('❌ API de conexão não disponível');
        throw new Error('API de conexão não disponível');
      }
    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
    } finally {
      // Remove estado de conectando após 1 segundo
      setTimeout(() => setIsConnecting(false), 1000);
    }
  }, [isEditModeEnabled, serverInfo, onRemoteConnect, onOpenInTab]);


  const handleTestConnectivity = useCallback((e) => {
    e.stopPropagation();
    testServer(serverInfo);
  }, [testServer, serverInfo]);

  // Handler para abrir em nova aba
  const handleOpenInTab = useCallback((e) => {
    e.stopPropagation();
    if (onOpenInTab) {
      const protocol = serverInfo.protocol || 'rdp';
      console.log('📑 Abrindo em nova aba:', serverInfo.name, protocol);
      onOpenInTab(serverInfo, protocol);
    }
  }, [onOpenInTab, serverInfo]);

  const handleToggleMonitoring = useCallback((e) => {
    e.stopPropagation();
    if (isMonitored) {
      stopMonitoring(serverKey);
    } else {
      startMonitoring(serverInfo);
    }
  }, [isMonitored, stopMonitoring, startMonitoring, serverKey, serverInfo]);

  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation();

    // Para monitoramento se ativo
    if (isMonitored) {
      stopMonitoring(serverKey);
    }

    // Confirma exclusão
    if (window.confirm(`Tem certeza que deseja excluir o servidor "${serverInfo.name}"?`)) {
      onDelete();
    }
  }, [isMonitored, stopMonitoring, serverKey, serverInfo.name, onDelete]);

  const getLatencyClass = (latency) => {
    if (!latency || latency === null) return null;
    if (latency < 50) return 'latency-good';
    if (latency < 150) return 'latency-medium';
    return 'latency-bad';
  };

  // === STATUS INFO ===
  const statusInfo = useMemo(() => {
    if (isConnecting) return {
      text: 'Conectando...',
      className: 'connecting',
      icon: <HourglassEmptyIcon sx={{ fontSize: 16 }} />
    };

    if (isActive) return {
      text: 'Ativo',
      className: 'active',
      icon: <CircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
    };

    if (isCurrentlyTesting) return {
      text: 'Testando...',
      className: 'testing',
      icon: <SyncIcon sx={{ fontSize: 16 }} className="rotating" />
    };

    if (!connectivityResult) return {
      text: 'Desconhecido',
      className: 'unknown',
      icon: <HelpOutlineIcon sx={{ fontSize: 16 }} />
    };

    switch (connectivityResult.status) {
      case 'online': return { text: 'Online', className: 'online', icon: <CheckCircleOutlineIcon sx={{ fontSize: 16 }} /> };
      case 'offline': return { text: 'Offline', className: 'offline', icon: <CancelIcon sx={{ fontSize: 16 }} /> };
      case 'partial': return { text: 'Parcial', className: 'partial', icon: <WarningAmberIcon sx={{ fontSize: 16 }} /> };
      default: return { text: 'Erro', className: 'error', icon: <ErrorOutlineIcon sx={{ fontSize: 16 }} /> };
    }
  }, [isActive, isConnecting, isCurrentlyTesting, connectivityResult]);

  // === RENDER SERVIDOR NORMAL ===
  return (
    <Draggable
      draggableId={`server-${serverInfo.id}`}
      index={index}
      isDragDisabled={!isEditModeEnabled}
    >
      {(provided, snapshot) => (
        <div
          className={`server-item server-card-base draggable-item ${statusInfo.className} 
                     ${isMonitored ? 'monitored' : ''} 
                     ${snapshot.isDragging ? 'dragging' : ''}
                     ${isConnecting ? 'connecting' : ''}
                     ${isActive ? 'active-connection' : ''}
                     ${isEditModeEnabled ? 'edit-mode-draggable' : ''}`}
          onClick={handleConnect}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          role="button"
          tabIndex={0}
          aria-label={`Servidor ${serverInfo.name} - Status: ${statusInfo.text}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleConnect();
            }
          }}
        >
          {/* Indicador visual de arrastar - apenas visual, não drag handle */}
          {isEditModeEnabled && (
            <div
              className="server-drag-indicator"
              title="Arraste o card para reordenar"
            >
              <span>⋮⋮</span>
            </div>
          )}
          {/* Loading Overlay */}
          {isConnecting && (
            <LoadingOverlay text="Conectando..." variant="connecting" />
          )}
          {isCurrentlyTesting && !isConnecting && (
            <LoadingOverlay text="Testando..." variant="testing" />
          )}

          {/* === CABEÇALHO DO SERVIDOR === */}
          <div className="server-card-header">
            <div className="server-card-info">
              <div className="server-card-title">
                <span className={`protocol-badge protocol-${serverInfo.protocol}`}>
                  {serverInfo.protocol.toUpperCase()}
                </span>
                <span className="server-card-name">{serverInfo.name}</span>
              </div>

              <div className="server-card-details">
                <div className="server-card-address">
                  <LinkIcon sx={{ fontSize: 12 }} />
                  <span>{serverInfo.ipAddress}</span>
                  {serverInfo.port && <span className="port-number">:{serverInfo.port}</span>}
                </div>
                {serverInfo.username && (
                  <div className="server-card-user">
                    <PersonOutlineIcon sx={{ fontSize: 12 }} />
                    <span>{serverInfo.username}</span>
                    {serverInfo.domain && <span className="domain">@{serverInfo.domain}</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="server-card-actions" onClick={(e) => e.stopPropagation()}>
              <div className="server-status">
                <span className={`status-indicator status-${statusInfo.className}`} title={statusInfo.text}>
                  {statusInfo.icon}
                </span>
              </div>
            </div>
          </div>

          <div className="server-card-actions" onClick={(e) => e.stopPropagation()}>
            {isConnectivityEnabled && (
              <>
                <button
                  type="button"
                  onClick={handleToggleMonitoring}
                  className={`server-card-action-btn monitor-btn ${isMonitored ? 'active' : ''}`}
                  title={isMonitored ? 'Parar monitoramento' : 'Iniciar monitoramento'}
                >
                  <MonitorHeartIcon sx={{ fontSize: 20 }} />
                </button>
                <button
                  type="button"
                  onClick={handleTestConnectivity}
                  className={`server-card-action-btn test-btn ${isCurrentlyTesting ? 'testing' : ''}`}
                  title="Testar conectividade"
                  disabled={isCurrentlyTesting}
                >
                  <RefreshIcon sx={{ fontSize: 20 }} />
                </button>
              </>
            )}

            {/* Botão de nova aba - sempre visível quando disponível */}
            {onOpenInTab && (
              <button
                type="button"
                onClick={handleOpenInTab}
                className="server-card-action-btn tab-btn"
                title="Abrir em nova aba"
              >
                <OpenInNewIcon sx={{ fontSize: 20 }} />
              </button>
            )}

            {isEditModeEnabled && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(serverInfo);
                  }}
                  className="server-card-action-btn edit-btn"
                  title="Editar servidor"
                >
                  <EditIcon sx={{ fontSize: 20 }} />
                </button>

                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="server-card-action-btn delete-btn"
                  title="Excluir servidor"
                >
                  <DeleteIcon sx={{ fontSize: 20 }} />
                </button>
              </>
            )}
          </div>

          {/* === INDICADORES ADICIONAIS === */}
          <div className="server-indicators">
            {isMonitored && (
              <span className="indicator monitoring-indicator" title="Monitoramento ativo">
                <BarChartIcon sx={{ fontSize: 16 }} />
              </span>
            )}
            {isActive && (
              <span className="indicator active-indicator" title="Conexão ativa">
                <LinkIcon sx={{ fontSize: 16 }} />
              </span>
            )}
            {connectivityResult?.lastCheck && (
              <span className="indicator last-check" title={`Última verificação: ${new Date(connectivityResult.lastCheck).toLocaleString()}`}>
                <AccessTimeIcon sx={{ fontSize: 16 }} />
              </span>
            )}
            {connectivityResult && connectivityResult.latency && (
              <div className={`latency-badge ${getLatencyClass(connectivityResult.latency)}`}>
                {connectivityResult.latency}ms
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default React.memo(Server);