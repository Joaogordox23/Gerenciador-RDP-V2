// src/views/DashboardView.js (VERSÃO COM STATS DINÂMICOS)

import React from 'react';
import { useConnectivity } from '../hooks/useConnectivity';
import { SyncIcon, PlayArrowIcon } from '../components/MuiIcons';



function StatCard({ title, value, color }) {
    return (
        <div className="stat-card" style={{ borderColor: color }}>
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-title">{title}</div>
        </div>
    );
}

function DashboardView({ servers, onTestAll }) {
    const { results, isTesting, monitoredServers, generateServerKey, testServer } = useConnectivity();

    // vvvv LÓGICA DE CÁLCULO REFINADA vvvv
    let onlineCount = 0;
    let offlineCount = 0;

    // Itera sobre todos os servidores passados para a dashboard
    servers.forEach(server => {
        const key = generateServerKey(server);
        const result = results.get(key); // Pega o resultado mais recente para este servidor

        if (result) {
            if (result.status === 'online') {
                onlineCount++;
            } else if (result.status === 'offline' || result.status === 'error' || result.status === 'partial') {
                // Consideramos offline, erro ou parcial como um estado que requer atenção
                offlineCount++;
            }
        }
    });
    // ^^^^ LÓGICA DE CÁLCULO REFINADA ^^^^

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Dashboard de Monitoramento</h2>
                <button onClick={onTestAll} className="btn btn--primary">
                    <SyncIcon sx={{ fontSize: 18, marginRight: '8px' }} />
                    Testar Todos
                </button>
            </div>

            <div className="dashboard-stats">
                {/* Os valores agora são dinâmicos */}
                <StatCard title="Total de Servidores" value={servers.length} color="var(--color-info)" />
                <StatCard title="Online" value={onlineCount} color="var(--color-success)" />
                <StatCard title="Com Alerta" value={offlineCount} color="var(--color-error)" />
                <StatCard title="Monitorados" value={monitoredServers.size} color="var(--color-primary)" />
            </div>

            <div className="dashboard-server-list">
                <table className="server-table">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Nome do Servidor</th>
                            <th>Endereço</th>
                            <th>Grupo</th>
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
                                    <td>{server.name}</td>
                                    <td>{server.ipAddress}{server.port ? `:${server.port}` : ''}</td>
                                    <td>{server.groupName}</td>
                                    <td>
                                        {/* 🔧 CORREÇÃO BUG #4: Diferenciar "Testando..." de "-" */}
                                        {isCurrentlyTesting ? (
                                            <span className="latency testing">Testando...</span>
                                        ) : latency ? (
                                            <span className="latency">{latency} ms</span>
                                        ) : (
                                            <span className="latency unknown">-</span>
                                        )}
                                    </td>
                                    <td>{result ? new Date(result.timestamp).toLocaleTimeString() : 'Nunca'}</td>
                                    <td>
                                        <button
                                            className="action-button-icon"
                                            title="Testar Agora"
                                            onClick={() => testServer(server)}
                                            disabled={isCurrentlyTesting}
                                        >
                                            <PlayArrowIcon sx={{ fontSize: 18 }} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DashboardView;