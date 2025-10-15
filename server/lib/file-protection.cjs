/**
 * 文件保护配置
 * 定义不允许被修改/删除的关键文件和目录
 */

const path = require('path');

// 受保护的文件列表
const PROTECTED_FILES = [
  // 1. 环境配置文件
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.env.example',

  // 2. 核心配置文件
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',

  // 3. 版本控制
  '.gitignore',
  '.gitattributes',

  // 4. 数据库文件
  'prisma/schema.prisma',
  'data/app.db',
  'data/app.db-shm',
  'data/app.db-wal',

  // 5. 关键配置
  'vite.config.js',
  'vitest.config.js',
  'playwright.config.js',
  'eslint.config.js',
  'tsconfig.json',
  'jsconfig.json',
];

// 受保护的目录（不允许删除整个目录）
const PROTECTED_DIRECTORIES = [
  'server',
  'server/routes',
  'server/services',
  'server/middleware',
  'server/db',
  'server/lib',
  'server/utils',
  'src',
  'src/components',
  'src/hooks',
  'src/lib',
  'src/pages',
  'prisma',
  'public',
  '.git',
  'node_modules',
  'data',
];

// 允许写入的目录白名单（相对于项目根目录）
const WRITABLE_DIRECTORIES = [
  'src',
  'src/components',
  'src/hooks',
  'src/lib',
  'src/pages',
  'src/styles',
  'src/utils',
  'src/assets',
  'public',
  'docs',
  'docs/guides',
  'docs/setup',
  'docs/reports',
  'scripts',
  'tests',
  'test',
  '__tests__',
  'e2e',
];

/**
 * 检查文件路径是否受保护
 * @param {string} filePath - 文件路径（相对于项目根目录）
 * @returns {boolean} 是否受保护
 */
function isFileProtected(filePath) {
  const normalizedPath = normalizePath(filePath);

  // 检查是否在受保护文件列表中
  if (PROTECTED_FILES.includes(normalizedPath)) {
    return true;
  }

  // 检查是否在受保护目录中
  for (const protectedDir of PROTECTED_DIRECTORIES) {
    if (normalizedPath.startsWith(protectedDir + '/') || normalizedPath === protectedDir) {
      return true;
    }
  }

  return false;
}

/**
 * 检查路径是否在允许写入的白名单中
 * @param {string} filePath - 文件路径（相对于项目根目录）
 * @returns {boolean} 是否允许写入
 */
function isPathWritable(filePath) {
  const normalizedPath = normalizePath(filePath);

  // 检查是否在可写目录白名单中
  for (const writableDir of WRITABLE_DIRECTORIES) {
    if (normalizedPath.startsWith(writableDir + '/') || normalizedPath === writableDir) {
      return true;
    }
  }

  return false;
}

/**
 * 验证文件操作是否安全
 * @param {string} filePath - 文件路径
 * @param {string} operation - 操作类型 ('read', 'write', 'delete')
 * @returns {Object} 验证结果 { allowed: boolean, reason?: string }
 */
function validateFileOperation(filePath, operation) {
  const normalizedPath = normalizePath(filePath);

  // 1. 检查路径遍历攻击
  if (normalizedPath.includes('..') || normalizedPath.includes('~')) {
    return {
      allowed: false,
      reason: 'Path traversal detected. Using ".." or "~" is not allowed.'
    };
  }

  // 2. 检查绝对路径（只允许相对路径）
  if (path.isAbsolute(normalizedPath)) {
    return {
      allowed: false,
      reason: 'Absolute paths are not allowed. Please use relative paths.'
    };
  }

  // 3. 读取操作 - 相对宽松
  if (operation === 'read') {
    return { allowed: true };
  }

  // 4. 写入/删除操作 - 检查保护列表
  if (operation === 'write' || operation === 'delete') {
    // 4.1 检查是否是受保护文件
    if (isFileProtected(normalizedPath)) {
      return {
        allowed: false,
        reason: `File "${normalizedPath}" is protected and cannot be modified or deleted.`
      };
    }

    // 4.2 检查是否在可写白名单中
    if (!isPathWritable(normalizedPath)) {
      return {
        allowed: false,
        reason: `Directory is not in the writable whitelist. Allowed directories: ${WRITABLE_DIRECTORIES.join(', ')}`
      };
    }
  }

  return { allowed: true };
}

/**
 * 规范化路径（处理 Windows/Mac/Linux 差异）
 * @param {string} filePath - 原始路径
 * @returns {string} 规范化后的路径
 */
function normalizePath(filePath) {
  // 将反斜杠转换为正斜杠（Windows兼容）
  let normalized = filePath.replace(/\\/g, '/');

  // 移除开头的 "./"
  if (normalized.startsWith('./')) {
    normalized = normalized.substring(2);
  }

  // 移除开头的 "/"
  if (normalized.startsWith('/')) {
    normalized = normalized.substring(1);
  }

  return normalized;
}

/**
 * 获取所有受保护的文件和目录列表（用于文档）
 * @returns {Object} { files: string[], directories: string[] }
 */
function getProtectedResources() {
  return {
    files: [...PROTECTED_FILES],
    directories: [...PROTECTED_DIRECTORIES],
    writableDirectories: [...WRITABLE_DIRECTORIES],
  };
}

module.exports = {
  isFileProtected,
  isPathWritable,
  validateFileOperation,
  normalizePath,
  getProtectedResources,
  PROTECTED_FILES,
  PROTECTED_DIRECTORIES,
  WRITABLE_DIRECTORIES,
};
