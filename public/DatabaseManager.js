/**
 * DatabaseManager.js
 * Gerenciador de banco de dados SQLite para conexões RDP/SSH/VNC
 * Usando better-sqlite3 para performance máxima
 */

const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbPath = null;
    }

    /**
     * Inicializa o banco de dados
     */
    initialize() {
        const documentsPath = app.getPath('documents');
        const appDir = path.join(documentsPath, 'GerenciadorRDP');
        this.dbPath = path.join(appDir, 'connections.db');

        console.log('📦 Inicializando SQLite em:', this.dbPath);

        // Cria diretório se não existir
        const fs = require('fs');
        if (!fs.existsSync(appDir)) {
            fs.mkdirSync(appDir, { recursive: true });
        }

        // Abre/cria o banco
        this.db = new Database(this.dbPath);

        // Otimizações de performance
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('synchronous = NORMAL');
        this.db.pragma('cache_size = 10000');
        this.db.pragma('foreign_keys = ON');

        // Cria tabelas
        this._createTables();

        console.log('✅ SQLite inicializado com sucesso!');
        return this;
    }

    /**
     * Cria as tabelas do banco
     */
    _createTables() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('rdp', 'vnc')),
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, type)
            );

            CREATE TABLE IF NOT EXISTS connections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                ip_address TEXT NOT NULL,
                port TEXT,
                protocol TEXT NOT NULL CHECK(protocol IN ('rdp', 'ssh', 'vnc')),
                username TEXT,
                password TEXT,
                domain TEXT,
                group_name TEXT,
                file_path TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_connections_group ON connections(group_id);
            CREATE INDEX IF NOT EXISTS idx_connections_protocol ON connections(protocol);
            CREATE INDEX IF NOT EXISTS idx_connections_name ON connections(name);

            -- ============================================
            -- TABELAS PARA APLICAÇÕES (Feature v4.3)
            -- ============================================
            
            -- Grupos de Aplicações
            CREATE TABLE IF NOT EXISTS app_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                icon TEXT,
                color TEXT DEFAULT '#00AF74',
                sort_order INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            -- Aplicações
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                type TEXT NOT NULL CHECK(type IN ('web', 'local')),
                path TEXT NOT NULL,
                icon TEXT,
                arguments TEXT,
                sort_order INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES app_groups(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_applications_group ON applications(group_id);
            CREATE INDEX IF NOT EXISTS idx_applications_type ON applications(type);
        `);
    }

    /**
     * Retorna todos os grupos com suas conexões
     * @param {string} type - 'rdp' ou 'vnc'
     */
    getAllGroups(type) {
        const startTime = Date.now();

        const groups = this.db.prepare(`
            SELECT id, name as groupName, type, created_at
            FROM groups
            WHERE type = ?
            ORDER BY name
        `).all(type);

        const connectionsStmt = this.db.prepare(`
            SELECT id, name, ip_address as ipAddress, port, protocol, 
                   username, password, domain, group_name as groupName
            FROM connections
            WHERE group_id = ?
        `);

        const result = groups.map(group => ({
            ...group,
            [type === 'vnc' ? 'connections' : 'servers']: connectionsStmt.all(group.id)
        }));

        console.log(`⚡ getAllGroups(${type}): ${result.length} grupos em ${Date.now() - startTime}ms`);
        return result;
    }

    /**
     * Adiciona um novo grupo
     */
    addGroup(name, type) {
        const stmt = this.db.prepare(`
            INSERT OR IGNORE INTO groups (name, type) VALUES (?, ?)
        `);
        const result = stmt.run(name, type);

        if (result.changes === 0) {
            // Grupo já existe, retorna o existente
            const existing = this.db.prepare(`
                SELECT id FROM groups WHERE name = ? AND type = ?
            `).get(name, type);
            return existing.id;
        }

        return result.lastInsertRowid;
    }

    /**
     * Atualiza nome de um grupo
     */
    updateGroup(groupId, newName) {
        const stmt = this.db.prepare(`
            UPDATE groups SET name = ? WHERE id = ?
        `);
        return stmt.run(newName, groupId);
    }

    /**
     * Remove um grupo e suas conexões
     */
    deleteGroup(groupId) {
        const stmt = this.db.prepare(`DELETE FROM groups WHERE id = ?`);
        return stmt.run(groupId);
    }

    /**
     * Busca um grupo pelo ID
     * @param {number} groupId - ID do grupo
     * @returns {Object|null} - Grupo encontrado ou null
     */
    getGroupById(groupId) {
        const stmt = this.db.prepare(`
            SELECT id, name, type, created_at as createdAt
            FROM groups 
            WHERE id = ?
        `);
        return stmt.get(groupId) || null;
    }

    /**
     * Adiciona uma nova conexão
     */
    addConnection(groupId, connectionData) {
        const stmt = this.db.prepare(`
            INSERT INTO connections 
            (group_id, name, ip_address, port, protocol, username, password, domain, group_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            groupId,
            connectionData.name,
            connectionData.ipAddress,
            connectionData.port || '',
            connectionData.protocol || 'rdp',
            connectionData.username || '',
            connectionData.password || '',
            connectionData.domain || '',
            connectionData.groupName || ''
        );

        console.log(`✅ Conexão adicionada: ${connectionData.name} (ID: ${result.lastInsertRowid})`);
        return result.lastInsertRowid;
    }

    /**
     * Atualiza uma conexão existente (OPERAÇÃO PONTUAL!)
     * ✅ OTIMIZAÇÃO: Retorna a conexão atualizada diretamente
     */
    updateConnection(connectionId, updatedData) {
        const startTime = Date.now();

        const stmt = this.db.prepare(`
            UPDATE connections 
            SET name = COALESCE(?, name),
                ip_address = COALESCE(?, ip_address),
                port = COALESCE(?, port),
                username = COALESCE(?, username),
                password = COALESCE(?, password),
                domain = COALESCE(?, domain),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        const result = stmt.run(
            updatedData.name,
            updatedData.ipAddress,
            updatedData.port,
            updatedData.username,
            updatedData.password,
            updatedData.domain,
            connectionId
        );

        console.log(`⚡ updateConnection(${connectionId}): ${Date.now() - startTime}ms`);

        // ✅ OTIMIZAÇÃO: Retorna a conexão atualizada diretamente (evita leitura extra no handler)
        if (result.changes > 0) {
            return { ...result, connection: this.getConnectionById(connectionId) };
        }
        return result;
    }

    /**
     * Remove uma conexão
     */
    deleteConnection(connectionId) {
        const stmt = this.db.prepare(`DELETE FROM connections WHERE id = ?`);
        return stmt.run(connectionId);
    }

    /**
     * Busca conexões por termo (nome ou IP)
     * ✅ CORREÇÃO: Retorna campos em camelCase para compatibilidade com o frontend
     */
    searchConnections(term, protocol = null) {
        const searchTerm = `%${term}%`;

        let query = `
            SELECT c.id, c.name, c.ip_address as ipAddress, c.port, c.protocol,
                   c.username, c.password, c.domain, c.group_id as groupId,
                   c.group_name as groupName, g.name as groupDisplayName
            FROM connections c
            JOIN groups g ON c.group_id = g.id
            WHERE (c.name LIKE ? OR c.ip_address LIKE ?)
        `;

        const params = [searchTerm, searchTerm];

        if (protocol) {
            query += ` AND c.protocol = ?`;
            params.push(protocol);
        }

        return this.db.prepare(query).all(...params);
    }

    /**
     * Verifica se uma conexão existe (para evitar duplicatas)
     */
    connectionExists(name, groupId) {
        const stmt = this.db.prepare(`
            SELECT id FROM connections WHERE name = ? AND group_id = ?
        `);
        return stmt.get(name, groupId) !== undefined;
    }

    /**
     * Busca conexão por nome e IP em QUALQUER grupo do mesmo tipo
     * Usado para evitar duplicação na sincronização do disco
     * @param {string} name - Nome da conexão
     * @param {string} ipAddress - Endereço IP
     * @param {string} type - Tipo (rdp ou vnc)
     * @returns {Object|null} - Conexão encontrada ou null
     */
    findConnectionByNameAndIp(name, ipAddress, type) {
        const protocol = type === 'vnc' ? 'vnc' : 'rdp';
        const stmt = this.db.prepare(`
            SELECT c.id, c.name, c.ip_address as ipAddress, c.group_name as groupName
            FROM connections c
            JOIN groups g ON c.group_id = g.id
            WHERE c.name = ? AND c.ip_address = ? AND g.type = ?
        `);
        return stmt.get(name, ipAddress, protocol) || null;
    }

    /**
     * Obtém uma conexão por ID
     * ✅ CORREÇÃO: Retorna campos em camelCase para compatibilidade com o frontend
     */
    getConnectionById(connectionId) {
        const stmt = this.db.prepare(`
            SELECT c.id, c.name, c.ip_address as ipAddress, c.port, c.protocol,
                   c.username, c.password, c.domain, c.group_id as groupId,
                   c.group_name as groupName, g.name as groupDisplayName, g.type as groupType
            FROM connections c
            JOIN groups g ON c.group_id = g.id
            WHERE c.id = ?
        `);
        return stmt.get(connectionId);
    }

    /**
     * Migra dados do formato antigo (electron-store) para SQLite
     * @param {Array} groups - Grupos RDP/SSH do electron-store
     * @param {Array} vncGroups - Grupos VNC do electron-store
     */
    migrateFromStore(groups, vncGroups) {
        console.log('🔄 Iniciando migração para SQLite...');
        const startTime = Date.now();

        // Usa transação para performance
        const migrate = this.db.transaction(() => {
            let totalConnections = 0;

            // Migra grupos RDP/SSH
            if (groups && groups.length > 0) {
                groups.forEach(group => {
                    const groupId = this.addGroup(group.groupName || group.name, 'rdp');

                    const servers = group.servers || [];
                    servers.forEach(server => {
                        if (!this.connectionExists(server.name, groupId)) {
                            this.addConnection(groupId, {
                                ...server,
                                protocol: server.protocol || 'rdp',
                                groupName: group.groupName || group.name
                            });
                            totalConnections++;
                        }
                    });
                });
            }

            // Migra grupos VNC
            if (vncGroups && vncGroups.length > 0) {
                vncGroups.forEach(group => {
                    const groupId = this.addGroup(group.groupName || group.name, 'vnc');

                    const connections = group.connections || [];
                    connections.forEach(conn => {
                        if (!this.connectionExists(conn.name, groupId)) {
                            this.addConnection(groupId, {
                                ...conn,
                                protocol: 'vnc',
                                groupName: group.groupName || group.name
                            });
                            totalConnections++;
                        }
                    });
                });
            }

            return totalConnections;
        });

        const totalMigrated = migrate();
        console.log(`✅ Migração concluída: ${totalMigrated} conexões em ${Date.now() - startTime}ms`);

        return totalMigrated;
    }

    /**
     * Sincroniza conexões do disco para o SQLite (importa novos arquivos)
     * @param {Array} diskServers - Lista de servidores encontrados no disco pelo FileSystemManager
     * @returns {Object} - { imported: number, skipped: number }
     */
    syncFromDisk(diskServers) {
        console.log(`🔄 Iniciando sincronização do disco: ${diskServers.length} arquivos encontrados`);
        const startTime = Date.now();

        let imported = 0;
        let skipped = 0;

        const sync = this.db.transaction(() => {
            diskServers.forEach(server => {
                const type = server.protocol === 'vnc' ? 'vnc' : 'rdp';
                const groupName = server.groupName || 'Sem Grupo';

                // ✅ CORREÇÃO: Verifica se a conexão já existe em QUALQUER grupo
                // Isso evita criar duplicatas quando arquivos estão na pasta "Sem Grupo"
                // mas a conexão já existe em outro grupo no banco
                const existingConnection = this.findConnectionByNameAndIp(server.name, server.ipAddress, type);

                if (existingConnection) {
                    console.log(`  ⏭️ Pulando: ${server.name} (${server.ipAddress}) - já existe no grupo "${existingConnection.groupName}"`);
                    skipped++;
                    return; // Pula para o próximo servidor
                }

                // Obtém ou cria o grupo
                const groupId = this.addGroup(groupName, type);

                // Log para debug
                console.log(`  📂 Processando: ${server.name} -> Grupo "${groupName}" (ID: ${groupId}, Tipo: ${type})`);

                // Verifica se a conexão já existe no mesmo grupo
                const exists = this.connectionExists(server.name, groupId);
                console.log(`     Existe no grupo? ${exists ? 'SIM' : 'NÃO'}`);

                if (!exists) {
                    this.addConnection(groupId, {
                        ...server,
                        protocol: server.protocol || 'rdp',
                        groupName: groupName
                    });
                    imported++;
                    console.log(`     ✅ Importado: ${server.name} (${server.protocol}) -> ${groupName}`);
                } else {
                    skipped++;
                }
            });
        });

        sync();

        const duration = Date.now() - startTime;
        console.log(`✅ Sincronização concluída em ${duration}ms: ${imported} importados, ${skipped} já existentes`);

        return { imported, skipped };
    }

    /**
     * Verifica se o banco já foi migrado
     */
    isMigrated() {
        const count = this.db.prepare(`SELECT COUNT(*) as count FROM connections`).get();
        return count.count > 0;
    }

    /**
     * Fecha a conexão com o banco
     */
    close() {
        if (this.db) {
            this.db.close();
            console.log('🔒 SQLite fechado');
        }
    }

    /**
     * Estatísticas do banco
     */
    getStats() {
        const groups = this.db.prepare(`SELECT COUNT(*) as count FROM groups`).get();
        const connections = this.db.prepare(`SELECT COUNT(*) as count FROM connections`).get();
        const byProtocol = this.db.prepare(`
            SELECT protocol, COUNT(*) as count FROM connections GROUP BY protocol
        `).all();

        return {
            totalGroups: groups.count,
            totalConnections: connections.count,
            byProtocol: byProtocol.reduce((acc, row) => {
                acc[row.protocol] = row.count;
                return acc;
            }, {})
        };
    }

    /**
     * Obtém o timestamp da última sincronização
     * @returns {string|null} - ISO timestamp ou null
     */
    getLastSyncTime() {
        try {
            const result = this.db.prepare(`
                SELECT value FROM metadata WHERE key = 'last_sync_time'
            `).get();
            return result ? result.value : null;
        } catch (error) {
            console.error('Erro ao obter última sincronização:', error);
            return null;
        }
    }

    /**
     * Define o timestamp da última sincronização
     * @param {string} timestamp - ISO timestamp
     */
    setLastSyncTime(timestamp = new Date().toISOString()) {
        try {
            this.db.prepare(`
                INSERT OR REPLACE INTO metadata (key, value, updated_at) 
                VALUES ('last_sync_time', ?, CURRENT_TIMESTAMP)
            `).run(timestamp);
            console.log(`✅ Última sincronização registrada: ${timestamp}`);
        } catch (error) {
            console.error('Erro ao salvar última sincronização:', error);
        }
    }

    // ============================================
    // APLICAÇÕES - CRUD (Feature v4.3)
    // ============================================

    /**
     * Retorna todos os grupos de aplicações com suas apps
     * @returns {Array} - Lista de grupos com aplicações
     */
    getAppGroups() {
        const groups = this.db.prepare(`
            SELECT id, name, icon, color, sort_order as sortOrder, created_at as createdAt
            FROM app_groups
            ORDER BY sort_order ASC, name ASC
        `).all();

        // Busca aplicações para cada grupo
        return groups.map(group => ({
            ...group,
            apps: this.getAppsByGroupId(group.id)
        }));
    }

    /**
     * Busca aplicações de um grupo específico
     * @param {number} groupId - ID do grupo
     * @returns {Array}
     */
    getAppsByGroupId(groupId) {
        return this.db.prepare(`
            SELECT id, group_id as groupId, name, description, type, path,
                   icon, arguments, sort_order as sortOrder, created_at as createdAt
            FROM applications
            WHERE group_id = ?
            ORDER BY sort_order ASC, name ASC
        `).all(groupId);
    }

    /**
     * Adiciona um grupo de aplicações
     * @param {Object} data - { name, icon?, color? }
     * @returns {number} - ID do grupo criado
     */
    addAppGroup(data) {
        const stmt = this.db.prepare(`
            INSERT INTO app_groups (name, icon, color, sort_order)
            VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM app_groups))
        `);
        const result = stmt.run(data.name, data.icon || null, data.color || '#00AF74');
        console.log(`✅ Grupo de apps criado: ${data.name} (ID: ${result.lastInsertRowid})`);
        return result.lastInsertRowid;
    }

    /**
     * Atualiza um grupo de aplicações
     * @param {number} groupId 
     * @param {Object} data - { name?, icon?, color? }
     */
    updateAppGroup(groupId, data) {
        const stmt = this.db.prepare(`
            UPDATE app_groups 
            SET name = COALESCE(?, name),
                icon = COALESCE(?, icon),
                color = COALESCE(?, color)
            WHERE id = ?
        `);
        return stmt.run(data.name, data.icon, data.color, groupId);
    }

    /**
     * Remove um grupo de aplicações (cascade deleta as apps)
     * @param {number} groupId 
     */
    deleteAppGroup(groupId) {
        const stmt = this.db.prepare(`DELETE FROM app_groups WHERE id = ?`);
        return stmt.run(groupId);
    }

    /**
     * Obtém uma aplicação por ID
     * @param {number} appId 
     * @returns {Object|null}
     */
    getAppById(appId) {
        return this.db.prepare(`
            SELECT id, group_id as groupId, name, description, type, path,
                   icon, arguments, sort_order as sortOrder, created_at as createdAt
            FROM applications
            WHERE id = ?
        `).get(appId);
    }

    /**
     * Adiciona uma aplicação
     * @param {number} groupId 
     * @param {Object} data - { name, description?, type, path, icon?, arguments? }
     * @returns {number} - ID da aplicação criada
     */
    addApp(groupId, data) {
        const stmt = this.db.prepare(`
            INSERT INTO applications (group_id, name, description, type, path, icon, arguments, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM applications WHERE group_id = ?))
        `);
        const result = stmt.run(
            groupId,
            data.name,
            data.description || null,
            data.type,
            data.path,
            data.icon || null,
            data.arguments || null,
            groupId
        );
        console.log(`✅ Aplicação criada: ${data.name} (ID: ${result.lastInsertRowid})`);
        return result.lastInsertRowid;
    }

    /**
     * Atualiza uma aplicação
     * @param {number} appId 
     * @param {Object} data 
     */
    updateApp(appId, data) {
        const stmt = this.db.prepare(`
            UPDATE applications 
            SET name = COALESCE(?, name),
                description = COALESCE(?, description),
                type = COALESCE(?, type),
                path = COALESCE(?, path),
                icon = COALESCE(?, icon),
                arguments = COALESCE(?, arguments),
                group_id = COALESCE(?, group_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        return stmt.run(
            data.name,
            data.description,
            data.type,
            data.path,
            data.icon,
            data.arguments,
            data.groupId,
            appId
        );
    }

    /**
     * Remove uma aplicação
     * @param {number} appId 
     */
    deleteApp(appId) {
        const stmt = this.db.prepare(`DELETE FROM applications WHERE id = ?`);
        return stmt.run(appId);
    }

    // ==========================
    // ORDENAÇÃO DE APPS/GRUPOS
    // ==========================

    /**
     * Atualiza a ordem das aplicações dentro de um grupo
     * @param {Array} appOrders - Array de { id, order } onde order é a nova posição (0-based)
     */
    updateAppsOrder(appOrders) {
        const stmt = this.db.prepare(`UPDATE applications SET sort_order = ? WHERE id = ?`);

        const updateAll = this.db.transaction((orders) => {
            orders.forEach(({ id, order }) => {
                stmt.run(order, id);
            });
        });

        updateAll(appOrders);
        console.log(`🔄 Ordem de ${appOrders.length} apps atualizada`);
    }

    /**
     * Atualiza a ordem dos grupos de aplicações
     * @param {Array} groupOrders - Array de { id, order } onde order é a nova posição (0-based)
     */
    updateAppGroupsOrder(groupOrders) {
        const stmt = this.db.prepare(`UPDATE app_groups SET sort_order = ? WHERE id = ?`);

        const updateAll = this.db.transaction((orders) => {
            orders.forEach(({ id, order }) => {
                stmt.run(order, id);
            });
        });

        updateAll(groupOrders);
        console.log(`🔄 Ordem de ${groupOrders.length} grupos atualizada`);
    }
}

module.exports = new DatabaseManager();

