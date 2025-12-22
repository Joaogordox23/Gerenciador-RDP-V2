// src/views/VncWallView.js
// ✨ v4.8: Migrado para Tailwind CSS
// ✨ v5.1: Modo Snapshot para economia de memória
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import VncDisplay from '../components/VncDisplay';
import VncSnapshot from '../components/VncSnapshot';
import VncFullscreen from '../components/VncFullscreen';
import {
    SlideshowIcon,
    GridViewIcon,
    PlayArrowIcon,
    PauseIcon,
    NavigateBeforeIcon,
    NavigateNextIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CloseIcon,
    FullscreenIcon,
    FullscreenExitIcon,
} from '../components/MuiIcons';

const VncWallView = ({ vncGroups, activeConnections, setActiveConnections, searchTerm = '' }) => {
    const [localActiveConnections, setLocalActiveConnections] = useState([]);
    const connections = activeConnections || localActiveConnections;
    const setConnections = setActiveConnections || setLocalActiveConnections;

    const [carouselMode, setCarouselMode] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [carouselInterval, setCarouselInterval] = useState(5000);
    const timerRef = useRef(null);

    const [fullscreenConnection, setFullscreenConnection] = useState(null);
    const [gridColumns, setGridColumns] = useState(3);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('vnc-wall-sidebar-collapsed');
        return saved === 'true';
    });
    const [connectionErrors, setConnectionErrors] = useState({});
    const [reconnectAttempts, setReconnectAttempts] = useState({}); // ✅ v5.4: Contador de tentativas
    const reconnectTimeoutsRef = useRef({});
    const [isWallFullscreen, setIsWallFullscreen] = useState(false);
    const [sidebarHover, setSidebarHover] = useState(false);
    const pendingConnectionsRef = useRef(new Set()); // ✅ v5.0: Rastrear conexões sendo iniciadas

    const allConnections = useMemo(() => {
        const conns = vncGroups.flatMap(group =>
            group.connections.map(conn => ({
                ...conn,
                groupName: group.groupName
            }))
        );

        if (!searchTerm) return conns;
        const term = searchTerm.toLowerCase();
        return conns.filter(conn =>
            conn.name?.toLowerCase().includes(term) ||
            conn.ipAddress?.toLowerCase().includes(term) ||
            conn.groupName?.toLowerCase().includes(term)
        );
    }, [vncGroups, searchTerm]);

    // Filtrar conexões ativas pelo termo de busca
    const filteredConnections = useMemo(() => {
        if (!searchTerm) return connections;
        const term = searchTerm.toLowerCase();
        return connections.filter(conn =>
            conn.name?.toLowerCase().includes(term) ||
            conn.ipAddress?.toLowerCase().includes(term) ||
            conn.groupName?.toLowerCase().includes(term)
        );
    }, [connections, searchTerm]);

    // Cálculo de linhas baseado no número de colunas (máximo 4 linhas)
    // 1 col = 1 linha, 2 cols = 2 linhas, 3 cols = 3 linhas, 4+ cols = 4 linhas
    const gridRows = Math.min(gridColumns, 4);
    const itemsPerPage = gridColumns * gridRows;
    const totalPages = Math.ceil(filteredConnections.length / itemsPerPage);

    useEffect(() => {
        if (carouselMode && isPlaying && totalPages > 1) {
            timerRef.current = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % totalPages);
            }, carouselInterval);
            return () => { if (timerRef.current) clearInterval(timerRef.current); };
        }
    }, [carouselMode, isPlaying, carouselInterval, totalPages]);

    const handleStartMonitoring = async (connection) => {
        // ✅ v5.0: Verifica se já está sendo monitorada OU já está sendo iniciada
        if (pendingConnectionsRef.current.has(connection.id)) {
            console.log(`⚠️ [${connection.name}] Já está sendo iniciada, ignorando`);
            return;
        }

        // Marca como pendente ANTES de iniciar
        pendingConnectionsRef.current.add(connection.id);

        try {
            const result = await window.api.vnc.startProxy(connection);
            if (result.success) {
                const proxyUrl = `ws://localhost:${result.port}`;
                setConnections(prev => {
                    // Verifica duplicata no momento da atualização
                    if (prev.find(c => c.id === connection.id)) {
                        console.log(`⚠️ [${connection.name}] Já existe nas conexões ativas`);
                        return prev;
                    }
                    return [...prev, {
                        ...connection, proxyUrl,
                        password: result.decryptedPassword || connection.password
                    }];
                });
            }
        } catch (error) {
            console.error(`❌ Erro ao conectar ${connection.name}:`, error);
        } finally {
            // Remove do pendente após conclusão (sucesso ou erro)
            pendingConnectionsRef.current.delete(connection.id);
        }
    };

    const handleStopMonitoring = async (connectionId) => {
        try {
            if (reconnectTimeoutsRef.current[connectionId]) {
                clearTimeout(reconnectTimeoutsRef.current[connectionId]);
                delete reconnectTimeoutsRef.current[connectionId];
            }
            await window.api.vnc.stopProxy(connectionId);
            setConnections(prev => prev.filter(c => c.id !== connectionId));
            setConnectionErrors(prev => { const newState = { ...prev }; delete newState[connectionId]; return newState; });
        } catch (error) {
            console.error('Erro ao desconectar:', error);
        }
    };

    // ✅ v5.4: Reconexão persistente para suportar reinicialização de servidores
    const MAX_RECONNECT_ATTEMPTS = 60; // ~10 minutos de tentativas
    const BASE_RECONNECT_DELAY = 5000; // 5 segundos inicial
    const MAX_RECONNECT_DELAY = 30000; // Máximo 30 segundos entre tentativas

    const handleConnectionError = async (connectionId, errorMessage) => {
        console.warn(`⚠️ Erro na conexão ${connectionId}:`, errorMessage);
        setConnectionErrors(prev => ({ ...prev, [connectionId]: true }));

        const connection = connections.find(c => c.id === connectionId);
        if (!connection) return;

        // Limpa timeout anterior se existir
        if (reconnectTimeoutsRef.current[connectionId]) {
            clearTimeout(reconnectTimeoutsRef.current[connectionId]);
        }

        // Obtém número de tentativas atual
        const currentAttempts = reconnectAttempts[connectionId] || 0;

        // Se excedeu limite, para de tentar
        if (currentAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error(`❌ [${connection.name}] Desistindo após ${MAX_RECONNECT_ATTEMPTS} tentativas`);
            return;
        }

        // Calcula delay com backoff exponencial (5s, 7.5s, 11.25s... até 30s max)
        const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(1.5, Math.min(currentAttempts, 5)), MAX_RECONNECT_DELAY);

        console.log(`🔄 [${connection.name}] Tentativa ${currentAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} em ${delay / 1000}s...`);

        reconnectTimeoutsRef.current[connectionId] = setTimeout(async () => {
            try {
                // ✅ Primeiro verifica se o servidor está disponível via TCP
                const isAvailable = await window.api.vnc.checkAvailability(connection);

                if (!isAvailable) {
                    console.log(`⏳ [${connection.name}] Servidor ainda offline, aguardando...`);
                    setReconnectAttempts(prev => ({ ...prev, [connectionId]: (prev[connectionId] || 0) + 1 }));
                    // Agenda próxima tentativa
                    handleConnectionError(connectionId, 'Servidor offline');
                    return;
                }

                console.log(`✅ [${connection.name}] Servidor disponível! Reconectando...`);

                // Para o proxy antigo
                await window.api.vnc.stopProxy(connectionId);

                // Pequeno delay para garantir limpeza
                await new Promise(resolve => setTimeout(resolve, 500));

                // Inicia novo proxy
                const result = await window.api.vnc.startProxy(connection);

                if (result.success) {
                    const proxyUrl = `ws://localhost:${result.port}`;
                    setConnections(prev => prev.map(c =>
                        c.id === connectionId ? {
                            ...c,
                            proxyUrl,
                            password: result.decryptedPassword || c.password,
                            reconnectKey: Date.now()
                        } : c
                    ));
                    // Limpa erros e contador de tentativas
                    setConnectionErrors(prev => {
                        const newState = { ...prev };
                        delete newState[connectionId];
                        return newState;
                    });
                    setReconnectAttempts(prev => {
                        const newState = { ...prev };
                        delete newState[connectionId];
                        return newState;
                    });
                    console.log(`🎉 [${connection.name}] Reconexão bem-sucedida!`);
                } else {
                    throw new Error(result.error || 'Falha ao iniciar proxy');
                }
            } catch (err) {
                console.error(`❌ [${connection.name}] Erro na reconexão:`, err.message);
                setReconnectAttempts(prev => ({ ...prev, [connectionId]: (prev[connectionId] || 0) + 1 }));
                // Agenda próxima tentativa
                handleConnectionError(connectionId, err.message);
            }
        }, delay);
    };

    const toggleCarouselMode = () => { setCarouselMode(prev => !prev); setIsPlaying(false); };
    const handlePlayPause = () => setIsPlaying(prev => !prev);
    const handleNext = () => setCurrentIndex(prev => (prev + 1) % (totalPages || 1));
    const handlePrevious = () => setCurrentIndex(prev => (prev - 1 + (totalPages || 1)) % (totalPages || 1));
    const handleDoubleClick = (connection) => setFullscreenConnection(connection);
    const handleStopAll = async () => { for (const conn of connections) await handleStopMonitoring(conn.id); };

    // ✅ v5.0: Seleção em lotes para evitar sobrecarga
    const handleSelectAll = async () => {
        const connectionsToAdd = allConnections.filter(conn => !connections.find(c => c.id === conn.id));
        if (connectionsToAdd.length === 0) return;

        console.log(`🔌 Iniciando conexão de ${connectionsToAdd.length} servidores VNC em lotes...`);

        // Processa em lotes de 5 para não sobrecarregar
        const batchSize = 5;
        for (let i = 0; i < connectionsToAdd.length; i += batchSize) {
            const batch = connectionsToAdd.slice(i, i + batchSize);

            // Inicia todas as conexões do lote em paralelo
            await Promise.allSettled(batch.map(conn => handleStartMonitoring(conn)));

            // Pequeno delay entre lotes para dar tempo ao React processar
            if (i + batchSize < connectionsToAdd.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        console.log(`✅ Conexão de ${connectionsToAdd.length} servidores VNC concluída`);
    };
    const allSelected = allConnections.length > 0 && connections.length === allConnections.length;

    const toggleWallFullscreen = useCallback(() => {
        if (!isWallFullscreen) {
            const elem = document.documentElement;
            if (elem.requestFullscreen) elem.requestFullscreen();
            setIsWallFullscreen(true);
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            setIsWallFullscreen(false);
        }
    }, [isWallFullscreen]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
            setIsWallFullscreen(isFullscreen);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && fullscreenConnection) setFullscreenConnection(null);
            if ((e.key === 'F11' || (e.key === 'f' && e.ctrlKey)) && !fullscreenConnection) { e.preventDefault(); toggleWallFullscreen(); }
            if (carouselMode && connections.length > 0) {
                if (e.key === 'ArrowRight') handleNext();
                else if (e.key === 'ArrowLeft') handlePrevious();
                else if (e.key === ' ') { e.preventDefault(); handlePlayPause(); }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fullscreenConnection, carouselMode, connections.length, isWallFullscreen, toggleWallFullscreen]);

    // Classes base para botões
    const btnBase = "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer";
    const btnPrimary = `${btnBase} bg-gradient-to-br from-primary to-primary-hover text-white shadow-md shadow-primary/30 hover:-translate-y-0.5`;
    const btnSecondary = `${btnBase} bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary`;
    const btnDanger = `${btnBase} bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20`;

    return (
        <div className={`flex gap-4 p-4 transition-all duration-300
            ${isWallFullscreen ? 'fixed inset-0 z-[9999] bg-black p-0 gap-0' : 'h-[calc(100vh-140px)]'}`}
        >
            {/* Trigger para sidebar em fullscreen */}
            {isWallFullscreen && (
                <div className="fixed left-0 top-0 bottom-0 w-5 z-[9999]" onMouseEnter={() => setSidebarHover(true)} />
            )}

            {/* Sidebar */}
            <div
                className={`
                    ${isSidebarCollapsed ? 'w-14 min-w-14 max-w-14 px-2' : 'w-[240px] min-w-[240px] max-w-[240px] p-4'}
                    bg-cream-100 dark:bg-dark-surface border border-gray-200 dark:border-gray-700
                    rounded-xl flex flex-col shadow-lg transition-all duration-300 overflow-hidden
                    ${isWallFullscreen ? `fixed left-0 top-0 bottom-0 z-[10000] rounded-none ${sidebarHover ? 'translate-x-0' : '-translate-x-full'}` : ''}
                `}
                onMouseEnter={() => isWallFullscreen && setSidebarHover(true)}
                onMouseLeave={() => isWallFullscreen && setSidebarHover(false)}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-primary">
                    {!isSidebarCollapsed && <span className="text-sm font-bold text-slate-900 dark:text-white">Servidores VNC</span>}
                    <button
                        className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 
                            bg-cream-50 dark:bg-dark-bg text-gray-500 flex items-center justify-center shrink-0
                            transition-all hover:bg-primary hover:text-white hover:border-primary hover:scale-110"
                        onClick={() => {
                            const newState = !isSidebarCollapsed;
                            setIsSidebarCollapsed(newState);
                            localStorage.setItem('vnc-wall-sidebar-collapsed', newState.toString());
                        }}
                    >
                        {isSidebarCollapsed ? <ChevronRightIcon sx={{ fontSize: 16 }} /> : <ChevronLeftIcon sx={{ fontSize: 16 }} />}
                    </button>
                </div>

                {/* Lista de Conexões */}
                {!isSidebarCollapsed && (
                    <div className="flex-1 overflow-y-auto flex flex-col gap-1 mb-3 scrollbar-thin">
                        {allConnections.map(conn => {
                            const isActive = connections.find(c => c.id === conn.id);
                            return (
                                <label key={conn.id} className={`flex items-center gap-2 px-2.5 py-2
                                    bg-cream-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700
                                    rounded-lg cursor-pointer transition-all text-xs
                                    ${isActive ? 'border-primary bg-primary/10' : 'hover:border-primary/50'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={!!isActive}
                                        onChange={() => isActive ? handleStopMonitoring(conn.id) : handleStartMonitoring(conn)}
                                        className="w-4 h-4 rounded accent-primary"
                                    />
                                    <span className="flex-1 truncate text-slate-900 dark:text-white">{conn.name}</span>
                                    <span>{isActive ? '🟢' : '⚫'}</span>
                                </label>
                            );
                        })}
                    </div>
                )}

                {/* Controles */}
                {!isSidebarCollapsed && (
                    <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {/* Selecionar Todos */}
                        <button onClick={allSelected ? handleStopAll : handleSelectAll} disabled={allConnections.length === 0}
                            className={`w-full ${allSelected ? btnDanger : btnSecondary} justify-center`}>
                            {allSelected ? '✖ Desmarcar Todos' : '✔ Selecionar Todos'}
                        </button>

                        {/* Toggle Carrossel */}
                        <button onClick={toggleCarouselMode} className={`w-full justify-center ${carouselMode ? btnPrimary : btnSecondary}`}>
                            {carouselMode ? <><GridViewIcon sx={{ fontSize: 16 }} /> Modo Normal</> : <><SlideshowIcon sx={{ fontSize: 16 }} /> Carrossel</>}
                        </button>

                        {/* Controles Carrossel */}
                        {carouselMode && connections.length > 0 && (
                            <div className="flex items-center justify-center gap-2">
                                <button onClick={handlePrevious} className={btnSecondary}><NavigateBeforeIcon sx={{ fontSize: 18 }} /></button>
                                <button onClick={handlePlayPause} className={`${btnPrimary} px-4`}>
                                    {isPlaying ? <PauseIcon sx={{ fontSize: 16 }} /> : <PlayArrowIcon sx={{ fontSize: 16 }} />}
                                </button>
                                <button onClick={handleNext} className={btnSecondary}><NavigateNextIcon sx={{ fontSize: 18 }} /></button>
                            </div>
                        )}

                        {/* Tempo do Carrossel */}
                        {carouselMode && (
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Intervalo: {carouselInterval / 1000}s</label>
                                <select
                                    value={carouselInterval}
                                    onChange={(e) => setCarouselInterval(Number(e.target.value))}
                                    className="w-full px-3 py-2 text-sm bg-cream-50 dark:bg-dark-bg 
                                        border border-gray-200 dark:border-gray-700 rounded-lg
                                        text-slate-900 dark:text-white cursor-pointer
                                        focus:outline-none focus:border-primary"
                                >
                                    <option value={3000}>3 segundos</option>
                                    <option value={5000}>5 segundos</option>
                                    <option value={10000}>10 segundos</option>
                                    <option value={15000}>15 segundos</option>
                                    <option value={30000}>30 segundos</option>
                                </select>
                            </div>
                        )}

                        {/* Colunas */}
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500">Colunas: {gridColumns}</label>
                            <input type="range" min="1" max="6" value={gridColumns} onChange={(e) => setGridColumns(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary" />
                        </div>

                        {/* Parar Todos e Fullscreen */}
                        <button onClick={handleStopAll} disabled={connections.length === 0} className={`w-full justify-center ${btnDanger}`}>
                            Parar Todos ({connections.length})
                        </button>
                        <button onClick={toggleWallFullscreen} className={`w-full justify-center ${isWallFullscreen ? btnPrimary : btnSecondary}`}>
                            {isWallFullscreen ? <><FullscreenExitIcon sx={{ fontSize: 16 }} /> Sair Fullscreen</> : <><FullscreenIcon sx={{ fontSize: 16 }} /> Modo Painel</>}
                        </button>
                    </div>
                )}
            </div>

            {/* Área Principal */}
            <div className={`flex-1 flex flex-col min-h-0 bg-cream-50 dark:bg-dark-bg rounded-xl p-4 overflow-hidden
                ${isWallFullscreen ? 'p-2 rounded-none bg-black' : ''}`}>
                {/* Header */}
                {filteredConnections.length > 0 && !isWallFullscreen && (
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-sm">
                            <span className="text-2xl font-bold text-primary">{filteredConnections.length}</span>
                            <span className="text-gray-500 ml-1">de {connections.length} ativos</span>
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            {carouselMode ? <SlideshowIcon sx={{ fontSize: 14 }} /> : <GridViewIcon sx={{ fontSize: 14 }} />}
                            {carouselMode ? 'Carrossel (streaming)' : 'Grid (qualidade reduzida)'} • {gridColumns}x{gridRows}
                        </span>
                        <button onClick={toggleWallFullscreen} className={btnSecondary}>
                            <FullscreenIcon sx={{ fontSize: 18 }} />
                        </button>
                    </div>
                )}

                {/* Grid/Carrossel */}
                {filteredConnections.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-2">
                        {connections.length === 0 ? (
                            <>
                                <span>{`Selecione servidores para ${carouselMode ? 'exibir no carrossel' : 'monitorar'}`}</span>
                                {searchTerm && allConnections.length > 0 && (
                                    <span className="text-sm text-primary">
                                        {allConnections.length} conexões disponíveis correspondem à busca "{searchTerm}"
                                    </span>
                                )}
                            </>
                        ) : (
                            <span>Nenhuma conexão ativa corresponde à busca "{searchTerm}"</span>
                        )}
                    </div>
                ) : (
                    <div className={`flex-1 ${carouselMode ? 'overflow-hidden' : 'overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 hover:scrollbar-thumb-primary'}`}>
                        <div
                            className={`grid gap-2 ${carouselMode ? 'h-full' : ''}`}
                            style={{
                                gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                                ...(carouselMode
                                    ? { gridTemplateRows: `repeat(${gridRows}, 1fr)` }
                                    : { gridAutoRows: 'minmax(180px, 1fr)' }
                                )
                            }}
                        >
                            {/* Grid/Carrossel: VncDisplay com qualidade ajustável */}
                            {(carouselMode ? filteredConnections.slice(currentIndex * itemsPerPage, (currentIndex + 1) * itemsPerPage) : filteredConnections)
                                .map(conn => (
                                    <div key={conn.id}
                                        className="relative bg-black rounded-lg overflow-hidden group"
                                        onDoubleClick={() => handleDoubleClick(conn)}
                                        title={`${conn.name}\nDuplo clique para fullscreen`}
                                    >
                                        <button
                                            className="absolute top-2 right-2 z-10 w-6 h-6 rounded bg-black/50 text-white 
                                                opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center
                                                hover:bg-red-500"
                                            onClick={(e) => { e.stopPropagation(); handleStopMonitoring(conn.id); }}
                                        >
                                            <CloseIcon sx={{ fontSize: 14 }} />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent 
                                            px-2 py-1 flex items-center gap-2 z-10">
                                            <span className={`w-2 h-2 rounded-full ${connectionErrors[conn.id] ? 'bg-red-500' : 'bg-primary'} animate-pulse`}></span>
                                            <span className="text-white text-xs truncate">{conn.name}</span>
                                            {connectionErrors[conn.id] && <span className="text-yellow-400">🔄</span>}
                                        </div>
                                        <VncDisplay
                                            key={conn.reconnectKey || conn.id}
                                            connectionInfo={conn}
                                            onDisconnect={() => handleStopMonitoring(conn.id)}
                                            onError={(err) => handleConnectionError(conn.id, err)}
                                            viewOnly={true}
                                            quality={carouselMode ? 6 : 2}
                                            compression={carouselMode ? 2 : 8}
                                            frameInterval={carouselMode ? 0 : 5000}
                                        />
                                    </div>
                                ))}
                        </div>
                        {/* Indicador de páginas (carrossel) */}
                        {carouselMode && totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-3">
                                {Array.from({ length: totalPages }).map((_, idx) => (
                                    <button key={idx} onClick={() => setCurrentIndex(idx)}
                                        className={`w-3 h-3 rounded-full transition-all ${idx === currentIndex ? 'bg-primary scale-125' : 'bg-gray-400'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Fullscreen */}
            {fullscreenConnection && (
                <VncFullscreen connection={fullscreenConnection} onClose={() => setFullscreenConnection(null)} />
            )}
        </div>
    );
};

export default VncWallView;
