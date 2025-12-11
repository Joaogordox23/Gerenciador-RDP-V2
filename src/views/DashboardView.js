// src/views/DashboardView.js (v5.0: Premium Dashboard Design)

import React, { useMemo } from 'react';
import { useConnectivity } from '../hooks/useConnectivity';
import { SyncIcon, PlayArrowIcon, RefreshIcon } from '../components/MuiIcons';
import StatusPieChart from '../components/dashboard/StatusPieChart';
import LatencyChart from '../components/dashboard/LatencyChart';
import '../components/dashboard/Dashboard.css';

// Icons SVG
const ServerIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
        <line x1="6" y1="6" x2="6.01" y2="6"></line>
        <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>
);

const CheckCircleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const XCircleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
);

const ActivityIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
);

// StatCard Component Premium
function StatCard({ title, value, type, icon }) {
    return (
        <div className={`glass-panel stat-card ${type}`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{title}</div>
        </div>
    );
}

// Latency Badge Component
function LatencyBadge({ latency, isTesting }) {
    if (isTesting) {
        return <span className="latency-badge testing">Testando...</span>;
    }

    if (!latency && latency !== 0) {
        return <span className="latency-badge unknown">—</span>;
    }

    let className = 'latency-badge ';
    if (latency < 50) className += 'good';
    else if (latency < 150) className += 'medium';
    else className += 'bad';

    return <span className={className}>{latency} ms</span>;
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

    // Dados para o Gráfico de Latência (últimos 10 minutos)
    const latencyData = useMemo(() => {
        const data = [];
        const now = new Date();
        for (let i = 10; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60000);
            data.push({
                time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                latency: Math.floor(Math.random() * 50) + 20
            });
        }
        return data;
    }, []);

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <h2 className="dashboard-title">Dashboard de Monitoramento</h2>
                <div className="dashboard-actions">
                    <button onClick={onTestAll} className="dashboard-btn primary">
                        <SyncIcon style={{ fontSize: 18 }} />
                        Testar Conectividade
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="dashboard-grid">
                <StatCard
                    title="Total de Servidores"
                    value={stats.total}
                    type="total"
                    icon="🖥️"
                />
                <StatCard
                    title="Online"
                    value={stats.online}
                    type="online"
                    icon="✅"
                />
                <StatCard
                    title="Offline"
                    value={stats.offline}
                    type="offline"
                    icon="❌"
                />
                <StatCard
                    title="Monitorados"
                    value={monitoredServers.size}
                    type="monitored"
                    icon="📡"
                />
            </div>

            {/* Charts */}
            <div className="dashboard-grid charts">
                <StatusPieChart data={pieData} />
                <LatencyChart data={latencyData} />
            </div>

            {/* Server Table */}
            <div className="glass-panel">
                <h3 className="chart-title">
                    <span className="chart-title-icon">📋</span>
                    Status dos Servidores
                </h3>
                <div className="server-table-container">
                    <table className="server-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Servidor</th>
                                <th>Endereço</th>
                                <th>Latência</th>
                                <th>Última Verificação</th>
                                <th>Ações</th>
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
                                    <tr key={server.id}>
                                        <td>
                                            <div className={`status-indicator ${isCurrentlyTesting ? 'testing' : status}`}></div>
                                        </td>
                                        <td className="server-name">{server.name}</td>
                                        <td className="server-address">{server.ipAddress}</td>
                                        <td>
                                            <LatencyBadge latency={latency} isTesting={isCurrentlyTesting} />
                                        </td>
                                        <td className="last-check">
                                            {result ? new Date(result.timestamp).toLocaleTimeString() : '—'}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                className={`table-action-btn ${isCurrentlyTesting ? 'testing' : ''}`}
                                                title="Testar Agora"
                                                onClick={() => testServer(server)}
                                                disabled={isCurrentlyTesting}
                                            >
                                                {isCurrentlyTesting ? (
                                                    <RefreshIcon style={{ fontSize: 18 }} />
                                                ) : (
                                                    <PlayArrowIcon style={{ fontSize: 18 }} />
                                                )}
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