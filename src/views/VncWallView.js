import React, { useState, useMemo, useEffect, useRef } from 'react';
import VncDisplay from '../components/VncDisplay';
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
import './VncWallView.css';



const VncWallView = ({ vncGroups, activeConnections, setActiveConnections, searchTerm = '' }) => {
    // Estado local para conexões ativas se não for passado via props (fallback)
    const [localActiveConnections, setLocalActiveConnections] = useState([]);
    const connections = activeConnections || localActiveConnections;
    const setConnections = setActiveConnections || setLocalActiveConnections;

    // ✨ v4.0: Estados para modo carrossel
    const [carouselMode, setCarouselMode] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [carouselInterval, setCarouselInterval] = useState(5000); // 5 segundos
    const timerRef = useRef(null);

    // ✨ v4.1: Fullscreen interativo
    const [fullscreenConnection, setFullscreenConnection] = useState(null);

    // ✨ v4.1: Controle de colunas do grid
    const [gridColumns, setGridColumns] = useState(3); // 1-6 colunas
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // ✨ v4.5: Estado para rastrear erros e auto-reconect
    const [connectionErrors, setConnectionErrors] = useState({}); // { [id]: true/false }
    const reconnectTimeoutsRef = useRef({}); // Para limpar timeouts

    // ✨ v4.7: Modo Fullscreen para painel de monitoramento
    const [isWallFullscreen, setIsWallFullscreen] = useState(false);
    const [sidebarHover, setSidebarHover] = useState(false);
    // Flatten all connections from all groups
    const allConnections = useMemo(() => {
        const connections = vncGroups.flatMap(group =>
            group.connections.map(conn => ({
                ...conn,
                groupName: group.groupName
            }))
        );

        // Filtrar por searchTerm
        if (!searchTerm) return connections;

        const term = searchTerm.toLowerCase();
        return connections.filter(conn =>
            conn.name?.toLowerCase().includes(term) ||
            conn.ipAddress?.toLowerCase().includes(term) ||
            conn.groupName?.toLowerCase().includes(term)
        );
    }, [vncGroups, searchTerm]);

    // ✨ v4.3: Cálculo do total de páginas para o carrossel
    // Para 1 coluna: 1 item por página (carrossel single)
    // Para 2+ colunas: gridColumns * 2 (mantém 2 linhas)
    const itemsPerPage = gridColumns === 1 ? 1 : gridColumns * 2;
    const totalPages = Math.ceil(connections.length / itemsPerPage);

    // ✨ v4.0: Lógica do carrossel automático
    useEffect(() => {
        if (carouselMode && isPlaying && totalPages > 1) {
            timerRef.current = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % totalPages);
            }, carouselInterval);

            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            };
        }
    }, [carouselMode, isPlaying, carouselInterval, totalPages]);

    const handleStartMonitoring = async (connection) => {
        // Evita duplicatas
        if (connections.find(c => c.id === connection.id)) return;

        try {
            // Solicita ao backend para iniciar o proxy
            const result = await window.api.vnc.startProxy(connection);

            if (result.success) {
                const proxyUrl = `ws://localhost:${result.port}`;
                setConnections(prev => [...prev, {
                    ...connection,
                    proxyUrl,
                    password: result.decryptedPassword || connection.password
                }]);
            } else {
                console.error('Erro ao iniciar proxy:', result.error);
                // Opcional: Mostrar toast de erro
            }
        } catch (error) {
            console.error('Erro ao conectar:', error);
        }
    };

    const handleStopMonitoring = async (connectionId) => {
        try {
            // Limpa timeout de reconexão se existir
            if (reconnectTimeoutsRef.current[connectionId]) {
                clearTimeout(reconnectTimeoutsRef.current[connectionId]);
                delete reconnectTimeoutsRef.current[connectionId];
            }

            // Para o proxy no backend
            await window.api.vnc.stopProxy(connectionId);

            // Remove da lista local e limpa erro
            setConnections(prev => prev.filter(c => c.id !== connectionId));
            setConnectionErrors(prev => {
                const newState = { ...prev };
                delete newState[connectionId];
                return newState;
            });
        } catch (error) {
            console.error('Erro ao desconectar:', error);
        }
    };

    // ✨ v4.5: Handler de erro de conexão com auto-reconect
    const handleConnectionError = async (connectionId, errorMessage) => {
        console.warn(`⚠️ Erro na conexão ${connectionId}:`, errorMessage);

        // Marca como erro
        setConnectionErrors(prev => ({ ...prev, [connectionId]: true }));

        // Encontra a conexão original para reconectar
        const connection = connections.find(c => c.id === connectionId);
        if (!connection) return;

        // Limpa timeout anterior se existir
        if (reconnectTimeoutsRef.current[connectionId]) {
            clearTimeout(reconnectTimeoutsRef.current[connectionId]);
        }

        // Tenta reconectar após 5 segundos
        reconnectTimeoutsRef.current[connectionId] = setTimeout(async () => {
            console.log(`🔄 Tentando reconectar: ${connection.name}`);

            try {
                // Para o proxy antigo primeiro
                await window.api.vnc.stopProxy(connectionId);

                // Inicia novo proxy
                const result = await window.api.vnc.startProxy(connection);

                if (result.success) {
                    const proxyUrl = `ws://localhost:${result.port}`;

                    // Atualiza a conexão com novo proxyUrl
                    setConnections(prev => prev.map(c =>
                        c.id === connectionId
                            ? { ...c, proxyUrl, password: result.decryptedPassword || c.password, reconnectKey: Date.now() }
                            : c
                    ));

                    // Limpa erro
                    setConnectionErrors(prev => {
                        const newState = { ...prev };
                        delete newState[connectionId];
                        return newState;
                    });

                    console.log(`✅ Reconectado: ${connection.name}`);
                }
            } catch (err) {
                console.error(`❌ Falha ao reconectar ${connection.name}:`, err);
                // Tenta novamente em 10 segundos
                reconnectTimeoutsRef.current[connectionId] = setTimeout(() => {
                    handleConnectionError(connectionId, 'Retry');
                }, 10000);
            }
        }, 5000);
    };

    // ✨ v4.0: Controles do carrossel
    const toggleCarouselMode = () => {
        setCarouselMode(prev => !prev);
        setIsPlaying(false);
    };

    const handlePlayPause = () => {
        setIsPlaying(prev => !prev);
    };

    const handleNext = () => {
        setCurrentIndex(prev => (prev + 1) % (totalPages || 1));
    };

    const handlePrevious = () => {
        setCurrentIndex(prev => (prev - 1 + (totalPages || 1)) % (totalPages || 1));
    };

    // ✨ v4.1: Abrir fullscreen ao duplo clique
    const handleDoubleClick = (connection) => {
        setFullscreenConnection(connection);
    };

    const handleStopAll = async () => {
        for (const conn of connections) {
            await handleStopMonitoring(conn.id);
        }
    };

    // ✨ v4.3: Selecionar/Desmarcar todos
    const handleSelectAll = async () => {
        for (const conn of allConnections) {
            if (!connections.find(c => c.id === conn.id)) {
                await handleStartMonitoring(conn);
            }
        }
    };

    const allSelected = allConnections.length > 0 && connections.length === allConnections.length;

    // ✨ v4.7: Toggle fullscreen para painel de monitoramento
    const toggleWallFullscreen = () => {
        if (!isWallFullscreen) {
            // Entra em fullscreen
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
            setIsWallFullscreen(true);
        } else {
            // Sai do fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            setIsWallFullscreen(false);
        }
    };

    // Listener para detectar saída do fullscreen via ESC ou outros meios
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
            setIsWallFullscreen(isFullscreen);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        };
    }, []);

    // ✨ v4.5: Atalhos de teclado
    useEffect(() => {
        const handleKeyDown = (e) => {
            // ESC fecha fullscreen
            if (e.key === 'Escape' && fullscreenConnection) {
                setFullscreenConnection(null);
            }
            // F11 ou F para toggle Wall Fullscreen
            if ((e.key === 'F11' || (e.key === 'f' && e.ctrlKey)) && !fullscreenConnection) {
                e.preventDefault();
                toggleWallFullscreen();
            }
            // Setas navegam carrossel
            if (carouselMode && connections.length > 0) {
                if (e.key === 'ArrowRight') {
                    handleNext();
                } else if (e.key === 'ArrowLeft') {
                    handlePrevious();
                } else if (e.key === ' ') {
                    e.preventDefault();
                    handlePlayPause();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fullscreenConnection, carouselMode, connections.length, isWallFullscreen]);

    return (
        <div className={`vnc-wall-container ${isWallFullscreen ? 'wall-fullscreen' : ''}`}>
            {/* ✨ v4.7: Trigger area para mostrar sidebar em fullscreen */}
            {isWallFullscreen && (
                <div
                    className="fullscreen-sidebar-trigger"
                    onMouseEnter={() => setSidebarHover(true)}
                />
            )}

            {/* Sidebar de Seleção */}
            <div
                className={`vnc-wall-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isWallFullscreen && sidebarHover ? 'hover-visible' : ''}`}
                onMouseEnter={() => isWallFullscreen && setSidebarHover(true)}
                onMouseLeave={() => isWallFullscreen && setSidebarHover(false)}
            >
                <h3>
                    <span>Servidores VNC</span>
                    <button
                        className="sidebar-toggle-btn"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        title={isSidebarCollapsed ? 'Expandir' : 'Recolher'}
                    >
                        {isSidebarCollapsed ? <ChevronRightIcon sx={{ fontSize: 16 }} /> : <ChevronLeftIcon sx={{ fontSize: 16 }} />}
                    </button>
                </h3>
                <div className="vnc-list">
                    {allConnections.map(conn => {
                        const isActive = connections.find(c => c.id === conn.id);
                        return (
                            <div
                                key={conn.id}
                                className={`vnc-wall-sidebar-item ${isActive ? 'active' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={!!isActive}
                                    onChange={() => {
                                        if (isActive) {
                                            handleStopMonitoring(conn.id);
                                        } else {
                                            handleStartMonitoring(conn);
                                        }
                                    }}
                                    className="vnc-checkbox"
                                />
                                <span className="vnc-server-name">{conn.name}</span>
                                <span className="vnc-server-status">
                                    {isActive ? '🟢' : '⚫'}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* ✨ v4.3: Botão Selecionar/Desmarcar Todos */}
                <div className="wall-selection-controls">
                    <button
                        onClick={allSelected ? handleStopAll : handleSelectAll}
                        className={`btn-select-all ${allSelected ? 'active' : ''}`}
                        disabled={allConnections.length === 0}
                    >
                        {allSelected ? '✖ Desmarcar Todos' : '✔ Selecionar Todos'}
                    </button>
                </div>

                {/* ✨ v4.0: Controles do Carrossel */}
                <div className="wall-controls">
                    <button
                        onClick={toggleCarouselMode}
                        className={`btn-carousel-toggle ${carouselMode ? 'active' : ''}`}
                    >
                        {carouselMode ? (
                            <>
                                <GridViewIcon sx={{ fontSize: 18, marginRight: 1 }} />
                                Modo Normal
                            </>
                        ) : (
                            <>
                                <SlideshowIcon sx={{ fontSize: 18, marginRight: 1 }} />
                                Modo Carrossel
                            </>
                        )}
                    </button>

                    {carouselMode && allConnections.length > 0 && (
                        <>
                            <div className="carousel-controls">
                                <button onClick={handlePrevious} className="btn-nav" title="Anterior">
                                    <NavigateBeforeIcon sx={{ fontSize: 20 }} />
                                </button>
                                <button onClick={handlePlayPause} className="btn-play">
                                    {isPlaying ? (
                                        <>
                                            <PauseIcon sx={{ fontSize: 18, marginRight: 0.5 }} />
                                            Pausar
                                        </>
                                    ) : (
                                        <>
                                            <PlayArrowIcon sx={{ fontSize: 18, marginRight: 0.5 }} />
                                            Play
                                        </>
                                    )}
                                </button>
                                <button onClick={handleNext} className="btn-nav" title="Próximo">
                                    <NavigateNextIcon sx={{ fontSize: 20 }} />
                                </button>
                            </div>

                            <div className="carousel-info">
                                <span>{currentIndex + 1} / {allConnections.length}</span>
                                <input
                                    type="range"
                                    min="2000"
                                    max="30000"
                                    step="1000"
                                    value={carouselInterval}
                                    onChange={(e) => setCarouselInterval(Number(e.target.value))}
                                    title="Intervalo de transição"
                                />
                                <span>{(carouselInterval / 1000).toFixed(0)}s</span>
                            </div>
                        </>
                    )}

                    {/* ✨ v4.3: Controle de Colunas do Grid - Funciona em ambos os modos */}
                    <div className="columns-control">
                        <label>Colunas do Grid</label>
                        <input
                            type="range"
                            min="1"
                            max="6"
                            value={gridColumns}
                            onChange={(e) => setGridColumns(Number(e.target.value))}
                            className="columns-slider"
                            title={`${gridColumns} coluna${gridColumns > 1 ? 's' : ''}`}
                        />
                        <div className="columns-value">{gridColumns} {gridColumns === 1 ? 'coluna' : 'colunas'}</div>
                    </div>

                    <button
                        onClick={handleStopAll}
                        className="btn-stop-all"
                        disabled={connections.length === 0}
                    >
                        Parar Todos ({connections.length})
                    </button>

                    {/* ✨ v4.7: Botão Fullscreen para Painel de Monitoramento */}
                    <button
                        onClick={toggleWallFullscreen}
                        className={`btn-wall-fullscreen ${isWallFullscreen ? 'active' : ''}`}
                        title={isWallFullscreen ? 'Sair do Fullscreen (F11)' : 'Modo Fullscreen (F11)'}
                    >
                        {isWallFullscreen ? (
                            <>
                                <FullscreenExitIcon sx={{ fontSize: 18, marginRight: 1 }} />
                                Sair Fullscreen
                            </>
                        ) : (
                            <>
                                <FullscreenIcon sx={{ fontSize: 18, marginRight: 1 }} />
                                Modo Painel
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Grid de Visualização */}
            <div className="vnc-wall-main">
                {/* ✨ v4.5: Header com contador */}
                {connections.length > 0 && (
                    <div className="vnc-wall-main-header">
                        <span className="wall-active-count">
                            <span className="count-number">{connections.length}</span>
                            <span className="count-label">de {allConnections.length} ativos</span>
                        </span>
                        <span className="wall-mode-indicator">
                            {carouselMode ? '🎠 Carrossel' : '📺 Grid'} • {gridColumns} col
                        </span>
                        {/* ✨ v4.7: Botão Fullscreen no header para fácil acesso */}
                        <button
                            onClick={toggleWallFullscreen}
                            className={`btn-header-fullscreen ${isWallFullscreen ? 'active' : ''}`}
                            title={isWallFullscreen ? 'Sair do Fullscreen (F11)' : 'Modo Painel Fullscreen (F11)'}
                        >
                            {isWallFullscreen ? (
                                <FullscreenExitIcon sx={{ fontSize: 20 }} />
                            ) : (
                                <FullscreenIcon sx={{ fontSize: 20 }} />
                            )}
                        </button>
                    </div>
                )}
                {/* ✨ v4.0: Renderização condicional - Carrossel vs Grid */}
                {carouselMode ? (
                    connections.length === 0 ? (
                        <div className="wall-empty-state">
                            <p>Selecione servidores para exibir no carrossel</p>
                        </div>
                    ) : (
                        /* ✨ v4.3: Carrossel com Grid - Mostra grid de itens com rotação automática */
                        <div className="vnc-carousel-grid">
                            <div className="vnc-wall-grid" style={{
                                gridTemplateColumns: `repeat(${gridColumns}, 1fr)`
                            }}>
                                {connections
                                    .slice(
                                        currentIndex * itemsPerPage,
                                        (currentIndex + 1) * itemsPerPage
                                    )
                                    .map(conn => (
                                        <div
                                            key={conn.id}
                                            className="vnc-wall-item"
                                            onDoubleClick={() => handleDoubleClick(conn)}
                                            title={`${conn.name}\n${conn.ipAddress}:${conn.port}\nGrupo: ${conn.groupName}\nDuplo clique para fullscreen`}
                                        >
                                            {/* Botão Fechar Individual */}
                                            <button
                                                className="vnc-wall-item-close"
                                                onClick={(e) => { e.stopPropagation(); handleStopMonitoring(conn.id); }}
                                                title="Fechar conexão"
                                            >
                                                <CloseIcon sx={{ fontSize: 16 }} />
                                            </button>
                                            <div className="vnc-wall-item-label">
                                                <span className={`vnc-wall-item-status ${connectionErrors[conn.id] ? 'error' : ''}`}></span>
                                                <span className="vnc-wall-item-name">
                                                    {conn.name}
                                                    {connectionErrors[conn.id] && <span className="reconnecting-badge"> 🔄</span>}
                                                </span>
                                            </div>
                                            <VncDisplay
                                                key={conn.reconnectKey || conn.id}
                                                connectionInfo={conn}
                                                onDisconnect={() => handleStopMonitoring(conn.id)}
                                                onError={(err) => handleConnectionError(conn.id, err)}
                                                viewOnly={true}
                                            />
                                        </div>
                                    ))}
                            </div>
                            {/* Indicador de página */}
                            <div className="carousel-page-indicator">
                                {Array.from({ length: totalPages }).map((_, idx) => (
                                    <span
                                        key={idx}
                                        className={`page-dot ${idx === currentIndex ? 'active' : ''}`}
                                        onClick={() => setCurrentIndex(idx)}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                ) : (
                    // Modo Normal: Grid de múltiplos servidores
                    connections.length === 0 ? (
                        <div className="wall-empty-state">
                            <p>Selecione servidores na lista para monitorar</p>
                        </div>
                    ) : (
                        <div className="vnc-wall-grid" style={{
                            gridTemplateColumns: `repeat(${gridColumns}, 1fr)`
                        }}>
                            {connections.map(conn => (
                                <div
                                    key={conn.id}
                                    className="vnc-wall-item"
                                    onDoubleClick={() => handleDoubleClick(conn)}
                                    title={`${conn.name}\n${conn.ipAddress}:${conn.port}\nGrupo: ${conn.groupName}\nDuplo clique para fullscreen`}
                                >
                                    {/* Botão Fechar Individual */}
                                    <button
                                        className="vnc-wall-item-close"
                                        onClick={(e) => { e.stopPropagation(); handleStopMonitoring(conn.id); }}
                                        title="Fechar conexão"
                                    >
                                        <CloseIcon sx={{ fontSize: 16 }} />
                                    </button>
                                    {/* Label com nome e status */}
                                    <div className="vnc-wall-item-label">
                                        <span className={`vnc-wall-item-status ${connectionErrors[conn.id] ? 'error' : ''}`}></span>
                                        <span className="vnc-wall-item-name">
                                            {conn.name}
                                            {connectionErrors[conn.id] && <span className="reconnecting-badge"> 🔄</span>}
                                        </span>
                                    </div>
                                    <VncDisplay
                                        key={conn.reconnectKey || conn.id}
                                        connectionInfo={conn}
                                        onDisconnect={() => handleStopMonitoring(conn.id)}
                                        onError={(err) => handleConnectionError(conn.id, err)}
                                        viewOnly={true}
                                    />
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* ✨ v4.1: Modal Fullscreen */}
            {fullscreenConnection && (
                <VncFullscreen
                    connection={fullscreenConnection}
                    onClose={() => setFullscreenConnection(null)}
                />
            )}
        </div>
    );
};

export default VncWallView;
