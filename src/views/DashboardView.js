// src/views/DashboardView.js
import React, { useMemo } from 'react';
import { useConnectivity } from '../hooks/useConnectivity';
import { SyncIcon, PlayArrowIcon } from '../components/MuiIcons';
import StatusPieChart from '../components/dashboard/StatusPieChart';
import LatencyChart from '../components/dashboard/LatencyChart';
import '../components/dashboard/Dashboard.css';

function StatCard({ title, value, color, icon }) {
    return (
        <div className="glass-panel stat-card" style={{ borderLeft: `4px solid ${color}` }}>
            <div className="stat-icon" style={{ color: color }}>{icon}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{title}</div>
        </div>
    );
}

function DashboardView({ servers, onTestAll }) {
    const { results, isTesting, monitoredServers, generateServerKey, testServer } = useConnectivity();

    // Cálculos de Estatísticas
    const stats = useMemo(() => {
        let online = 0;
        let offline = 0;
        let alert = 0;

        servers.forEach(server => {
            const key = generateServerKey(server);
            const result = results.get(key);

            if (result) {
                if (result.status === 'online') online++;
                else if (result.status === 'offline') offline++;
                else alert++;
            } else {
                // Considera desconhecido como alerta/pendente
                alert++;
            }
        });

        return { online, offline, alert, total: servers.length };
    }, [servers, results, generateServerKey]);

    // Dados para o Gráfico de Pizza
    const pieData = useMemo(() => [
        { name: 'Online', value: stats.online },
        { name: 'Offline', value: stats.offline },
        { name: 'Alerta', value: stats.alert },
    ], [stats]);

    // Dados para o Gráfico de Latência (Simulado/Histórico)
    // Em um cenário real, isso viria do histórico de monitoramento
    const latencyData = useMemo(() => {
        const data = [];
        const now = new Date();
        for (let i = 10; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60000);
            data.push({
                time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                latency: Math.floor(Math.random() * 50) + 20 // Simulação
            });
        }
        return data;
    }, []);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 600 }}>Dashboard de Monitoramento</h2>
                <button onClick={onTestAll} className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
                    <SyncIcon sx={{ fontSize: 20 }} />
                    Testar Conectividade
                </button>
            </div>

            {/* Cards de Estatísticas */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                <StatCard title="Total de Servidores" value={stats.total} color="#2196f3" icon="🖥️" />
                <StatCard title="Online" value={stats.online} color="#1de9b6" icon="✅" />
                <StatCard title="Offline" value={stats.offline} color="#e91e63" icon="❌" />
                <StatCard title="Monitorados" value={monitoredServers.size} color="#ffc107" icon="📡" />
            </div>

            {/* Gráficos */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                <StatusPieChart data={pieData} />
                <LatencyChart data={latencyData} />
            </div>

            {/* Lista de Servidores Recentes/Críticos */}
            <div className="glass-panel">
                <h3 className="chart-title">Status dos Servidores</h3>
                <div className="dashboard-server-list">
                    <table className="server-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Servidor</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Endereço</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Latência</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Última Verificação</th>
                                <th style={{ padding: '15px', textAlign: 'center' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {servers.map(server => {
                                const key = generateServerKey(server);
                                const result = results.get(key);
                                const isCurrentlyTesting = isTesting.has(key);
                                const status = result ? result.status : 'unknown';
                                const latency = result?.tests?.ping?.averageLatency;

                                return (
                                    <tr key={server.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '15px' }}>
                                            <div className={`status-indicator ${isCurrentlyTesting ? 'testing' : status}`}></div>
                                        </td>
                                        <td style={{ padding: '15px', fontWeight: 500 }}>{server.name}</td>
                                        <td style={{ padding: '15px', color: 'rgba(255,255,255,0.7)' }}>{server.ipAddress}</td>
                                        <td style={{ padding: '15px' }}>
                                            {isCurrentlyTesting ? (
                                                <span className="latency testing">Testando...</span>
                                            ) : latency ? (
                                                <span className="latency" style={{ color: latency < 100 ? '#1de9b6' : '#ffc107' }}>{latency} ms</span>
                                            ) : (
                                                <span className="latency unknown">-</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '15px', color: 'rgba(255,255,255,0.7)' }}>
                                            {result ? new Date(result.timestamp).toLocaleTimeString() : '-'}
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'center' }}>
                                            <button
                                                className="action-button-icon"
                                                title="Testar Agora"
                                                onClick={() => testServer(server)}
                                                disabled={isCurrentlyTesting}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff' }}
                                            >
                                                <PlayArrowIcon sx={{ fontSize: 20 }} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default DashboardView;