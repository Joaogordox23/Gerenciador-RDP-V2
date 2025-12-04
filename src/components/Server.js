import React, { useState, useCallback, useMemo } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { useConnectivity } from '../hooks/useConnectivity';
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
  AccessTimeIcon
} from './MuiIcons';

function Server({
  serverInfo,
  onDelete,
  onUpdate,
  isActive,
  isEditModeEnabled,
  index,
  isConnectivityEnabled = true,
  onEdit // Nova prop para modal global
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

    try {
      if (window.api?.connection?.connect) {
        await window.api.connection.connect(serverInfo);
      } else {
        console.error('❌ API de conexão não disponível');
        throw new Error('API de conexão não disponível');
      }
    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
    } finally {
      // Remove estado de conectando após 3 segundos
      setTimeout(() => setIsConnecting(false), 3000);
    }
  }, [isEditModeEnabled, serverInfo]);

  const handleTestConnectivity = useCallback((e) => {
    e.stopPropagation();
    testServer(serverInfo);
  }, [testServer, serverInfo]);

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
          className={`server-item draggable-item ${statusInfo.className} 
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

          {/* === CABEÇALHO DO SERVIDOR === */}
          <div className="server-header">
            <div className="server-protocol">
              <span className={`protocol-badge protocol-${serverInfo.protocol}`}>
                {serverInfo.protocol.toUpperCase()}
              </span>
            </div>

            <div className="server-status">
              <span className={`status-indicator status-${statusInfo.className}`} title={statusInfo.text}>
                {statusInfo.icon}
              </span>
              <span className="status-text">{statusInfo.text}</span>
            </div>
          </div>

          {/* === INFORMAÇÕES DO SERVIDOR === */}
          <div className="server-info">
            <h3 className="server-name" title={serverInfo.name}>
              {serverInfo.name}
            </h3>
            <p className="server-address" title={`${serverInfo.ipAddress}${serverInfo.port ? ':' + serverInfo.port : ''}`}>
              {serverInfo.ipAddress}
              {serverInfo.port && <span className="port-number">:{serverInfo.port}</span>}
            </p>
            {serverInfo.username && (
              <p className="server-username" title={`Usuário: ${serverInfo.username}`}>
                <PersonOutlineIcon sx={{ fontSize: 16, marginRight: '4px', verticalAlign: 'middle' }} />
                {serverInfo.username}
                {serverInfo.domain && <span className="domain">@{serverInfo.domain}</span>}
              </p>
            )}
            {connectivityResult && connectivityResult.latency && (
              <div className={`latency-badge ${getLatencyClass(connectivityResult.latency)}`}>
                {connectivityResult.latency}ms
              </div>
            )}
          </div>

          {/* === AÇÕES DO SERVIDOR === */}
          {isEditModeEnabled && (
            <div className="server-actions" onClick={(e) => e.stopPropagation()}>
              {isConnectivityEnabled && (
                <>
                  <button
                    type="button"
                    onClick={handleTestConnectivity}
                    className={`action-btn test-btn ${isCurrentlyTesting ? 'testing' : ''}`}
                    title="Testar conectividade"
                    disabled={isCurrentlyTesting}
                    aria-label="Testar conectividade do servidor"
                  >
                    <RefreshIcon sx={{ fontSize: 20 }} />
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleMonitoring}
                    className={`action-btn monitor-btn ${isMonitored ? 'active' : ''}`}
                    title={isMonitored ? 'Parar monitoramento' : 'Iniciar monitoramento'}
                    aria-label={isMonitored ? 'Parar monitoramento' : 'Iniciar monitoramento'}
                  >
                    <MonitorHeartIcon sx={{ fontSize: 20 }} />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(serverInfo); // Chama modal global
                }}
                className="action-btn edit-btn"
                title="Editar servidor"
                aria-label="Editar configurações do servidor"
              >
                <EditIcon sx={{ fontSize: 20 }} />
              </button>

              <button
                type="button"
                onClick={handleDeleteClick}
                className="action-btn delete-btn"
                title="Excluir servidor"
                aria-label="Excluir servidor"
              >
                <DeleteIcon sx={{ fontSize: 20 }} />
              </button>
            </div>
          )}

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
          </div>
        </div>
      )
      }
    </Draggable >
  );
}

export default React.memo(Server);