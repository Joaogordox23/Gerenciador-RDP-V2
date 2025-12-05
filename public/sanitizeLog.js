// sanitizeLog.js - Função de segurança para sanitização de logs
// Proteção contra exposição acidental de senhas, tokens e outros dados sensíveis

/**
 * Remove dados sensíveis de objetos antes de logar
 * @param {any} data - Dados a serem sanitizados
 * @returns {any} - Dados sanitizados com campos sensíveis substituídos por [REDACTED]
 */
function sanitizeLog(data) {
    if (!data) return data;

    // Se for string, retorna como está (não contém objetos)
    if (typeof data === 'string') return data;

    // Se for array, sanitiza cada elemento
    if (Array.isArray(data)) {
        return data.map(item => sanitizeLog(item));
    }

    // Se for objeto, cria cópia e substitui campos sensíveis
    if (typeof data === 'object') {
        try {
            const sanitized = JSON.parse(JSON.stringify(data, (key, value) => {
                // Lista de campos sensíveis (case-insensitive)
                const sensitiveFields = ['password', 'passwd', 'pwd', 'token', 'secret', 'apikey', 'api_key', 'auth'];

                if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                    return '[REDACTED]';
                }

                return value;
            }));
            return sanitized;
        } catch (error) {
            // Se falhar ao serializar, retorna string genérica
            return '[DATA_TOO_COMPLEX_TO_SANITIZE]';
        }
    }

    return data;
}

module.exports = { sanitizeLog };
