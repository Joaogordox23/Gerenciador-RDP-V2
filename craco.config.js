// craco.config.js
// Configuração CRACO para sobrescrever PostCSS do Create React App
// Necessário para Tailwind CSS funcionar com CRA

module.exports = {
    style: {
        postcss: {
            mode: 'extends',
            loaderOptions: {
                postcssOptions: {
                    ident: 'postcss',
                    plugins: [
                        require('tailwindcss'),
                        require('autoprefixer'),
                    ],
                },
            },
        },
    },
};
