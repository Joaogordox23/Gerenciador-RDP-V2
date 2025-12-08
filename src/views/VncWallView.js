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

    // ✨ v4.0: Lógica do carrossel automático
    useEffect(() => {
        if (carouselMode && isPlaying && connections.length > 0) {  // Era allConnections
            timerRef.current = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % connections.length);  // Era allConnections
            }, carouselInterval);

            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            };
        }
    }, [carouselMode, isPlaying, carouselInterval, connections.length]);

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
            // Para o proxy no backend
            await window.api.vnc.stopProxy(connectionId);

            // Remove da lista local
            setConnections(prev => prev.filter(c => c.id !== connectionId));
        } catch (error) {
            console.error('Erro ao desconectar:', error);
        }
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
        setCurrentIndex(prev => (prev + 1) % allConnections.length);
    };

    const handlePrevious = () => {
        setCurrentIndex(prev => (prev - 1 + allConnections.length) % allConnections.length);
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

    return (
        <div className="vnc-wall-container">
            {/* Sidebar de Seleção */}
            <div className={`vnc-wall-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
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

                    {/* ✨ v4.1: Controle de Colunas do Grid */}
                    {!carouselMode && (
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
                    )}

                    <button
                        onClick={handleStopAll}
                        className="btn-stop-all"
                        disabled={connections.length === 0}
                    >
                        Parar Todos ({connections.length})
                    </button>
                </div>
            </div>

            {/* Grid de Visualização */}
            <div className="vnc-wall-main">
                {/* ✨ v4.0: Renderização condicional - Carrossel vs Grid */}
                {carouselMode ? (
                    connections.length === 0 ? (  // Era allConnections
                        <div className="wall-empty-state">
                            <p>Selecione servidores para exibir no carrossel</p>
                        </div>
                    ) : (
                        <div className="vnc-carousel-fullscreen">
                            <VncDisplay
                                connectionInfo={connections[currentIndex]}  // Era allConnections
                                onDisconnect={() => handleStopMonitoring(connections[currentIndex].id)}
                                fullscreen={true}
                            />
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
                                <div key={conn.id} className="vnc-wall-item" onDoubleClick={() => handleDoubleClick(conn)}>
                                    {/* Label com nome do computador */}
                                    <div className="vnc-wall-item-label">
                                        <span className="vnc-wall-item-name">{conn.name}</span>
                                    </div>
                                    <VncDisplay
                                        connectionInfo={conn}
                                        onDisconnect={() => handleStopMonitoring(conn.id)}
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
