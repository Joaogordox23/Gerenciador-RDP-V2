// src/components/Server.js
// ✨ v4.8: Migrado para Tailwind CSS
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
  AccessTimeIcon,
  OpenInNewIcon
} from './MuiIcons';

function Server({
  serverInfo,
  onDelete,
  onUpdate,
  isActive,
  isEditModeEnabled,
  index,
  isConnectivityEnabled = true,
  onEdit,
  onRemoteConnect,
  onOpenInTab
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

  const serverKey = useMemo(() => generateServerKey(serverInfo), [serverInfo, generateServerKey]);
  const connectivityResult = results.get(serverKey);
  const isCurrentlyTesting = isTesting.has(serverKey);
  const isMonitored = monitoredServers.has(serverKey);

  const handleConnect = useCallback(async () => {
    if (isEditModeEnabled) return;
    setIsConnecting(true);
    const protocol = serverInfo.protocol || 'rdp';

    try {
      if (protocol === 'ssh' && onOpenInTab) {
        onOpenInTab(serverInfo, 'ssh');
      } else if (protocol === 'rdp' && window.api?.connection?.connect) {
        await window.api.connection.connect(serverInfo);
      } else if (onRemoteConnect) {
        onRemoteConnect(serverInfo);
      }
    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
    } finally {
      setTimeout(() => setIsConnecting(false), 1000);
    }
  }, [isEditModeEnabled, serverInfo, onRemoteConnect, onOpenInTab]);

  const handleTestConnectivity = useCallback((e) => {
    e.stopPropagation();
    testServer(serverInfo);
  }, [testServer, serverInfo]);

  const handleOpenInTab = useCallback((e) => {
    e.stopPropagation();
    if (onOpenInTab) {
      onOpenInTab(serverInfo, serverInfo.protocol || 'rdp');
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
    if (isMonitored) stopMonitoring(serverKey);
    onDelete();
  }, [isMonitored, stopMonitoring, serverKey, onDelete]);

  // Status info
  const statusInfo = useMemo(() => {
    if (isConnecting) return { text: 'Conectando...', color: 'text-yellow-500', bg: 'bg-yellow-500/20', icon: <HourglassEmptyIcon sx={{ fontSize: 14 }} /> };
    if (isActive) return { text: 'Ativo', color: 'text-primary', bg: 'bg-primary/20', icon: <CircleIcon sx={{ fontSize: 14 }} /> };
    if (isCurrentlyTesting) return { text: 'Testando...', color: 'text-blue-400', bg: 'bg-blue-400/20', icon: <SyncIcon sx={{ fontSize: 14 }} className="animate-spin" /> };
    if (!connectivityResult) return { text: 'Desconhecido', color: 'text-gray-400', bg: 'bg-gray-400/20', icon: <HelpOutlineIcon sx={{ fontSize: 14 }} /> };

    switch (connectivityResult.status) {
      case 'online': return { text: 'Online', color: 'text-primary', bg: 'bg-primary/20', icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> };
      case 'offline': return { text: 'Offline', color: 'text-red-500', bg: 'bg-red-500/20', icon: <CancelIcon sx={{ fontSize: 14 }} /> };
      case 'partial': return { text: 'Parcial', color: 'text-yellow-500', bg: 'bg-yellow-500/20', icon: <WarningAmberIcon sx={{ fontSize: 14 }} /> };
      default: return { text: 'Erro', color: 'text-red-500', bg: 'bg-red-500/20', icon: <ErrorOutlineIcon sx={{ fontSize: 14 }} /> };
    }
  }, [isActive, isConnecting, isCurrentlyTesting, connectivityResult]);

  const getLatencyColor = (latency) => {
    if (!latency) return '';
    if (latency < 50) return 'text-primary bg-primary/20';
    if (latency < 150) return 'text-yellow-500 bg-yellow-500/20';
    return 'text-red-500 bg-red-500/20';
  };

  const actionBtn = "p-2 rounded-lg transition-all duration-200 hover:scale-110";

  return (
    <Draggable draggableId={`server-${serverInfo.id}`} index={index} isDragDisabled={!isEditModeEnabled}>
      {(provided, snapshot) => (
        <div
          className={`
            relative w-[280px] min-w-[280px]
            bg-cream-100 dark:bg-dark-surface
            border border-gray-200 dark:border-gray-700
            rounded-xl p-4 cursor-pointer
            transition-all duration-200
            hover:shadow-lg hover:-translate-y-1 hover:border-primary/50
            ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary scale-105' : 'shadow-md'}
            ${isActive ? 'ring-2 ring-primary border-primary' : ''}
            ${isConnecting ? 'animate-pulse' : ''}
            ${isEditModeEnabled ? 'cursor-grab' : ''}
          `}
          onClick={handleConnect}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {/* Drag Handle */}
          {isEditModeEnabled && (
            <div className="absolute top-2 left-2 text-gray-400 text-lg font-bold select-none">⋮⋮</div>
          )}

          {/* Loading Overlay */}
          {(isConnecting || isCurrentlyTesting) && (
            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2 text-white">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">{isConnecting ? 'Conectando...' : 'Testando...'}</span>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded
                  ${serverInfo.protocol === 'ssh' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
                  {(serverInfo.protocol || 'rdp').toUpperCase()}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{serverInfo.name}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <LinkIcon sx={{ fontSize: 12 }} />
                <span className="font-mono">{serverInfo.ipAddress}</span>
                {serverInfo.port && <span>:{serverInfo.port}</span>}
              </div>
              {serverInfo.username && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                  <PersonOutlineIcon sx={{ fontSize: 12 }} />
                  <span>{serverInfo.username}</span>
                  {serverInfo.domain && <span className="opacity-60">@{serverInfo.domain}</span>}
                </div>
              )}
            </div>
            {/* Status */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
              {statusInfo.icon}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 pt-2 border-t border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            {isConnectivityEnabled && (
              <>
                <button onClick={handleToggleMonitoring}
                  className={`${actionBtn} ${isMonitored ? 'bg-purple-500/20 text-purple-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:text-purple-500'}`}
                  title={isMonitored ? 'Parar monitoramento' : 'Monitorar'}>
                  <MonitorHeartIcon sx={{ fontSize: 18 }} />
                </button>
                <button onClick={handleTestConnectivity} disabled={isCurrentlyTesting}
                  className={`${actionBtn} bg-gray-200 dark:bg-gray-700 text-gray-500 hover:text-blue-500 disabled:opacity-50`}
                  title="Testar conectividade">
                  <RefreshIcon sx={{ fontSize: 18 }} />
                </button>
              </>
            )}
            {onOpenInTab && (
              <button onClick={handleOpenInTab}
                className={`${actionBtn} bg-gray-200 dark:bg-gray-700 text-gray-500 hover:text-primary`}
                title="Abrir em nova aba">
                <OpenInNewIcon sx={{ fontSize: 18 }} />
              </button>
            )}
            {isEditModeEnabled && (
              <>
                <button onClick={(e) => { e.stopPropagation(); onEdit(serverInfo); }}
                  className={`${actionBtn} bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white ml-auto`}
                  title="Editar">
                  <EditIcon sx={{ fontSize: 18 }} />
                </button>
                <button onClick={handleDeleteClick}
                  className={`${actionBtn} bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white`}
                  title="Excluir">
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </button>
              </>
            )}
          </div>

          {/* Indicadores */}
          <div className="flex items-center gap-2 mt-2">
            {isMonitored && <span className="text-purple-500" title="Monitorando"><BarChartIcon sx={{ fontSize: 14 }} /></span>}
            {isActive && <span className="text-primary" title="Conexão ativa"><LinkIcon sx={{ fontSize: 14 }} /></span>}
            {connectivityResult?.lastCheck && <span className="text-gray-400" title="Última verificação"><AccessTimeIcon sx={{ fontSize: 14 }} /></span>}
            {connectivityResult?.latency && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getLatencyColor(connectivityResult.latency)}`}>
                {connectivityResult.latency}ms
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default React.memo(Server);