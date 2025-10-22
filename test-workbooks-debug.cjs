const { db } = require('./server/db/init.cjs');
const logger = require('./server/utils/logger.cjs');

async function testWorkbooks() {
  try {
    console.log('Testing prompt_workbooks table...');

    const userId = 13; // 刚注册的用户

    // 测试查询
    const query = `
      SELECT * FROM prompt_workbooks
      WHERE is_system = 1 OR user_id = ?
      ORDER BY is_system DESC, created_at DESC
    `;

    console.log('Executing query:', query);
    console.log('With userId:', userId);

    const workbooks = db.prepare(query).all(userId);

    console.log('Query result type:', typeof workbooks);
    console.log('Is array:', Array.isArray(workbooks));
    console.log('Result:', workbooks);

    if (Array.isArray(workbooks)) {
      console.log('Number of workbooks:', workbooks.length);

      // 测试 JSON 解析
      workbooks.forEach((wb, index) => {
        console.log(`\nWorkbook ${index + 1}:`, wb);

        try {
          if (wb.field_schema) {
            const parsed = JSON.parse(wb.field_schema);
            console.log('  field_schema parsed successfully');
          }
        } catch (err) {
          console.error('  field_schema parse error:', err.message);
        }

        try {
          if (wb.view_config) {
            const parsed = JSON.parse(wb.view_config);
            console.log('  view_config parsed successfully');
          }
        } catch (err) {
          console.error('  view_config parse error:', err.message);
        }
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

testWorkbooks();
