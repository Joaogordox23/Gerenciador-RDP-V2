/**
 * guacamoleConfig.js
 * Configurações globais para conexões Guacamole
 * Armazenadas via electron-store
 */

const path = require('path');
const os = require('os');

// Diretório padrão para transferência de arquivos
const DEFAULT_DRIVE_PATH = path.join(os.homedir(), 'Documents', 'GerenciadorRDP', 'Transfers');

// Configurações padrão
const DEFAULT_CONFIG = {
    // Configurações gerais
    general: {
        autoScale: true,           // Escala automática para caber na janela
        autoFitWindow: true,       // Ajusta tamanho ao redimensionar
    },

    // Clipboard
    clipboard: {
        enabled: true,             // Habilita sincronização de clipboard
        syncFromRemote: true,      // Sincroniza clipboard do remoto para local
        syncToRemote: true,        // Sincroniza clipboard do local para remoto
    },

    // Qualidade de imagem
    quality: {
        mode: 'balanced',          // 'low', 'balanced', 'high', 'lossless'
        colorDepth: 24,            // 8, 16, 24, 32
        compression: 'auto',       // 'none', 'low', 'medium', 'high', 'auto'
    },

    // Configurações de Display
    display: {
        dynamicResize: true,       // Redimensionamento dinâmico
        width: null,               // null = usar resolução do cliente
        height: null,              // null = usar resolução do cliente
        dpi: 96,                   // DPI padrão
        fitToWindow: true,         // Ajustar à janela
    },

    // Transferência de arquivos
    fileTransfer: {
        enabled: true,             // Habilita transferência
        drivePath: DEFAULT_DRIVE_PATH,  // Caminho para arquivos
        createDrivePath: true,     // Criar diretório se não existir
        downloadEnabled: true,     // Permitir download
        uploadEnabled: true,       // Permitir upload
    },

    // Configurações específicas por protocolo
    rdp: {
        enableWallpaper: false,
        enableTheming: false,
        enableFontSmoothing: true,
        enableFullWindowDrag: false,
        enableDesktopComposition: false,
        enableMenuAnimations: false,
        resizeMethod: 'display-update',  // 'display-update' ou 'reconnect'
        defaultPort: 3389,
        // Drive/Arquivos
        enableDrive: true,
        driveName: 'Compartilhado',
        // Multi-monitor
        enableMultiMonitor: false,
    },

    vnc: {
        viewOnly: false,           // Modo somente visualização
        defaultPort: 5900,
        colorDepth: 24,
        // Cursor
        cursorRemote: false,       // false = cursor local (melhor performance)
        // Multi-monitor VNC (experimental)
        enableMultiMonitor: false,
        monitorCount: 1,
    },

    ssh: {
        colorScheme: 'green-black',  // 'green-black', 'white-black', 'gray-black', etc.
        fontSize: 12,
        fontFamily: 'monospace',
        defaultPort: 22,
        // SFTP
        enableSftp: true,
        sftpRootDirectory: '/',
    }
};

// Mapeia modo de qualidade para configurações específicas
const QUALITY_PRESETS = {
    low: {
        colorDepth: 8,
        compression: 'high',
        enableWallpaper: false,
        enableTheming: false,
        enableFontSmoothing: false,
    },
    balanced: {
        colorDepth: 16,
        compression: 'medium',
        enableWallpaper: false,
        enableTheming: false,
        enableFontSmoothing: true,
    },
    high: {
        colorDepth: 24,
        compression: 'low',
        enableWallpaper: true,
        enableTheming: true,
        enableFontSmoothing: true,
    },
    lossless: {
        colorDepth: 32,
        compression: 'none',
        enableWallpaper: true,
        enableTheming: true,
        enableFontSmoothing: true,
        enableDesktopComposition: true,
    }
};

module.exports = {
    DEFAULT_CONFIG,
    QUALITY_PRESETS
};
