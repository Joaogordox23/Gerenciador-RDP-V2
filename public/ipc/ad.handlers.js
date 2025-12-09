// public/ipc/ad.handlers.js
// Handlers IPC para integração com Active Directory

const { ipcMain } = require('electron');
const ActiveDirectory = require('activedirectory2');

/**
 * Registra handlers IPC para Active Directory
 */
function registerAdHandlers() {

    // ==========================
    // BUSCA NO ACTIVE DIRECTORY
    // ==========================
    ipcMain.handle('ad-search', async (event, { url, baseDN, username, password }) => {
        console.log(`🔍 Iniciando busca no AD: ${url} (${baseDN})`);

        const config = {
            url,
            baseDN,
            username,
            password
        };

        return new Promise((resolve, reject) => {
            try {
                const ad = new ActiveDirectory(config);

                const searchOptions = {
                    filter: 'objectCategory=computer',
                    attributes: ['cn', 'name', 'sAMAccountName', 'dNSHostName', 'operatingSystem', 'description']
                };

                console.log('🔍 Executando busca no AD com opções:', JSON.stringify(searchOptions));

                ad.find(searchOptions, (err, results) => {
                    if (err) {
                        console.error('❌ Erro na busca do AD:', err);
                        reject(new Error(`Erro ao buscar no AD: ${err.message}`));
                        return;
                    }

                    if (!results) {
                        console.log('⚠️ Nenhum resultado retornado do AD.');
                        resolve([]);
                        return;
                    }

                    console.log('🔍 TIPO DO RETORNO ORIGINAL:', typeof results);
                    console.log('🔍 É ARRAY?', Array.isArray(results));

                    if (results && typeof results === 'object') {
                        console.log('🔍 CHAVES DO RETORNO:', Object.keys(results));
                    }

                    const resultsArray = normalizeAdResults(results);
                    console.log(`✅ Encontrados ${resultsArray.length} itens após normalização.`);

                    if (resultsArray.length === 0) {
                        console.log('⚠️ Nenhum computador encontrado no AD.');
                        resolve([]);
                        return;
                    }

                    if (resultsArray.length > 0) {
                        console.log('🔍 PRIMEIRO ITEM (Processado):', JSON.stringify(resultsArray[0], null, 2));
                    }

                    const computers = resultsArray.map(comp => {
                        if (!comp || typeof comp !== 'object') return null;

                        // Normaliza chaves
                        const normalized = {};
                        Object.keys(comp).forEach(key => {
                            normalized[key.toLowerCase()] = comp[key];
                        });

                        // Tenta obter o sAMAccountName
                        let netbiosName = normalized.samaccountname || '';
                        if (netbiosName && typeof netbiosName === 'string' && netbiosName.endsWith('$')) {
                            netbiosName = netbiosName.slice(0, -1);
                        }

                        const displayName = netbiosName || normalized.cn || normalized.name || normalized.dnshostname || 'Computador Sem Nome';
                        const address = normalized.dnshostname || displayName;

                        return {
                            name: displayName,
                            dnsName: address,
                            description: normalized.description || '',
                            os: normalized.operatingsystem || 'Windows'
                        };
                    }).filter(item => item !== null);

                    if (computers.length > 0) {
                        console.log('✅ EXEMPLO FINAL:', JSON.stringify(computers[0], null, 2));
                    }

                    resolve(computers);
                });
            } catch (error) {
                console.error('❌ Erro crítico ao inicializar AD:', error);
                reject(error);
            }
        });
    });

    console.log('✅ AD handlers registrados (1 handler)');
}

/**
 * Normaliza resultados do AD para array consistente
 */
function normalizeAdResults(data) {
    if (!data) return [];

    let arr = Array.isArray(data) ? data : (data.length !== undefined ? Array.from(data) : [data]);

    // Flatten recursivo para arrays aninhados
    while (arr.length > 0 && Array.isArray(arr[0])) {
        console.log('🔄 Flattening array aninhado...');
        arr = arr.flat();
    }

    // Inspeção de Wrapper Object
    if (arr.length === 1 && typeof arr[0] === 'object' && arr[0] !== null) {
        const item = arr[0];
        const potentialArrays = Object.values(item).filter(val => Array.isArray(val) && val.length > 0);

        if (potentialArrays.length === 1) {
            console.log('📦 Detectado objeto wrapper contendo array. Extraindo...');
            return potentialArrays[0];
        }
    }

    return arr;
}

module.exports = { registerAdHandlers };
