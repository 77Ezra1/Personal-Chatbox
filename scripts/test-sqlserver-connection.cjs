/**
 * SQL Server Connection Test Script
 * Tests SQL Server connection and displays database info
 */

require('dotenv').config();
const sql = require('mssql');

async function testConnection() {
  const dbUrl = process.env.DATABASE_URL;

  console.log('🔌 Testing SQL Server Connection');
  console.log('━'.repeat(60));

  // Validate URL
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set in .env file');
    console.log('\nPlease add to .env:');
    console.log('DATABASE_URL=mssql://username:password@server:port/database?encrypt=true&trustServerCertificate=true');
    process.exit(1);
  }

  if (!dbUrl.startsWith('mssql') && !dbUrl.startsWith('sqlserver')) {
    console.error('❌ DATABASE_URL is not a SQL Server connection string');
    console.log('Current URL starts with:', dbUrl.substring(0, 10));
    console.log('\nExpected format:');
    console.log('mssql://username:password@server:port/database?encrypt=true&trustServerCertificate=true');
    process.exit(1);
  }

  // Display connection info (hide password)
  const urlDisplay = dbUrl.replace(/:[^:@]+@/, ':***@');
  console.log('📍 Connection String:', urlDisplay);
  console.log('');

  let pool;

  try {
    // Parse connection string
    const urlObj = new URL(dbUrl);
    const params = new URLSearchParams(urlObj.search);

    const config = {
      server: urlObj.hostname,
      port: urlObj.port ? parseInt(urlObj.port) : 1433,
      database: urlObj.pathname.slice(1),
      user: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      options: {
        encrypt: params.get('encrypt') !== 'false',
        trustServerCertificate: params.get('trustServerCertificate') !== 'false',
        enableArithAbort: true
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };

    console.log('🔄 Connecting...');
    pool = await sql.connect(config);
    console.log('✅ Connected successfully!\n');

    // Get SQL Server version
    console.log('📊 Server Information:');
    console.log('━'.repeat(60));

    const versionResult = await pool.request().query('SELECT @@VERSION as version');
    console.log('Version:', versionResult.recordset[0].version.split('\n')[0]);

    // Get database name
    const dbResult = await pool.request().query('SELECT DB_NAME() as database_name');
    console.log('Database:', dbResult.recordset[0].database_name);

    // Get server name
    const serverResult = await pool.request().query('SELECT @@SERVERNAME as server_name');
    console.log('Server:', serverResult.recordset[0].server_name);

    console.log('');

    // List tables
    console.log('📋 Database Tables:');
    console.log('━'.repeat(60));

    const tablesResult = await pool.request().query(`
      SELECT
        TABLE_NAME,
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) as column_count
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    if (tablesResult.recordset.length === 0) {
      console.log('⚠️  No tables found. Run schema creation script first:');
      console.log('   Execute: server/db/sqlserver-schema.sql');
    } else {
      tablesResult.recordset.forEach(table => {
        console.log(`  📄 ${table.TABLE_NAME.padEnd(30)} (${table.column_count} columns)`);
      });
    }

    console.log('');

    // Check record counts
    if (tablesResult.recordset.length > 0) {
      console.log('📈 Table Record Counts:');
      console.log('━'.repeat(60));

      for (const table of tablesResult.recordset) {
        try {
          const countResult = await pool.request().query(`SELECT COUNT(*) as count FROM ${table.TABLE_NAME}`);
          const count = countResult.recordset[0].count;
          console.log(`  ${table.TABLE_NAME.padEnd(30)} ${count} records`);
        } catch (err) {
          console.log(`  ${table.TABLE_NAME.padEnd(30)} Error: ${err.message}`);
        }
      }
    }

    console.log('');
    console.log('━'.repeat(60));
    console.log('✅ Connection test passed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. ✅ SQL Server connection is working');
    console.log('2. 📋 Create schema: Execute server/db/sqlserver-schema.sql');
    console.log('3. 🚀 Migrate data: node scripts/migrate-to-sqlserver.cjs');
    console.log('4. 🎯 Start app: npm run server');

  } catch (error) {
    console.error('\n❌ Connection Test Failed');
    console.error('━'.repeat(60));
    console.error('Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. ☑️  Check if SQL Server is running');
    console.error('2. ☑️  Verify TCP/IP is enabled in SQL Server Configuration Manager');
    console.error('3. ☑️  Check firewall allows port 1433');
    console.error('4. ☑️  Verify username and password are correct');
    console.error('5. ☑️  Ensure database exists');
    console.error('');
    console.error('Full error details:');
    console.error(error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('🔒 Connection closed');
    }
  }
}

// Run test
if (require.main === module) {
  testConnection()
    .then(() => {
      console.log('\n🎉 Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testConnection };
