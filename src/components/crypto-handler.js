// crypto-handler.js - VERSÃO SEGURA COM CHAVE DINÂMICA

const crypto = require('crypto');
const { app } = require('electron');
const Store = require('electron-store');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES sempre usa IV de 16 bytes

/**
 * Gera ou recupera uma chave secreta armazenada de forma segura
 * A chave é gerada apenas uma vez e reutilizada para manter a consistência
 * @returns {Buffer} - Chave secreta de 32 bytes (256 bits)
 */
function getOrGenerateSecretKey() {
    const store = new Store({ 
        name: 'security-config',
        encryptionKey: 'gerenciador-rdp-security-v2'
    });
    
    let secretKey = store.get('masterEncryptionKey');
    
    if (!secretKey) {
        // Gera uma chave aleatória de 256 bits (32 bytes)
        const keyBuffer = crypto.randomBytes(32);
        secretKey = keyBuffer.toString('base64');
        
        store.set('masterEncryptionKey', secretKey);
        console.log('🔐 Nova chave mestra de criptografia gerada e armazenada com segurança');
        
        // Adiciona timestamp de criação para auditoria
        store.set('keyGeneratedAt', new Date().toISOString());
    }
    
    return Buffer.from(secretKey, 'base64');
}

// Chave secreta gerenciada de forma segura
const SECRET_KEY = getOrGenerateSecretKey();

/**
 * Criptografa uma senha usando AES-256-CBC com IV aleatório
 * @param {string} text - A senha em texto plano
 * @returns {string} - A senha criptografada (IV + dados criptografados em base64)
 * @throws {Error} - Se houver erro na criptografia
 */
function criptografar(text) {
    try {
        // Validação de entrada
        if (!text || typeof text !== 'string') {
            throw new Error('Texto para criptografia deve ser uma string válida e não vazia');
        }

        if (text.length > 1000) {
            throw new Error('Texto muito longo para criptografia (máximo 1000 caracteres)');
        }

        // Gera um IV aleatório para cada operação de criptografia
        const iv = crypto.randomBytes(IV_LENGTH);
        
        // Cria o cipher com algoritmo, chave e IV
        const cipher = crypto.createCipher(ALGORITHM, SECRET_KEY, iv);
        
        // Criptografa o texto
        let encrypted = cipher.update(text, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        // Retorna IV + dados criptografados em base64, separados por ':'
        // Formato: "IV_base64:ENCRYPTED_DATA_base64"
        return iv.toString('base64') + ':' + encrypted.toString('base64');
        
    } catch (error) {
        console.error('Erro durante criptografia:', error.message);
        throw new Error(`Falha na criptografia de dados: ${error.message}`);
    }
}

/**
 * Descriptografa uma senha usando AES-256-CBC
 * @param {string} encryptedText - Texto criptografado no formato "IV:dados"
 * @returns {string} - A senha em texto plano
 * @throws {Error} - Se houver erro na descriptografia
 */
function descriptografar(encryptedText) {
    try {
        // Validação de entrada
        if (!encryptedText || typeof encryptedText !== 'string') {
            throw new Error('Texto criptografado deve ser uma string válida');
        }

        // Separa IV dos dados criptografados
        const parts = encryptedText.split(':');
        if (parts.length !== 2) {
            throw new Error('Formato de dados criptografados inválido (esperado IV:dados)');
        }

        const iv = Buffer.from(parts[0], 'base64');
        const encryptedData = Buffer.from(parts[1], 'base64');
        
        // Valida tamanho do IV
        if (iv.length !== IV_LENGTH) {
            throw new Error(`IV com tamanho inválido: ${iv.length}, esperado: ${IV_LENGTH}`);
        }
        
        // Cria o decipher
        const decipher = crypto.createDecipher(ALGORITHM, SECRET_KEY, iv);
        
        // Descriptografa
        let decrypted = decipher.update(encryptedData);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        const result = decrypted.toString('utf8');
        
        // Validação básica do resultado
        if (!result) {
            throw new Error('Resultado da descriptografia está vazio');
        }
        
        return result;
        
    } catch (error) {
        console.error('Erro durante descriptografia:', error.message);
        throw new Error(`Falha na descriptografia de dados: ${error.message}`);
    }
}

/**
 * Testa se o sistema de criptografia está funcionando corretamente
 * @returns {boolean} - True se o teste passou, false caso contrário
 */
function testarCriptografia() {
    try {
        const textoTeste = 'senha-teste-123!@#$%^&*()';
        const criptografado = criptografar(textoTeste);
        const descriptografado = descriptografar(criptografado);
        
        const testePassed = textoTeste === descriptografado;
        
        if (testePassed) {
            console.log('✅ Sistema de criptografia validado com sucesso');
            
            // Teste adicional com caracteres especiais
            const textoEspecial = 'Teste çãéá "aspas" \'apostrofes\' |pipes| &ampersand;';
            const criptEspecial = criptografar(textoEspecial);
            const descriptEspecial = descriptografar(criptEspecial);
            
            if (textoEspecial === descriptEspecial) {
                console.log('✅ Teste de caracteres especiais passou');
                return true;
            } else {
                console.error('❌ Falha no teste de caracteres especiais');
                return false;
            }
        } else {
            console.error('❌ Falha na validação básica do sistema de criptografia');
            console.error('Esperado:', textoTeste);
            console.error('Recebido:', descriptografado);
            return false;
        }
    } catch (error) {
        console.error('❌ Erro na validação da criptografia:', error.message);
        return false;
    }
}

/**
 * Migra senhas de um sistema de criptografia antigo (se necessário)
 * @param {string} oldEncryptedText - Texto no formato antigo
 * @returns {string} - Texto no novo formato
 */
function migrarCriptografia(oldEncryptedText) {
    try {
        // Tenta descriptografar no formato antigo (hex)
        const textParts = oldEncryptedText.split(':');
        if (textParts.length === 2) {
            // Formato antigo detectado
            const iv = Buffer.from(textParts[0], 'hex');
            const encryptedData = Buffer.from(textParts[1], 'hex');
            
            if (iv.length === IV_LENGTH) {
                const decipher = crypto.createDecipher(ALGORITHM, SECRET_KEY, iv);
                let decrypted = decipher.update(encryptedData);
                decrypted = Buffer.concat([decrypted, decipher.final()]);
                
                // Re-criptografa no novo formato
                return criptografar(decrypted.toString('utf8'));
            }
        }
        
        // Se não conseguir migrar, retorna o original
        return oldEncryptedText;
    } catch (error) {
        console.warn('Não foi possível migrar criptografia antiga:', error.message);
        return oldEncryptedText;
    }
}

/**
 * Obtém informações sobre o sistema de criptografia (para debug/auditoria)
 * @returns {Object} - Informações do sistema
 */
function obterInfoCriptografia() {
    const store = new Store({ 
        name: 'security-config',
        encryptionKey: 'gerenciador-rdp-security-v2'
    });
    
    return {
        algoritmo: ALGORITHM,
        tamanhoChave: SECRET_KEY.length * 8, // em bits
        tamanhoIV: IV_LENGTH,
        chaveGeradaEm: store.get('keyGeneratedAt') || 'Não disponível',
        versao: '2.0'
    };
}

// Exporta as funções
module.exports = {
    criptografar,
    descriptografar,
    testarCriptografia,
    migrarCriptografia,
    obterInfoCriptografia
};

// Auto-teste na inicialização (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV) {
    console.log('🔐 Inicializando sistema de criptografia seguro...');
    
    const testePassed = testarCriptografia();
    if (!testePassed) {
        console.error('⚠️  ATENÇÃO: Sistema de criptografia falhou no auto-teste!');
    }
    
    // Exibe informações do sistema (apenas em dev)
    const info = obterInfoCriptografia();
    console.log('📊 Info do sistema de criptografia:', info);
}

// Log de inicialização
console.log('🛡️  Crypto-handler carregado com chave dinâmica segura');