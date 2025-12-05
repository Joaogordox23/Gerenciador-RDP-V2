// validateIPAddress.js - Validação de IP/Hostname para prevenir command injection
// Use este método no início do testServerConnectivity em ConnectivityTester.js

/**
 * Valida IP/hostname para prevenir command injection
 * @param {string} address - Endereço IP ou hostname
 * @returns {boolean} - true se válido
 * @throws {Error} - Se endereço contém caracteres inválidos
 */
function validateIPAddress(address) {
    if (!address || typeof address !== 'string') {
        throw new Error('Endereço IP/hostname inválido: valor vazio ou não é string');
    }

    // Regex para validar IPv4, IPv6 ou hostname válido
    // Permite apenas: letras, números, pontos, hífens, dois pontos (IPv6)
    const safePattern = /^[a-zA-Z0-9.:-]+$/;

    if (!safePattern.test(address)) {
        throw new Error(
            `Endereço IP/hostname contém caracteres inválidos: "${address}". ` +
            'Apenas letras, números, pontos, hífens e dois pontos são permitidos.'
        );
    }

    // Verifica caracteres perigosos para command injection
    const dangerousChars = [';', '&', '|', '$', '`', '(', ')', '<', '>', '\n', '\r'];
    for (const char of dangerousChars) {
        if (address.includes(char)) {
            throw new Error(
                `Endereço IP/hostname contém caractere perigoso: "${char}". ` +
                'Possível tentativa de command injection detectada.'
            );
        }
    }

    return true;
}

module.exports = { validateIPAddress };

// INSTRUÇÕES DE USO:
// 1. Adicione este import no topo de ConnectivityTester.js:
//    const { validateIPAddress } = require('./validateIPAddress');
//
// 2. No método testServerConnectivity, após a linha 54, adicione:
//    // SEGURANÇA: Valida IP/hostname antes de usar em comandos
//    validateIPAddress(serverInfo.ipAddress);
