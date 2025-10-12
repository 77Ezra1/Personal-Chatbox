#!/usr/bin/env node
/**
 * 邀请码管理脚本
 * 用于添加、查看、禁用邀请码
 */

const { db } = require('../server/db/init.cjs');

// 解析命令行参数
const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
  console.log(`
邀请码管理工具

用法:
  node manage-invite-codes.cjs <command> [options]

命令:
  list                          列出所有邀请码
  add <code> <max_uses> [desc]  添加新邀请码
  disable <code>                禁用邀请码
  enable <code>                 启用邀请码
  delete <code>                 删除邀请码
  help                          显示帮助信息

示例:
  node manage-invite-codes.cjs list
  node manage-invite-codes.cjs add NEWCODE 10 "新用户邀请码"
  node manage-invite-codes.cjs disable OLDCODE
  node manage-invite-codes.cjs enable OLDCODE
  node manage-invite-codes.cjs delete BADCODE
  `);
}

function listCodes() {
  console.log('📋 所有邀请码:\n');
  db.all('SELECT * FROM invite_codes ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      process.exit(1);
    }
    
    if (rows.length === 0) {
      console.log('暂无邀请码');
    } else {
      console.table(rows);
      console.log(`\n总计: ${rows.length} 个邀请码`);
    }
    
    db.close();
  });
}

function addCode(code, maxUses, description = '') {
  if (!code || !maxUses) {
    console.error('❌ 错误: 缺少必要参数');
    console.log('用法: node manage-invite-codes.cjs add <code> <max_uses> [description]');
    process.exit(1);
  }
  
  const max = parseInt(maxUses);
  if (isNaN(max) || max < 1) {
    console.error('❌ 错误: max_uses 必须是大于0的整数');
    process.exit(1);
  }
  
  console.log(`➕ 添加邀请码: ${code}`);
  console.log(`   最大使用次数: ${max}`);
  console.log(`   描述: ${description || '(无)'}`);
  
  db.run(
    `INSERT INTO invite_codes (code, max_uses, description) VALUES (?, ?, ?)`,
    [code.toUpperCase(), max, description],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          console.error('❌ 错误: 邀请码已存在');
        } else {
          console.error('❌ 添加失败:', err);
        }
        process.exit(1);
      }
      
      console.log(`✅ 邀请码添加成功! ID: ${this.lastID}`);
      db.close();
    }
  );
}

function disableCode(code) {
  if (!code) {
    console.error('❌ 错误: 缺少邀请码参数');
    console.log('用法: node manage-invite-codes.cjs disable <code>');
    process.exit(1);
  }
  
  console.log(`🔒 禁用邀请码: ${code}`);
  
  db.run(
    `UPDATE invite_codes SET is_active = 0 WHERE code = ?`,
    [code.toUpperCase()],
    function(err) {
      if (err) {
        console.error('❌ 禁用失败:', err);
        process.exit(1);
      }
      
      if (this.changes === 0) {
        console.log('⚠️  警告: 未找到该邀请码');
      } else {
        console.log('✅ 邀请码已禁用');
      }
      
      db.close();
    }
  );
}

function enableCode(code) {
  if (!code) {
    console.error('❌ 错误: 缺少邀请码参数');
    console.log('用法: node manage-invite-codes.cjs enable <code>');
    process.exit(1);
  }
  
  console.log(`🔓 启用邀请码: ${code}`);
  
  db.run(
    `UPDATE invite_codes SET is_active = 1 WHERE code = ?`,
    [code.toUpperCase()],
    function(err) {
      if (err) {
        console.error('❌ 启用失败:', err);
        process.exit(1);
      }
      
      if (this.changes === 0) {
        console.log('⚠️  警告: 未找到该邀请码');
      } else {
        console.log('✅ 邀请码已启用');
      }
      
      db.close();
    }
  );
}

function deleteCode(code) {
  if (!code) {
    console.error('❌ 错误: 缺少邀请码参数');
    console.log('用法: node manage-invite-codes.cjs delete <code>');
    process.exit(1);
  }
  
  console.log(`🗑️  删除邀请码: ${code}`);
  console.log('⚠️  警告: 此操作不可恢复!');
  
  db.run(
    `DELETE FROM invite_codes WHERE code = ?`,
    [code.toUpperCase()],
    function(err) {
      if (err) {
        console.error('❌ 删除失败:', err);
        process.exit(1);
      }
      
      if (this.changes === 0) {
        console.log('⚠️  警告: 未找到该邀请码');
      } else {
        console.log('✅ 邀请码已删除');
      }
      
      db.close();
    }
  );
}

// 主逻辑
switch (command) {
  case 'list':
    listCodes();
    break;
    
  case 'add':
    addCode(args[1], args[2], args[3]);
    break;
    
  case 'disable':
    disableCode(args[1]);
    break;
    
  case 'enable':
    enableCode(args[1]);
    break;
    
  case 'delete':
    deleteCode(args[1]);
    break;
    
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    process.exit(0);
    break;
    
  default:
    console.error('❌ 错误: 未知命令:', command);
    showHelp();
    process.exit(1);
}

