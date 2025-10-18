/**
 * SQL Server Database Adapter
 * Unified SQL Server adapter using mssql (node-mssql)
 */

const DatabaseAdapter = require('./base.cjs');
const sql = require('mssql');
const logger = require('../../utils/logger.cjs');

class SqlServerAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.pool = null;
    this.config = this.parseConfig(config);
  }

  /**
   * Parse connection config from URL or object
   * @param {Object|string} config - Connection config
   * @returns {Object} Parsed config
   */
  parseConfig(config) {
    // If config is already an object with connection details
    if (config.server || config.database) {
      return {
        server: config.server || 'localhost',
        port: config.port || 1433,
        database: config.database,
        user: config.user || config.username,
        password: config.password,
        options: {
          encrypt: config.encrypt !== false, // Default to true for security
          trustServerCertificate: config.trustServerCertificate !== false, // Default to true for local dev
          enableArithAbort: true,
          ...config.options
        },
        pool: {
          max: config.maxConnections || 20,
          min: config.minConnections || 2,
          idleTimeoutMillis: config.idleTimeout || 30000,
          ...config.pool
        }
      };
    }

    // If config has a URL string
    if (config.url) {
      return this.parseConnectionString(config.url);
    }

    throw new Error('Invalid SQL Server configuration');
  }

  /**
   * Parse SQL Server connection string
   * Format: mssql://username:password@server:port/database?encrypt=true
   * @param {string} url - Connection string
   * @returns {Object} Parsed config
   */
  parseConnectionString(url) {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);

      return {
        server: urlObj.hostname,
        port: urlObj.port ? parseInt(urlObj.port) : 1433,
        database: urlObj.pathname.slice(1), // Remove leading '/'
        user: decodeURIComponent(urlObj.username),
        password: decodeURIComponent(urlObj.password),
        options: {
          encrypt: params.get('encrypt') !== 'false',
          trustServerCertificate: params.get('trustServerCertificate') !== 'false',
          enableArithAbort: true
        },
        pool: {
          max: 20,
          min: 2,
          idleTimeoutMillis: 30000
        }
      };
    } catch (error) {
      logger.error('[SqlServerAdapter] Invalid connection string:', error);
      throw new Error('Invalid SQL Server connection string');
    }
  }

  async connect() {
    if (this.connected) {
      logger.warn('[SqlServerAdapter] Already connected');
      return;
    }

    try {
      logger.info('[SqlServerAdapter] Connecting to SQL Server...');
      logger.debug('[SqlServerAdapter] Config:', {
        server: this.config.server,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user
      });

      this.pool = await sql.connect(this.config);
      this.connected = true;

      logger.info('[SqlServerAdapter] Connected successfully');

      // Handle pool errors
      this.pool.on('error', (err) => {
        logger.error('[SqlServerAdapter] Pool error:', err);
        this.connected = false;
      });

    } catch (error) {
      logger.error('[SqlServerAdapter] Connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (!this.connected || !this.pool) {
      return;
    }

    try {
      await this.pool.close();
      this.pool = null;
      this.connected = false;
      logger.info('[SqlServerAdapter] Disconnected');
    } catch (error) {
      logger.error('[SqlServerAdapter] Disconnect error:', error);
      throw error;
    }
  }

  /**
   * Convert PostgreSQL/SQLite query to SQL Server syntax
   * @param {string} sqlQuery - Original SQL query
   * @returns {string} Converted SQL query
   */
  convertQuery(sqlQuery) {
    let converted = sqlQuery;

    // Replace RETURNING with OUTPUT INSERTED
    converted = converted.replace(
      /INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)\s*RETURNING\s+(\w+)/gi,
      'INSERT INTO $1 ($2) OUTPUT INSERTED.$4 VALUES ($3)'
    );

    // Replace PostgreSQL NOW() with GETDATE()
    converted = converted.replace(/NOW\(\)/gi, 'GETDATE()');

    // Replace PostgreSQL datetime('now') with GETDATE()
    converted = converted.replace(/datetime\s*\(\s*'now'\s*\)/gi, 'GETDATE()');

    // Replace CURRENT_TIMESTAMP (keep as is, SQL Server supports it)
    // converted = converted.replace(/CURRENT_TIMESTAMP/gi, 'GETDATE()');

    // Replace AUTOINCREMENT with IDENTITY
    converted = converted.replace(/AUTOINCREMENT/gi, 'IDENTITY(1,1)');

    // Replace SQLite's || concatenation with +
    // This is a simplified conversion, might need refinement
    // converted = converted.replace(/\|\|/g, '+');

    // Replace ILIKE with LIKE (case-insensitive in SQL Server by default)
    converted = converted.replace(/ILIKE/gi, 'LIKE');

    // Replace PostgreSQL LIMIT/OFFSET with TOP/OFFSET FETCH
    // LIMIT 10 OFFSET 5 -> OFFSET 5 ROWS FETCH NEXT 10 ROWS ONLY
    const limitOffsetRegex = /LIMIT\s+(\d+)\s+OFFSET\s+(\d+)/gi;
    converted = converted.replace(limitOffsetRegex, 'OFFSET $2 ROWS FETCH NEXT $1 ROWS ONLY');

    // LIMIT only (without OFFSET) -> TOP
    const limitOnlyRegex = /SELECT\s+/gi;
    const limitMatch = /LIMIT\s+(\d+)$/i.exec(converted);
    if (limitMatch && !converted.includes('OFFSET')) {
      converted = converted.replace(/LIMIT\s+\d+$/i, '');
      converted = converted.replace(limitOnlyRegex, 'SELECT TOP ' + limitMatch[1] + ' ');
    }

    return converted;
  }

  /**
   * Convert positional parameters ($1, $2) to named parameters (@p1, @p2)
   * @param {string} sqlQuery - SQL query with positional parameters
   * @param {Array} params - Parameter values
   * @returns {Object} { query, inputs }
   */
  convertParameters(sqlQuery, params = []) {
    let query = sqlQuery;
    const inputs = {};

    // Replace PostgreSQL-style $1, $2, etc. with SQL Server @p1, @p2
    params.forEach((param, index) => {
      const placeholder = `$${index + 1}`;
      const paramName = `p${index + 1}`;
      query = query.replace(new RegExp('\\' + placeholder + '\\b', 'g'), `@${paramName}`);
      inputs[paramName] = param;
    });

    return { query, inputs };
  }

  async query(sqlQuery, params = []) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    try {
      const converted = this.convertQuery(sqlQuery);
      const { query, inputs } = this.convertParameters(converted, params);

      logger.debug('[SqlServerAdapter] Executing query:', query);
      logger.debug('[SqlServerAdapter] Parameters:', inputs);

      const request = this.pool.request();

      // Add parameters to request
      Object.entries(inputs).forEach(([key, value]) => {
        request.input(key, value);
      });

      const result = await request.query(query);
      return result.recordset || [];

    } catch (error) {
      logger.error('[SqlServerAdapter] Query error:', error);
      logger.error('[SqlServerAdapter] Original query:', sqlQuery);
      logger.error('[SqlServerAdapter] Parameters:', params);
      throw error;
    }
  }

  async execute(sqlQuery, params = []) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    try {
      const converted = this.convertQuery(sqlQuery);
      const { query, inputs } = this.convertParameters(converted, params);

      logger.debug('[SqlServerAdapter] Executing command:', query);
      logger.debug('[SqlServerAdapter] Parameters:', inputs);

      const request = this.pool.request();

      // Add parameters to request
      Object.entries(inputs).forEach(([key, value]) => {
        request.input(key, value);
      });

      const result = await request.query(query);

      return {
        affectedRows: result.rowsAffected[0] || 0,
        lastInsertId: result.recordset && result.recordset[0] ? result.recordset[0].id : null
      };

    } catch (error) {
      logger.error('[SqlServerAdapter] Execute error:', error);
      logger.error('[SqlServerAdapter] Original query:', sqlQuery);
      logger.error('[SqlServerAdapter] Parameters:', params);
      throw error;
    }
  }

  async transaction(callback) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    const transaction = new sql.Transaction(this.pool);

    try {
      await transaction.begin();

      // Create a transaction-scoped adapter
      const txAdapter = {
        query: async (sqlQuery, params = []) => {
          const converted = this.convertQuery(sqlQuery);
          const { query, inputs } = this.convertParameters(converted, params);

          const request = new sql.Request(transaction);
          Object.entries(inputs).forEach(([key, value]) => {
            request.input(key, value);
          });

          const result = await request.query(query);
          return result.recordset || [];
        },
        execute: async (sqlQuery, params = []) => {
          const converted = this.convertQuery(sqlQuery);
          const { query, inputs } = this.convertParameters(converted, params);

          const request = new sql.Request(transaction);
          Object.entries(inputs).forEach(([key, value]) => {
            request.input(key, value);
          });

          const result = await request.query(query);
          return {
            affectedRows: result.rowsAffected[0] || 0,
            lastInsertId: result.recordset && result.recordset[0] ? result.recordset[0].id : null
          };
        }
      };

      const result = await callback(txAdapter);
      await transaction.commit();
      return result;

    } catch (error) {
      await transaction.rollback();
      logger.error('[SqlServerAdapter] Transaction error:', error);
      throw error;
    }
  }

  getType() {
    return 'sqlserver';
  }

  /**
   * Health check with SQL Server specific query
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      await this.query('SELECT 1 AS healthy');
      return true;
    } catch (error) {
      logger.error('[SqlServerAdapter] Health check failed:', error);
      return false;
    }
  }
}

module.exports = SqlServerAdapter;
