/**
 * SQLite Database Adapter
 * Unified SQLite adapter using better-sqlite3
 */

const DatabaseAdapter = require('./base.cjs');
const Database = require('better-sqlite3');
const logger = require('../../utils/logger.cjs');

class SQLiteAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.db = null;
  }

  async connect() {
    if (this.connected) {
      logger.warn('[SQLiteAdapter] Already connected');
      return;
    }

    try {
      const dbPath = this.config.path || './data/chatbox.db';
      logger.info(`[SQLiteAdapter] Connecting to: ${dbPath}`);

      this.db = new Database(dbPath, {
        verbose: this.config.verbose ? logger.debug.bind(logger) : null
      });

      // Set important pragmas for performance and reliability
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('busy_timeout = 5000');

      this.connected = true;
      logger.info('[SQLiteAdapter] Connected successfully');

    } catch (error) {
      logger.error('[SQLiteAdapter] Connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (!this.connected || !this.db) {
      return;
    }

    try {
      this.db.close();
      this.db = null;
      this.connected = false;
      logger.info('[SQLiteAdapter] Disconnected');
    } catch (error) {
      logger.error('[SQLiteAdapter] Disconnect error:', error);
      throw error;
    }
  }

  async query(sql, params = []) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(params);
    } catch (error) {
      logger.error('[SQLiteAdapter] Query error:', error);
      throw error;
    }
  }

  async execute(sql, params = []) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(params);

      return {
        affectedRows: result.changes,
        lastInsertId: result.lastInsertRowid
      };
    } catch (error) {
      logger.error('[SQLiteAdapter] Execute error:', error);
      throw error;
    }
  }

  async transaction(callback) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    const txn = this.db.transaction(callback);
    return txn();
  }

  getType() {
    return 'sqlite';
  }
}

module.exports = SQLiteAdapter;
