/**
 * Database Adapter Factory
 * Simplified, unified database connection management
 * Replaces 5 overlapping adapter implementations with clean interface
 */

const PostgresAdapter = require('./postgres.cjs');
const SQLiteAdapter = require('./sqlite.cjs');
const logger = require('../../utils/logger.cjs');

/**
 * Create appropriate database adapter based on configuration
 * @returns {Promise<DatabaseAdapter>} Connected database adapter
 */
async function createDatabaseAdapter() {
  const dbUrl = process.env.DATABASE_URL;

  // PostgreSQL (production)
  if (dbUrl && dbUrl.startsWith('postgres')) {
    logger.info('[DB] Using PostgreSQL adapter');

    const adapter = new PostgresAdapter({
      url: dbUrl,
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000
    });

    await adapter.connect();
    return adapter;
  }

  // SQLite (development/fallback)
  logger.info('[DB] Using SQLite adapter');

  const adapter = new SQLiteAdapter({
    path: process.env.SQLITE_PATH || './data/chatbox.db',
    verbose: process.env.NODE_ENV === 'development'
  });

  await adapter.connect();
  return adapter;
}

/**
 * Get database configuration info
 */
function getDatabaseInfo() {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && dbUrl.startsWith('postgres')) {
    return {
      type: 'postgres',
      configured: true,
      url: dbUrl.replace(/:[^:@]+@/, ':***@') // Hide password
    };
  }

  return {
    type: 'sqlite',
    configured: true,
    path: process.env.SQLITE_PATH || './data/chatbox.db'
  };
}

module.exports = {
  createDatabaseAdapter,
  getDatabaseInfo,
  PostgresAdapter,
  SQLiteAdapter
};
