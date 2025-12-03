import { createTheme } from '@mui/material/styles';

// Definição das cores baseadas no App.css (NexTI Brand)
const themeColors = {
    light: {
        primary: '#00af74', // --color-teal-500
        secondary: 'rgba(94, 82, 64, 0.12)', // --color-secondary
        background: '#fcfcf9', // --color-cream-50
        paper: '#fffffd', // --color-cream-100
        textPrimary: '#13343b', // --color-slate-900
        textSecondary: '#626c71', // --color-slate-500
        error: '#c0152f', // --color-red-500
        success: '#00af74', // --color-teal-500
        warning: '#a84b2f', // --color-orange-500
    },
    dark: {
        primary: 'rgb(0, 252, 168)', // --color-teal-300
        secondary: 'rgba(119, 124, 124, 0.15)', // --color-secondary (dark)
        background: '#1f2121', // --color-charcoal-700
        paper: '#262828', // --color-charcoal-800
        textPrimary: '#f5f5f5', // --color-gray-200
        textSecondary: 'rgba(167, 169, 169, 0.7)', // --color-gray-300 (alpha)
        error: '#ff5459', // --color-red-400
        success: '#00af74', // --color-teal-300
        warning: '#e68161', // --color-orange-400
    }
};

export const getTheme = (mode) => {
    const colors = themeColors[mode];

    return createTheme({
        palette: {
            mode,
            primary: {
                main: colors.primary,
            },
            secondary: {
                main: colors.secondary, // Nota: secondary no MUI espera uma cor sólida geralmente, mas vamos tentar manter a consistência
            },
            background: {
                default: colors.background,
                paper: colors.paper,
            },
            text: {
                primary: colors.textPrimary,
                secondary: colors.textSecondary,
            },
            error: {
                main: colors.error,
            },
            success: {
                main: colors.success,
            },
            warning: {
                main: colors.warning,
            },
        },
        typography: {
            fontFamily: '"FKGroteskNeue", "Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            h1: { fontWeight: 600 },
            h2: { fontWeight: 600 },
            h3: { fontWeight: 600 },
            button: { fontWeight: 550, textTransform: 'none' },
        },
        shape: {
            borderRadius: 8, // --radius-base
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: colors.background,
                        color: colors.textPrimary,
                        transition: 'background-color 0.3s ease, color 0.3s ease',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: 'none',
                        },
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none', // Remove overlay padrão do MUI em dark mode
                    },
                },
            },
        },
    });
};
