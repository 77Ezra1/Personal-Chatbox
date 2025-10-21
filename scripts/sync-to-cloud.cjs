#!/usr/bin/env node
/**
 * 自动备份并同步到云盘
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
    const parentDir = path.dirname(cloudPath);
    if (fs.existsSync(parentDir)) {
      return cloudPath;
    }
  }

  return null;
}

// 获取最新备份文件
function getLatestBackup() {
  const backupDir = path.join(process.cwd(), 'data', 'backups');

  if (!fs.existsSync(backupDir)) {
    return null;
  }

  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('app-') && f.endsWith('.db'))
    .map(f => ({
      name: f,
      path: path.join(backupDir, f),
      time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  return files.length > 0 ? files[0] : null;
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
  log('📦 开始备份数据库...', 'blue');
  console.log('');

  try {
    // 1. 创建备份
    execSync('npm run db:backup', { stdio: 'inherit' });

    // 2. 获取最新备份
    const latestBackup = getLatestBackup();
    if (!latestBackup) {
      log('❌ 没有找到备份文件', 'yellow');
      process.exit(1);
    }

    // 3. 检测云盘路径
    const cloudPath = detectCloudPath();
    if (!cloudPath) {
      console.log('');
      log('❌ 未检测到云盘，请设置环境变量 CHATBOX_CLOUD_BACKUP', 'yellow');
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

    // 4. 创建云盘目录（如果不存在）
    if (!fs.existsSync(cloudPath)) {
      fs.mkdirSync(cloudPath, { recursive: true });
    }

    // 5. 复制到云盘
    const cloudBackup = path.join(cloudPath, 'chatbox-latest.db');
    fs.copyFileSync(latestBackup.path, cloudBackup);

    // 6. 显示信息
    const fileSize = fs.statSync(latestBackup.path).size;

    console.log('');
    log('✅ 备份成功同步到云盘', 'green');
    console.log('');
    console.log('📁 备份信息:');
    console.log(`   文件: ${latestBackup.name}`);
    console.log(`   大小: ${formatSize(fileSize)}`);
    console.log(`   云盘路径: ${cloudBackup}`);
    console.log('');
    log('💡 在另一台电脑上运行: npm run sync:pull', 'cyan');
    console.log('');

  } catch (error) {
    console.error('');
    log('❌ 同步失败:', 'yellow');
    console.error(error.message);
    console.log('');
    process.exit(1);
  }
}

main();
