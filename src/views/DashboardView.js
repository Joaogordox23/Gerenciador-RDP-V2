// src/views/DashboardView.js
// ✨ v4.8: Migrado para Tailwind CSS
import React, { useMemo } from 'react';
import { useConnectivity } from '../hooks/useConnectivity';
import { SyncIcon, PlayArrowIcon, RefreshIcon, ComputerIcon, CheckCircleIcon, CancelIcon, SensorsIcon, ListAltIcon } from '../components/MuiIcons';
import StatusPieChart from '../components/dashboard/StatusPieChart';
import LatencyChart from '../components/dashboard/LatencyChart';

// StatCard Component
function StatCard({ title, value, type, icon }) {
    const typeStyles = {
        total: 'border-blue-500/30 bg-blue-500/5',
        online: 'border-primary/30 bg-primary/5',
        offline: 'border-red-500/30 bg-red-500/5',
        monitored: 'border-purple-500/30 bg-purple-500/5'
    };

    const valueStyles = {
        total: 'text-blue-400',
        online: 'text-primary',
        offline: 'text-red-400',
        monitored: 'text-purple-400'
    };

    return (
        <div className={`
            bg-cream-100/80 dark:bg-dark-surface/80 backdrop-blur-sm
            border ${typeStyles[type] || 'border-gray-200 dark:border-gray-700'}
            rounded-xl p-6 
            flex flex-col items-center justify-center
            transition-all duration-200
            hover:shadow-lg hover:-translate-y-1
        `}>
            <div className="mb-2">{icon}</div>
            <div className={`text-4xl font-bold mb-1 ${valueStyles[type] || 'text-slate-900 dark:text-white'}`}>
                {value}
            </div>
            <div className="text-sm text-gray-500">{title}</div>
        </div>
    );
}

// Latency Badge Component
function LatencyBadge({ latency, isTesting }) {
    if (isTesting) {
        return (
            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-500 animate-pulse">
                Testando...
            </span>
        );
    }

    if (!latency && latency !== 0) {
        return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-500/20 text-gray-400">—</span>;
    }

    let colorClass = '';
    if (latency < 50) colorClass = 'bg-primary/20 text-primary';
    else if (latency < 150) colorClass = 'bg-yellow-500/20 text-yellow-500';
    else colorClass = 'bg-red-500/20 text-red-500';

    return <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>{latency} ms</span>;
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

    // Dados para o Gráfico de Latência (simulado)
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
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Dashboard de Monitoramento
                </h2>
                <button
                    onClick={onTestAll}
                    className="flex items-center gap-2 px-4 py-2.5
                        bg-gradient-to-br from-primary to-primary-hover
                        text-white font-semibold rounded-xl
                        shadow-lg shadow-primary/30
                        transition-all duration-200
                        hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40"
                >
                    <SyncIcon style={{ fontSize: 18 }} />
                    Testar Conectividade
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total de Servidores" value={stats.total} type="total" icon={<ComputerIcon className="text-blue-400" sx={{ fontSize: 36 }} />} />
                <StatCard title="Online" value={stats.online} type="online" icon={<CheckCircleIcon className="text-primary" sx={{ fontSize: 36 }} />} />
                <StatCard title="Offline" value={stats.offline} type="offline" icon={<CancelIcon className="text-red-400" sx={{ fontSize: 36 }} />} />
                <StatCard title="Monitorados" value={monitoredServers.size} type="monitored" icon={<SensorsIcon className="text-purple-400" sx={{ fontSize: 36 }} />} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <StatusPieChart data={pieData} />
                <LatencyChart data={latencyData} />
            </div>

            {/* Server Table */}
            <div className="bg-cream-100/80 dark:bg-dark-surface/80 backdrop-blur-sm 
                border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    <ListAltIcon className="text-primary" sx={{ fontSize: 20 }} />
                    Status dos Servidores
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="py-3 px-4 text-left font-semibold text-gray-500">Status</th>
                                <th className="py-3 px-4 text-left font-semibold text-gray-500">Servidor</th>
                                <th className="py-3 px-4 text-left font-semibold text-gray-500">Endereço</th>
                                <th className="py-3 px-4 text-left font-semibold text-gray-500">Latência</th>
                                <th className="py-3 px-4 text-left font-semibold text-gray-500">Última Verificação</th>
                                <th className="py-3 px-4 text-center font-semibold text-gray-500">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {servers.map(server => {
                                const key = generateServerKey(server);
                                const result = results.get(key);
                                const isCurrentlyTesting = isTesting.has(key);
                                const status = result ? result.status : 'unknown';
                                const latency = result?.latency;

                                return (
                                    <tr key={server.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-primary/5 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className={`w-3 h-3 rounded-full ${isCurrentlyTesting ? 'bg-yellow-500 animate-pulse' :
                                                status === 'online' ? 'bg-primary' :
                                                    status === 'offline' ? 'bg-red-500' : 'bg-gray-400'
                                                }`}></div>
                                        </td>
                                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                                            {server.name}
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 font-mono text-xs">
                                            {server.ipAddress}
                                        </td>
                                        <td className="py-3 px-4">
                                            <LatencyBadge latency={latency} isTesting={isCurrentlyTesting} />
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 text-xs">
                                            {result ? new Date(result.timestamp).toLocaleTimeString() : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                className={`p-2 rounded-lg transition-all duration-200
                                                    ${isCurrentlyTesting
                                                        ? 'bg-yellow-500/20 text-yellow-500 cursor-not-allowed animate-spin'
                                                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                                                    }`}
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