// src/components/SshTerminal.js
// Terminal SSH nativo com xterm.js
// Migrado para Tailwind CSS

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import 'xterm/css/xterm.css';

function SshTerminal({ connectionInfo, onClose, onStatusChange }) {
    const terminalRef = useRef(null);
    const terminalInstanceRef = useRef(null);
    const fitAddonRef = useRef(null);
    const sessionIdRef = useRef(null);
    const cleanupRef = useRef(null);
    const [status, setStatus] = useState('connecting');
    const [error, setError] = useState(null);

    // Atualiza status e notifica parent
    const updateStatus = useCallback((newStatus, errorMsg = null) => {
        setStatus(newStatus);
        setError(errorMsg);
        if (onStatusChange) {
            onStatusChange(newStatus, errorMsg);
        }
    }, [onStatusChange]);

    // Fit com segurança - verifica se terminal está pronto
    const safeFit = useCallback(() => {
        try {
            if (fitAddonRef.current && terminalInstanceRef.current && terminalRef.current) {
                const rect = terminalRef.current.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    fitAddonRef.current.fit();
                    return true;
                }
            }
        } catch (err) {
            console.warn('safeFit error:', err);
        }
        return false;
    }, []);

    // Inicializa terminal e conexão SSH
    useEffect(() => {
        if (!terminalRef.current || !connectionInfo) return;

        let isMounted = true;
        let resizeTimeout = null;

        const initTerminal = async () => {
            // Aguarda um pouco para o DOM estar pronto
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!isMounted || !terminalRef.current) return;

            // Cria terminal xterm.js
            const term = new Terminal({
                cursorBlink: true,
                cursorStyle: 'bar',
                fontSize: 14,
                fontFamily: 'Consolas, "Courier New", monospace',
                theme: {
                    background: '#0a0a0f',
                    foreground: '#e0e0e0',
                    cursor: '#1de9b6',
                    cursorAccent: '#000000',
                    selection: 'rgba(29, 233, 182, 0.3)',
                    black: '#000000',
                    red: '#ef5350',
                    green: '#1de9b6',
                    yellow: '#ffa726',
                    blue: '#42a5f5',
                    magenta: '#ab47bc',
                    cyan: '#26c6da',
                    white: '#e0e0e0',
                    brightBlack: '#757575',
                    brightRed: '#ff7043',
                    brightGreen: '#4db6ac',
                    brightYellow: '#ffca28',
                    brightBlue: '#64b5f6',
                    brightMagenta: '#ce93d8',
                    brightCyan: '#4dd0e1',
                    brightWhite: '#ffffff',
                },
                scrollback: 5000,
                allowProposedApi: true,
                rows: 24,
                cols: 80,
            });

            // Addons
            const fitAddon = new FitAddon();
            const webLinksAddon = new WebLinksAddon();
            term.loadAddon(fitAddon);
            term.loadAddon(webLinksAddon);

            // Monta no DOM
            term.open(terminalRef.current);

            terminalInstanceRef.current = term;
            fitAddonRef.current = fitAddon;

            // Fit com delay adicional
            setTimeout(() => {
                if (isMounted && terminalRef.current) {
                    try {
                        const rect = terminalRef.current.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            fitAddon.fit();
                        }
                    } catch (e) {
                        console.warn('Initial fit error:', e);
                    }
                }
            }, 150);

            // Mensagem inicial
            term.writeln('\x1b[1;36m╔══════════════════════════════════════════╗\x1b[0m');
            term.writeln('\x1b[1;36m║\x1b[0m   🔐 Conectando via SSH...               \x1b[1;36m║\x1b[0m');
            term.writeln(`\x1b[1;36m║\x1b[0m   Host: ${connectionInfo.ipAddress}:${connectionInfo.port || 22}`);
            term.writeln(`\x1b[1;36m║\x1b[0m   User: ${connectionInfo.username}`);
            term.writeln('\x1b[1;36m╚══════════════════════════════════════════╝\x1b[0m');
            term.writeln('');

            // Conecta via SSH
            try {
                console.log('🔐 Iniciando conexão SSH:', connectionInfo);
                const result = await window.api.ssh.connect(connectionInfo);

                if (!isMounted) return;

                if (result.success) {
                    sessionIdRef.current = result.sessionId;
                    updateStatus('connected');
                    term.writeln('\x1b[1;32m✓ Conexão SSH estabelecida!\x1b[0m');
                    term.writeln('');
                    term.focus();
                } else {
                    updateStatus('error', result.error);
                    term.writeln(`\x1b[1;31m✖ Erro: ${result.error}\x1b[0m`);
                }
            } catch (err) {
                if (!isMounted) return;
                updateStatus('error', err.message);
                term.writeln(`\x1b[1;31m✖ Erro de conexão: ${err.message}\x1b[0m`);
                console.error('SSH connection error:', err);
            }

            // Listener de dados recebidos do SSH
            const handleSshData = (sessionId, data) => {
                if (sessionId === sessionIdRef.current && terminalInstanceRef.current) {
                    terminalInstanceRef.current.write(data);
                }
            };

            // Listener de sessão encerrada
            const handleSshClosed = (sessionId) => {
                if (sessionId === sessionIdRef.current) {
                    updateStatus('disconnected');
                    if (terminalInstanceRef.current) {
                        terminalInstanceRef.current.writeln('');
                        terminalInstanceRef.current.writeln('\x1b[1;33m⚠ Conexão SSH encerrada\x1b[0m');
                    }
                }
            };

            // Registra listeners
            if (window.api?.ssh) {
                window.api.ssh.onData(handleSshData);
                window.api.ssh.onClosed(handleSshClosed);
            }

            // Input do usuário → SSH
            term.onData((data) => {
                if (sessionIdRef.current && window.api?.ssh) {
                    window.api.ssh.write(sessionIdRef.current, data);
                }
            });

            // Resize handler com debounce
            const handleResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    try {
                        if (fitAddonRef.current && terminalRef.current) {
                            const rect = terminalRef.current.getBoundingClientRect();
                            if (rect.width > 0 && rect.height > 0) {
                                fitAddonRef.current.fit();
                                if (sessionIdRef.current && terminalInstanceRef.current && window.api?.ssh) {
                                    const { cols, rows } = terminalInstanceRef.current;
                                    window.api.ssh.resize(sessionIdRef.current, cols, rows);
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('Resize error:', e);
                    }
                }, 150);
            };

            window.addEventListener('resize', handleResize);

            // Guarda referência para cleanup
            cleanupRef.current = () => {
                window.removeEventListener('resize', handleResize);
            };
        };

        initTerminal();

        // Cleanup
        return () => {
            isMounted = false;
            clearTimeout(resizeTimeout);

            if (cleanupRef.current) {
                cleanupRef.current();
            }

            if (sessionIdRef.current && window.api?.ssh) {
                window.api.ssh.disconnect(sessionIdRef.current);
                sessionIdRef.current = null;
            }

            if (terminalInstanceRef.current) {
                terminalInstanceRef.current.dispose();
                terminalInstanceRef.current = null;
            }
        };
    }, [connectionInfo, updateStatus]);

    // ✨ v4.6: Fit com múltiplos delays e envio de resize ao servidor
    useEffect(() => {
        if (!terminalRef.current || !terminalInstanceRef.current) return;

        // Função para fit com envio de resize ao SSH
        const doFitAndResize = () => {
            if (safeFit() && sessionIdRef.current && window.api?.ssh) {
                const { cols, rows } = terminalInstanceRef.current;
                window.api.ssh.resize(sessionIdRef.current, cols, rows);
                console.log(`📐 Terminal resized: ${cols}x${rows}`);
            }
        };

        // Múltiplos fits com delays crescentes para garantir que funcione
        const timers = [
            setTimeout(doFitAndResize, 100),
            setTimeout(doFitAndResize, 300),
            setTimeout(doFitAndResize, 500),
            setTimeout(doFitAndResize, 1000),
        ];

        // Observer para detectar quando o elemento se torna visível
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Delay pequeno para dar tempo do layout estabilizar
                    setTimeout(doFitAndResize, 50);
                }
            });
        }, { threshold: 0.1 });

        observer.observe(terminalRef.current);

        return () => {
            timers.forEach(t => clearTimeout(t));
            observer.disconnect();
        };
    }, [safeFit]);

    // ✨ v4.5: Handler de context menu para colar (botão direito)
    const handleContextMenu = useCallback(async (e) => {
        e.preventDefault();

        if (!terminalInstanceRef.current || !sessionIdRef.current) return;

        try {
            // Tenta ler do clipboard e enviar para o terminal
            const text = await navigator.clipboard.readText();
            if (text && window.api?.ssh) {
                window.api.ssh.write(sessionIdRef.current, text);
            }
        } catch (err) {
            console.warn('Não foi possível colar do clipboard:', err);
        }
    }, []);

    // Status indicator classes
    const getStatusClasses = () => {
        switch (status) {
            case 'connecting':
                return 'bg-amber-500 animate-pulse';
            case 'connected':
                return 'bg-primary shadow-[0_0_8px_rgba(29,233,182,0.5)]';
            case 'error':
                return 'bg-red-500';
            case 'disconnected':
                return 'bg-gray-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#0a0a0f] rounded-lg overflow-hidden relative">
            {/* Header */}
            <div className="
                flex items-center justify-between
                px-4 py-2.5
                bg-gradient-to-r from-dark-surface to-dark-elevated
                border-b border-primary/30
                shrink-0
            ">
                <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusClasses()}`} />
                    <span className="font-mono text-sm font-semibold text-primary">
                        SSH: {connectionInfo?.username}@{connectionInfo?.ipAddress}
                    </span>
                </div>
                {error && (
                    <span className="text-xs text-red-500 max-w-[300px] truncate">
                        {error}
                    </span>
                )}
            </div>

            {/* Terminal Container */}
            <div
                ref={terminalRef}
                className="
                    flex-1 p-2
                    overflow-hidden
                    min-h-0 min-w-0
                    flex flex-col
                    relative
                    [&_.xterm]:flex-1 [&_.xterm]:min-h-0 [&_.xterm]:w-full
                    [&_.xterm-screen]:w-full
                    [&_.xterm-viewport]:w-full [&_.xterm-viewport]:overflow-y-auto
                    [&_.xterm-rows]:w-full
                    [&_.xterm-viewport]:scrollbar-thin
                    [&_.xterm-viewport]:scrollbar-track-[#0a0a0f]
                    [&_.xterm-viewport]:scrollbar-thumb-dark-elevated
                    [&_.xterm-viewport:hover]:scrollbar-thumb-primary
                    [&_.xterm-selection_div]:!bg-primary/30
                    [&_.xterm-cursor-layer]:z-10
                "
                onContextMenu={handleContextMenu}
            />
        </div>
    );
}

export default SshTerminal;
