/**
 * PostgreSQL Database Adapter
 * Unified PostgreSQL adapter using pg (node-postgres)
 */

const DatabaseAdapter = require('./base.cjs');
const { Pool } = require('pg');
const logger = require('../../utils/logger.cjs');

class PostgresAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.pool = null;
  }

  async connect() {
    if (this.connected) {
      logger.warn('[PostgresAdapter] Already connected');
      return;
    }

    try {
      logger.info('[PostgresAdapter] Connecting to PostgreSQL...');

      this.pool = new Pool({
        connectionString: this.config.url,
        max: this.config.maxConnections || 20,
        idleTimeoutMillis: this.config.idleTimeout || 30000,
        connectionTimeoutMillis: this.config.connectionTimeout || 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      this.connected = true;
      logger.info('[PostgresAdapter] Connected successfully');

      // Handle pool errors
      this.pool.on('error', (err) => {
        logger.error('[PostgresAdapter] Pool error:', err);
      });

    } catch (error) {
      logger.error('[PostgresAdapter] Connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (!this.connected || !this.pool) {
      return;
    }

    try {
      await this.pool.end();
      this.pool = null;
      this.connected = false;
      logger.info('[PostgresAdapter] Disconnected');
    } catch (error) {
      logger.error('[PostgresAdapter] Disconnect error:', error);
      throw error;
    }
  }

  async query(sql, params = []) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } catch (error) {
      logger.error('[PostgresAdapter] Query error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async execute(sql, params = []) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);

      return {
        affectedRows: result.rowCount,
        lastInsertId: result.rows[0]?.id // PostgreSQL returns inserted row
      };
    } catch (error) {
      logger.error('[PostgresAdapter] Execute error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async transaction(callback) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await callback(client);

      await client.query('COMMIT');
      return result;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[PostgresAdapter] Transaction error:', error);
      throw error;

    } finally {
      client.release();
    }
  }

  getType() {
    return 'postgres';
  }
}

module.exports = PostgresAdapter;
