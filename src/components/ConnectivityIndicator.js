// src/components/ConnectivityIndicator.js - INDICADOR VISUAL DE CONECTIVIDADE
// Componente React para exibir status de conectividade de servidores

import React, { useState, useEffect } from 'react';
import useConnectivity from '../hooks/useConnectivity';

/**
 * Componente indicador de conectividade
 * @param {Object} props - Props do componente
 * @returns {JSX.Element} - Componente renderizado
 */
function ConnectivityIndicator({ 
    serverInfo, 
    size = 'medium',
    showText = true,
    showLatency = true,
    clickToTest = true,
    autoTest = true,
    className = '',
    onClick = null
}) {
    const { 
        testServer, 
        getConnectivityResult, 
        isServerTesting,
        formatLatency,
        getStatusDisplayInfo 
    } = useConnectivity({ autoTest });

    const [lastClickTime, setLastClickTime] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Obtém resultado atual de conectividade
    const connectivityResult = getConnectivityResult(serverInfo);
    const isTesting = isServerTesting(serverInfo);

    // ==========================
    // CONFIGURAÇÕES DE TAMANHO
    // ==========================
    const sizeConfig = {
        small: {
            indicator: '8px',
            icon: '12px',
            text: '10px',
            padding: '4px 6px',
            gap: '4px'
        },
        medium: {
            indicator: '12px',
            icon: '16px', 
            text: '12px',
            padding: '6px 8px',
            gap: '6px'
        },
        large: {
            indicator: '16px',
            icon: '20px',
            text: '14px',
            padding: '8px 12px',
            gap: '8px'
        }
    };

    const config = sizeConfig[size] || sizeConfig.medium;

    // ==========================
    // HANDLERS
    // ==========================

    const handleClick = async (event) => {
        if (onClick) {
            onClick(event, serverInfo, connectivityResult);
            return;
        }

        if (!clickToTest) return;

        // Evita cliques duplos
        const now = Date.now();
        if (now - lastClickTime < 1000) return;
        setLastClickTime(now);

        try {
            await testServer(serverInfo);
        } catch (error) {
            console.error('Erro ao testar conectividade:', error);
        }
    };

    // ==========================
    // AUTO TESTE INICIAL
    // ==========================
    useEffect(() => {
        if (autoTest && !connectivityResult && serverInfo?.ipAddress) {
            // Pequeno delay para não sobrecarregar na inicialização
            const timeout = setTimeout(() => {
                testServer(serverInfo).catch(console.error);
            }, Math.random() * 2000 + 500); // 500-2500ms aleatório

            return () => clearTimeout(timeout);
        }
    }, [autoTest, serverInfo, connectivityResult, testServer]);

    // ==========================
    // FUNÇÕES DE RENDERIZAÇÃO
    // ==========================

    /**
     * Renderiza o indicador principal
     */
    const renderIndicator = () => {
        let status = 'unknown';
        let displayInfo = { icon: '❓', color: '#666', text: 'Não testado' };

        if (isTesting) {
            status = 'testing';
            displayInfo = { icon: '🔄', color: '#ff9500', text: 'Testando...' };
        } else if (connectivityResult) {
            status = connectivityResult.status;
            displayInfo = getStatusDisplayInfo ? getStatusDisplayInfo(status) : displayInfo;
        }

        return (
            <div 
                className={`connectivity-indicator ${size} ${status} ${className}`}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: config.gap,
                    padding: showText ? config.padding : config.gap,
                    borderRadius: '12px',
                    backgroundColor: isHovered ? 'rgba(255,255,255,0.1)' : 'transparent',
                    cursor: clickToTest ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    border: `1px solid ${displayInfo.color}40`,
                    position: 'relative',
                    userSelect: 'none'
                }}
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                title={getTooltipText(connectivityResult, isTesting)}
            >
                {/* Indicador de Status */}
                <div
                    className="status-dot"
                    style={{
                        width: config.indicator,
                        height: config.indicator,
                        borderRadius: '50%',
                        backgroundColor: displayInfo.color,
                        boxShadow: `0 0 ${config.indicator} ${displayInfo.color}60`,
                        animation: isTesting ? 'pulse 1.5s infinite' : 'none'
                    }}
                />

                {/* Ícone de Status */}
                <span 
                    className="status-icon"
                    style={{
                        fontSize: config.icon,
                        animation: isTesting ? 'rotate 2s linear infinite' : 'none'
                    }}
                >
                    {displayInfo.icon}
                </span>

                {/* Texto de Status */}
                {showText && (
                    <span 
                        className="status-text"
                        style={{
                            fontSize: config.text,
                            color: displayInfo.color,
                            fontWeight: '500'
                        }}
                    >
                        {displayInfo.text}
                    </span>
                )}

                {/* Latência */}
                {showLatency && connectivityResult?.tests?.tcpLatency?.success && (
                    <span 
                        className="latency-display"
                        style={{
                            fontSize: config.text,
                            color: '#aaa',
                            fontFamily: 'monospace'
                        }}
                    >
                        ({connectivityResult.tests.tcpLatency.average}ms)
                    </span>
                )}
            </div>
        );
    };

    /**
     * Gera texto do tooltip
     */
    const getTooltipText = (result, testing) => {
        if (testing) {
            return 'Testando conectividade... Clique para cancelar';
        }

        if (!result) {
            return clickToTest ? 'Clique para testar conectividade' : 'Conectividade não testada';
        }

        let tooltip = result.message || 'Status de conectividade';
        
        if (result.tests) {
            const details = [];
            
            if (result.tests.ping?.success) {
                details.push(`Ping: ${result.tests.ping.averageLatency || 'N/A'}ms`);
            }
            
            if (result.tests.port) {
                details.push(`Porta: ${result.tests.port.status}`);
            }
            
            if (result.tests.tcpLatency?.success) {
                details.push(`Latência TCP: ${result.tests.tcpLatency.average}ms`);
            }
            
            if (details.length > 0) {
                tooltip += '\n\nDetalhes:\n' + details.join('\n');
            }
        }

        if (result.totalTime) {
            tooltip += `\n\nTempo do teste: ${result.totalTime}ms`;
        }

        if (result.timestamp) {
            const testTime = new Date(result.timestamp).toLocaleTimeString();
            tooltip += `\nTestado em: ${testTime}`;
        }

        if (clickToTest) {
            tooltip += '\n\nClique para testar novamente';
        }

        return tooltip;
    };

    // ==========================
    // RENDERIZAÇÃO PRINCIPAL
    // ==========================

    if (!serverInfo?.ipAddress) {
        return null;
    }

    return (
        <>
            {renderIndicator()}
            
            {/* Estilos CSS inline para animações */}
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.1); }
                }
                
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .connectivity-indicator:hover .status-dot {
                    transform: scale(1.2);
                    transition: transform 0.2s ease;
                }
                
                .connectivity-indicator.small {
                    font-size: 10px;
                }
                
                .connectivity-indicator.medium {
                    font-size: 12px;
                }
                
                .connectivity-indicator.large {
                    font-size: 14px;
                }
                
                .connectivity-indicator.online {
                    background: linear-gradient(90deg, rgba(0,255,0,0.1) 0%, transparent 100%);
                }
                
                .connectivity-indicator.offline {
                    background: linear-gradient(90deg, rgba(255,0,0,0.1) 0%, transparent 100%);
                }
                
                .connectivity-indicator.testing {
                    background: linear-gradient(90deg, rgba(255,149,0,0.1) 0%, transparent 100%);
                }
                
                .connectivity-indicator.partial {
                    background: linear-gradient(90deg, rgba(255,170,0,0.1) 0%, transparent 100%);
                }
            `}</style>
        </>
    );
}

/**
 * Componente simplificado - apenas o indicador sem texto
 */
export function ConnectivityDot({ serverInfo, size = 'small', ...props }) {
    return (
        <ConnectivityIndicator
            serverInfo={serverInfo}
            size={size}
            showText={false}
            showLatency={false}
            {...props}
        />
    );
}

/**
 * Componente detalhado - com todas as informações
 */
export function ConnectivityDetails({ serverInfo, ...props }) {
    const { getConnectivityResult } = useConnectivity();
    const result = getConnectivityResult(serverInfo);

    if (!result || result.status === 'unknown') {
        return <ConnectivityIndicator serverInfo={serverInfo} {...props} />;
    }

    return (
        <div className="connectivity-details">
            <ConnectivityIndicator serverInfo={serverInfo} {...props} />
            
            {result.tests && (
                <div className="connectivity-test-details" style={{ marginTop: '8px', fontSize: '11px', color: '#888' }}>
                    {result.tests.ping?.success && (
                        <div>🏓 Ping: {result.tests.ping.averageLatency}ms ({result.tests.ping.packetLoss}% perda)</div>
                    )}
                    {result.tests.port && (
                        <div>🔌 Porta: {result.tests.port.status} ({result.tests.port.time}ms)</div>
                    )}
                    {result.tests.tcpLatency?.success && (
                        <div>⚡ Latência TCP: {result.tests.tcpLatency.min}-{result.tests.tcpLatency.max}ms (avg: {result.tests.tcpLatency.average}ms)</div>
                    )}
                    {result.totalTime && (
                        <div>⏱️ Tempo total: {result.totalTime}ms</div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ConnectivityIndicator;