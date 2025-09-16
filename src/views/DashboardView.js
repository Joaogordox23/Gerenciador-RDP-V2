// src/views/DashboardView.js (VERSÃO CORRIGIDA E COM UX MELHORADO)

import React from 'react';
import { useConnectivity } from '../hooks/useConnectivity';

// 1. IMPORTANDO O ÍCONE PADRÃO PARA O BOTÃO DE AÇÃO
const TestIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.88.99 6.6 2.6l-2.6 2.6"></path><path d="M21 3v6h-6"></path></svg> );

// Componente para os cards de resumo no topo (sem alterações)
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

    // Lógica para calcular as estatísticas (sem alterações)
    let onlineCount = 0;
    let offlineCount = 0;
    servers.forEach(server => {
        const key = generateServerKey(server);
        const result = results.get(key);
        if (result) {
            if (result.status === 'online') onlineCount++;
            else if (result.status === 'offline' || result.status === 'error') offlineCount++;
        }
    });

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Dashboard de Monitoramento</h2>
                <button onClick={onTestAll} className="toolbar-btn">Testar Todos</button>
            </div>

            <div className="dashboard-stats">
                <StatCard title="Total de Servidores" value={servers.length} color="var(--color-info)" />
                <StatCard title="Online" value={onlineCount} color="var(--color-success)" />
                <StatCard title="Offline / Erros" value={offlineCount} color="var(--color-error)" />
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
                            
                            // 2. CORREÇÃO NA LATÊNCIA: Acessando o dado de forma segura
                            const latency = result?.tests?.ping?.averageLatency;

                            return (
                                <tr key={server.id}>
                                    <td>
                                        {/* 3. CORREÇÃO NO STATUS: Adicionando a classe de cor dinâmica */}
                                        <div className={`status-indicator ${isCurrentlyTesting ? 'testing' : status}`}></div>
                                    </td>
                                    <td>{server.name}</td>
                                    <td>{server.ipAddress}{server.port ? `:${server.port}`: ''}</td>
                                    <td>{server.groupName}</td>
                                    <td>{isCurrentlyTesting ? '...' : (latency ? `${latency} ms` : '-')}</td>
                                    <td>{result ? new Date(result.timestamp).toLocaleTimeString() : 'Nunca'}</td>
                                    <td>
                                        {/* 4. CORREÇÃO NO BOTÃO: Usando o mesmo padrão do Server.js */}
                                        <button 
                                            className="action-button-icon" 
                                            title="Testar Agora" 
                                            onClick={() => testServer(server)}
                                            disabled={isCurrentlyTesting}
                                        >
                                            <TestIcon />
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