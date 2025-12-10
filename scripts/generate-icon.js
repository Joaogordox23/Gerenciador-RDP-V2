const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const publicDir = path.join(__dirname, '..', 'public');
const buildDir = path.join(__dirname, '..', 'build');
const svgPath = path.join(assetsDir, 'icon.svg');

// Tamanhos para o ícone ICO (Windows requer múltiplas resoluções)
const icoSizes = [16, 24, 32, 48, 64, 128, 256];

// Tamanhos para PWA/Web
const pngSizes = [192, 512];

async function generateIcons() {
    console.log('🎨 Gerando ícones de alta qualidade...\n');

    // Verificar se o SVG existe
    if (!fs.existsSync(svgPath)) {
        console.error('❌ Arquivo icon.svg não encontrado em assets/');
        process.exit(1);
    }

    try {
        // Gerar PNGs para o ICO
        console.log('📐 Gerando PNGs em múltiplas resoluções...');
        const pngBuffers = [];

        for (const size of icoSizes) {
            const buffer = await sharp(svgPath, { density: 300 })
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png()
                .toBuffer();

            pngBuffers.push(buffer);
            console.log(`   ✓ ${size}x${size}px`);
        }

        // Gerar ICO com todas as resoluções
        console.log('\n🔧 Gerando arquivo ICO...');
        const icoBuffer = await toIco(pngBuffers);

        // Salvar em assets/
        const icoPath = path.join(assetsDir, 'icon.ico');
        fs.writeFileSync(icoPath, icoBuffer);
        console.log(`   ✓ Salvo em: assets/icon.ico (${(icoBuffer.length / 1024).toFixed(1)} KB)`);

        // Gerar PNGs para web/PWA
        console.log('\n🌐 Gerando ícones para web...');
        for (const size of pngSizes) {
            const pngPath = path.join(publicDir, `logo${size}.png`);
            await sharp(svgPath, { density: 300 })
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png()
                .toFile(pngPath);
            console.log(`   ✓ logo${size}.png`);
        }

        // Gerar favicon.ico para public/
        console.log('\n📁 Copiando favicon para public/...');
        const faviconPath = path.join(publicDir, 'favicon.ico');
        fs.copyFileSync(icoPath, faviconPath);
        console.log(`   ✓ Copiado para: public/favicon.ico`);

        // Copiar para build/ se existir
        if (fs.existsSync(buildDir)) {
            console.log('\n📁 Copiando para build/...');
            fs.copyFileSync(icoPath, path.join(buildDir, 'favicon.ico'));
            for (const size of pngSizes) {
                fs.copyFileSync(
                    path.join(publicDir, `logo${size}.png`),
                    path.join(buildDir, `logo${size}.png`)
                );
            }
            console.log('   ✓ Arquivos copiados para build/');
        }

        console.log('\n✅ Ícones gerados com sucesso!');
        console.log('\n📋 Arquivos gerados:');
        console.log('   • assets/icon.ico (ícone do app Windows)');
        console.log('   • public/favicon.ico (favicon do navegador)');
        console.log('   • public/logo192.png (PWA)');
        console.log('   • public/logo512.png (PWA)');
        console.log('\n💡 Rebuild a aplicação para aplicar o novo ícone.');

    } catch (error) {
        console.error('❌ Erro ao gerar ícones:', error.message);
        process.exit(1);
    }
}

generateIcons();
