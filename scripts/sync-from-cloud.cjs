#!/usr/bin/env node
/**
 * 从云盘恢复数据库
 * 跨平台支持：Windows, macOS, Linux
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检测云盘路径
function detectCloudPath() {
  const platform = os.platform();
  const homeDir = os.homedir();

  // 1. 检查环境变量
  if (process.env.CHATBOX_CLOUD_BACKUP) {
    return process.env.CHATBOX_CLOUD_BACKUP;
  }

  // 2. 根据平台检测常见云盘路径
  const cloudPaths = [];

  if (platform === 'darwin') {
    // macOS
    cloudPaths.push(
      path.join(homeDir, 'Library/Mobile Documents/com~apple~CloudDocs/ChatboxBackup'),
      path.join(homeDir, 'OneDrive/ChatboxBackup'),
      path.join(homeDir, 'Google Drive/ChatboxBackup'),
      path.join(homeDir, 'Dropbox/ChatboxBackup')
    );
  } else if (platform === 'win32') {
    // Windows
    const oneDrive = process.env.OneDrive || path.join(homeDir, 'OneDrive');
    cloudPaths.push(
      path.join(oneDrive, 'ChatboxBackup'),
      path.join(homeDir, 'OneDrive/ChatboxBackup'),
      path.join(homeDir, 'Google Drive/ChatboxBackup'),
      path.join(homeDir, 'Dropbox/ChatboxBackup')
    );
  } else {
    // Linux
    cloudPaths.push(
      path.join(homeDir, 'OneDrive/ChatboxBackup'),
      path.join(homeDir, 'Google Drive/ChatboxBackup'),
      path.join(homeDir, 'Dropbox/ChatboxBackup')
    );
  }

  // 查找第一个存在的云盘路径
  for (const cloudPath of cloudPaths) {
    if (fs.existsSync(cloudPath)) {
      return cloudPath;
    }
  }

  return null;
}

// 生成时间戳
function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}-${minute}-${second}`;
}

// 格式化文件大小
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// 主函数
async function main() {
  console.log('');
  log('☁️  从云盘获取备份...', 'blue');
  console.log('');

  try {
    // 1. 检测云盘路径
    const cloudPath = detectCloudPath();
    if (!cloudPath) {
      log('❌ 未检测到云盘备份，请设置环境变量 CHATBOX_CLOUD_BACKUP', 'yellow');
      console.log('');
      console.log('示例：');
      if (os.platform() === 'win32') {
        console.log('  set CHATBOX_CLOUD_BACKUP=%OneDrive%\\ChatboxBackup');
        console.log('  或在 PowerShell 中：');
        console.log('  $env:CHATBOX_CLOUD_BACKUP="$env:OneDrive\\ChatboxBackup"');
      } else {
        console.log('  export CHATBOX_CLOUD_BACKUP="$HOME/OneDrive/ChatboxBackup"');
      }
      console.log('');
      process.exit(1);
    }

    // 2. 检查云盘备份文件
    const cloudBackup = path.join(cloudPath, 'chatbox-latest.db');
    if (!fs.existsSync(cloudBackup)) {
      log('❌ 云盘中没有找到备份文件', 'yellow');
      console.log(`   路径: ${cloudBackup}`);
      console.log('');
      console.log('请先在另一台电脑上运行: npm run sync:push');
      console.log('');
      process.exit(1);
    }

    // 3. 创建本地备份目录
    const backupDir = path.join(process.cwd(), 'data', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 4. 生成带时间戳的文件名
    const timestamp = generateTimestamp();
    const localBackup = path.join(backupDir, `app-${timestamp}.db`);

    // 5. 复制到本地
    fs.copyFileSync(cloudBackup, localBackup);

    // 6. 显示云盘备份信息
    const fileStats = fs.statSync(cloudBackup);
    const fileSize = fileStats.size;
    const fileDate = fileStats.mtime.toLocaleString('zh-CN');

    console.log('');
    log('✅ 从云盘下载备份成功', 'green');
    console.log('');
    console.log('📁 云盘备份信息:');
    console.log(`   修改时间: ${fileDate}`);
    console.log(`   文件大小: ${formatSize(fileSize)}`);
    console.log('');

    // 7. 恢复数据库
    log('🔄 正在恢复数据库...', 'blue');
    execSync(`npm run db:restore ${timestamp}`, { stdio: 'inherit' });

    console.log('');
    log('✅ 数据库恢复完成', 'green');
    console.log('');
    log('💡 现在可以启动服务器: npm run dev', 'cyan');
    console.log('');

  } catch (error) {
    console.error('');
    log('❌ 恢复失败:', 'yellow');
    console.error(error.message);
    console.log('');
    process.exit(1);
  }
}

main();
