/**
 * Base Database Adapter
 * Unified interface for all database adapters
 * Following optimization recommendations to eliminate adapter confusion
 */

class DatabaseAdapter {
  constructor(config) {
    this.config = config;
    this.connected = false;
  }

  /**
   * Connect to database
   * Must be implemented by child classes
   */
  async connect() {
    throw new Error('connect() must be implemented by database adapter');
  }

  /**
   * Disconnect from database
   * Must be implemented by child classes
   */
  async disconnect() {
    throw new Error('disconnect() must be implemented by database adapter');
  }

  /**
   * Execute a query and return rows
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Query results
   */
  async query(sql, params = []) {
    throw new Error('query() must be implemented by database adapter');
  }

  /**
   * Execute a command (INSERT, UPDATE, DELETE)
   * @param {string} sql - SQL command
   * @param {Array} params - Command parameters
   * @returns {Promise<Object>} Execution result with affectedRows, lastInsertId
   */
  async execute(sql, params = []) {
    throw new Error('execute() must be implemented by database adapter');
  }

  /**
   * Execute multiple statements in a transaction
   * @param {Function} callback - Async function receiving transaction client
   * @returns {Promise<any>} Transaction result
   */
  async transaction(callback) {
    throw new Error('transaction() must be implemented by database adapter');
  }

  /**
   * Get a single row
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|null>} Single row or null
   */
  async get(sql, params = []) {
    const results = await this.query(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get all rows
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} All matching rows
   */
  async all(sql, params = []) {
    return await this.query(sql, params);
  }

  /**
   * Run a command and return result info
   * @param {string} sql - SQL command
   * @param {Array} params - Command parameters
   * @returns {Promise<Object>} Result info
   */
  async run(sql, params = []) {
    return await this.execute(sql, params);
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Health check
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get adapter type
   * @returns {string} Adapter type (postgres, sqlite, etc.)
   */
  getType() {
    return 'base';
  }
}

module.exports = DatabaseAdapter;
