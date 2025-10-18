/**
 * SQLite to SQL Server Migration Script
 * Migrates all data from SQLite to SQL Server
 */

require('dotenv').config();
const Database = require('better-sqlite3');
const sql = require('mssql');
const path = require('path');
const fs = require('fs');

// Configuration
const SQLITE_PATH = process.env.DATABASE_PATH || './data/app.db';
const SQLSERVER_URL = process.env.DATABASE_URL;

if (!SQLSERVER_URL || !SQLSERVER_URL.startsWith('mssql')) {
  console.error('❌ Error: DATABASE_URL must be set to a SQL Server connection string');
  console.error('Example: mssql://username:password@localhost:1433/database?encrypt=true');
  process.exit(1);
}

// Parse SQL Server connection string
function parseConnectionString(url) {
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);

  return {
    server: urlObj.hostname,
    port: urlObj.port ? parseInt(urlObj.port) : 1433,
    database: urlObj.pathname.slice(1),
    user: decodeURIComponent(urlObj.username),
    password: decodeURIComponent(urlObj.password),
    options: {
      encrypt: params.get('encrypt') !== 'false',
      trustServerCertificate: params.get('trustServerCertificate') !== 'false',
      enableArithAbort: true
    }
  };
}

async function migrateData() {
  console.log('🚀 Starting SQLite to SQL Server migration...\n');

  // Check if SQLite database exists
  if (!fs.existsSync(SQLITE_PATH)) {
    console.error(`❌ SQLite database not found at: ${SQLITE_PATH}`);
    process.exit(1);
  }

  let sqliteDb;
  let sqlServerPool;

  try {
    // 1. Connect to SQLite
    console.log('📂 Connecting to SQLite...');
    sqliteDb = new Database(SQLITE_PATH, { readonly: true });
    console.log('✅ SQLite connected\n');

    // 2. Connect to SQL Server
    console.log('🔌 Connecting to SQL Server...');
    const config = parseConnectionString(SQLSERVER_URL);
    sqlServerPool = await sql.connect(config);
    console.log('✅ SQL Server connected\n');

    // 3. Create schema
    console.log('📋 Creating SQL Server schema...');
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '../server/db/sqlserver-schema.sql'),
      'utf8'
    );

    // Execute schema creation (split by GO statements)
    const statements = schemaSQL.split(/\nGO\n/i);
    for (const statement of statements) {
      if (statement.trim()) {
        await sqlServerPool.request().query(statement);
      }
    }
    console.log('✅ Schema created\n');

    // 4. Migrate tables
    const tables = [
      'users',
      'oauth_accounts',
      'sessions',
      'login_history',
      'conversations',
      'messages',
      'user_configs',
      'notes',
      'documents',
      'password_vault',
      'user_mcp_configs',
      'knowledge_base',
      'personas',
      'workflows'
    ];

    for (const table of tables) {
      await migrateTable(sqliteDb, sqlServerPool, table);
    }

    console.log('\n✨ Migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log('━'.repeat(50));

    // Print record counts
    for (const table of tables) {
      const count = await sqlServerPool
        .request()
        .query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  ${table.padEnd(30)} ${count.recordset[0].count} records`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    // Close connections
    if (sqliteDb) {
      sqliteDb.close();
      console.log('\n🔒 SQLite connection closed');
    }
    if (sqlServerPool) {
      await sqlServerPool.close();
      console.log('🔒 SQL Server connection closed');
    }
  }
}

async function migrateTable(sqliteDb, sqlServerPool, tableName) {
  console.log(`📦 Migrating table: ${tableName}...`);

  try {
    // Check if table exists in SQLite
    const tableExists = sqliteDb
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      .get(tableName);

    if (!tableExists) {
      console.log(`  ⚠️  Table ${tableName} not found in SQLite, skipping`);
      return;
    }

    // Get all rows from SQLite
    const rows = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all();

    if (rows.length === 0) {
      console.log(`  ℹ️  Table ${tableName} is empty, skipping`);
      return;
    }

    // Clear existing data in SQL Server
    await sqlServerPool.request().query(`DELETE FROM ${tableName}`);

    // Get column names
    const columns = Object.keys(rows[0]);
    const columnsWithoutId = columns.filter(col => col !== 'id');

    // Prepare INSERT statement
    const columnList = columnsWithoutId.join(', ');
    const paramList = columnsWithoutId.map((_, i) => `@p${i}`).join(', ');

    // Special handling for tables with IDENTITY columns
    const hasIdentity = columns.includes('id') && tableName !== 'conversations';

    if (hasIdentity) {
      await sqlServerPool.request().query(`SET IDENTITY_INSERT ${tableName} ON`);
    }

    // Insert all rows
    let inserted = 0;
    for (const row of rows) {
      const request = sqlServerPool.request();

      // Handle tables with or without IDENTITY
      let insertSQL;
      let values;

      if (hasIdentity) {
        // Include id column for IDENTITY tables
        insertSQL = `INSERT INTO ${tableName} (id, ${columnList}) VALUES (@id, ${paramList})`;
        request.input('id', row.id);
        values = columnsWithoutId.map((col, i) => {
          request.input(`p${i}`, row[col]);
          return row[col];
        });
      } else {
        // Normal insert
        insertSQL = `INSERT INTO ${tableName} (${columnList}) VALUES (${paramList})`;
        values = columnsWithoutId.map((col, i) => {
          request.input(`p${i}`, row[col]);
          return row[col];
        });
      }

      await request.query(insertSQL);
      inserted++;
    }

    if (hasIdentity) {
      await sqlServerPool.request().query(`SET IDENTITY_INSERT ${tableName} OFF`);
    }

    console.log(`  ✅ Migrated ${inserted} rows`);

  } catch (error) {
    console.error(`  ❌ Error migrating ${tableName}:`, error.message);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('\n🎉 All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateData };
