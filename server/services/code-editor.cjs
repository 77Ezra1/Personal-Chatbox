const fs = require('fs');
const path = require('path');
const BaseService = require('./base.cjs');
const { createError } = require('../utils/errors.cjs');
const { acquireLock } = require('../lib/locks.cjs');
const { auditToolCall, auditFileChange } = require('../lib/audit.cjs');

function assertInWorkspace(targetPath) {
  const full = path.resolve(process.cwd(), targetPath);
  if (!full.startsWith(process.cwd())) {
    throw createError.invalidParameters('路径超出工作区范围');
  }
  return full;
}

function readFileSafe(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function createDiffPreview(before, after, max = 1200) {
  try {
    const linesBefore = (before ?? '').split('\n');
    const linesAfter = (after ?? '').split('\n');
    let out = '';
    out += `--- before\n+++ after\n`;
    const maxLines = Math.max(linesBefore.length, linesAfter.length);
    for (let i = 0; i < Math.min(maxLines, 2000); i++) {
      const b = linesBefore[i] ?? '';
      const a = linesAfter[i] ?? '';
      if (b !== a) {
        out += `- ${b}\n+ ${a}\n`;
      }
    }
    return out.length > max ? out.slice(0, max) + '\n...<truncated>' : out;
  } catch {
    return '[diff unavailable]';
  }
}

class CodeEditorService extends BaseService {
  constructor(config) {
    super({
      id: 'code_editor',
      name: '代码编辑器',
      description: '安全的文件读取、写入、查找替换与补丁预览/应用',
      enabled: true
    });

    this.tools = [
      {
        type: 'function',
        function: {
          name: 'fs_read_file',
          description: '读取文本文件内容',
          parameters: {
            type: 'object',
            properties: { path: { type: 'string' } },
            required: ['path']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'fs_write_file',
          description: '写入文本文件内容，支持创建/防覆盖',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              content: { type: 'string' },
              createIfMissing: { type: 'boolean', default: true },
              failIfExists: { type: 'boolean', default: false },
              dryRun: { type: 'boolean', default: false }
            },
            required: ['path', 'content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'find_replace',
          description: '在文件中进行查找替换，支持正则，返回变更摘要',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              find: { type: 'string' },
              replace: { type: 'string' },
              isRegex: { type: 'boolean', default: false },
              dryRun: { type: 'boolean', default: true }
            },
            required: ['path', 'find', 'replace']
          }
        }
      }
    ];
  }

  async execute(toolName, parameters) {
    switch (toolName) {
      case 'fs_read_file':
        return await this.readFile(parameters);
      case 'fs_write_file':
        return await this.writeFile(parameters);
      case 'find_replace':
        return await this.findReplace(parameters);
      default:
        throw createError.invalidParameters(`未知工具: ${toolName}`);
    }
  }

  async readFile({ path: relPath }) {
    if (!relPath || typeof relPath !== 'string') {
      const err = createError.invalidParameters('缺少必需参数: path');
      auditToolCall({ toolName: 'fs_read_file', parameters: { path: relPath }, error: err });
      throw err;
    }
    const full = assertInWorkspace(relPath);
    const content = readFileSafe(full);
    auditToolCall({ toolName: 'fs_read_file', parameters: { path: relPath }, result: { bytes: content ? content.length : 0 } });
    return { path: relPath, exists: content !== null, content };
  }

  async writeFile({ path: relPath, content, createIfMissing = true, failIfExists = false, dryRun = false }) {
    if (!relPath || typeof relPath !== 'string') {
      const err = createError.invalidParameters('缺少必需参数: path');
      auditToolCall({ toolName: 'fs_write_file', parameters: { path: relPath }, error: err });
      throw err;
    }
    if (typeof content !== 'string') {
      const err = createError.invalidParameters('缺少必需参数: content');
      auditToolCall({ toolName: 'fs_write_file', parameters: { path: relPath }, error: err });
      throw err;
    }
    const full = assertInWorkspace(relPath);
    const release = await acquireLock(full);
    try {
      const exists = fs.existsSync(full);
      if (!exists && !createIfMissing) {
        const err = createError.invalidParameters('文件不存在且不允许创建');
        auditToolCall({ toolName: 'fs_write_file', parameters: { path: relPath }, error: err });
        throw err;
      }
      if (exists && failIfExists) {
        const err = createError.invalidParameters('文件已存在且设置了failIfExists');
        auditToolCall({ toolName: 'fs_write_file', parameters: { path: relPath }, error: err });
        throw err;
      }

      const before = readFileSafe(full) ?? '';
      const after = content;
      const diffPreview = createDiffPreview(before, after);

      if (dryRun) {
        auditToolCall({ toolName: 'fs_write_file', parameters: { path: relPath, dryRun }, result: { preview: true, bytes: after.length, diffPreview } });
        return { preview: true, bytes: after.length, diffPreview };
      }

      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content, 'utf8');
      auditFileChange({ path: relPath, action: exists ? 'overwrite' : 'create', bytes: content.length, diffPreview });
      auditToolCall({ toolName: 'fs_write_file', parameters: { path: relPath }, result: { success: true, bytes: content.length } });
      return { success: true, bytes: content.length };
    } finally {
      release();
    }
  }

  async findReplace({ path: relPath, find, replace, isRegex = false, dryRun = true }) {
    if (!relPath || typeof relPath !== 'string') {
      const err = createError.invalidParameters('缺少必需参数: path');
      auditToolCall({ toolName: 'find_replace', parameters: { path: relPath }, error: err });
      throw err;
    }
    if (typeof find !== 'string' || typeof replace !== 'string') {
      const err = createError.invalidParameters('find/replace 必须为字符串');
      auditToolCall({ toolName: 'find_replace', parameters: { path: relPath }, error: err });
      throw err;
    }
    const full = assertInWorkspace(relPath);
    const release = await acquireLock(full);
    try {
      if (!fs.existsSync(full)) {
        const err = createError.invalidParameters('文件不存在');
        auditToolCall({ toolName: 'find_replace', parameters: { path: relPath }, error: err });
        throw err;
      }

      const before = fs.readFileSync(full, 'utf8');
      let newContent;
      let count = 0;

      if (isRegex) {
        const re = new RegExp(find, 'g');
        newContent = before.replace(re, () => {
          count++;
          return replace;
        });
      } else {
        count = before.split(find).length - 1;
        newContent = before.split(find).join(replace);
      }

      const diffPreview = createDiffPreview(before, newContent);
      if (dryRun) {
        const result = { preview: true, replacements: count, diffPreview };
        auditToolCall({ toolName: 'find_replace', parameters: { path: relPath, isRegex, dryRun }, result });
        return result;
      }

      fs.writeFileSync(full, newContent, 'utf8');
      auditFileChange({ path: relPath, action: 'replace', bytes: newContent.length, diffPreview });
      const result = { success: true, replacements: count };
      auditToolCall({ toolName: 'find_replace', parameters: { path: relPath, isRegex }, result });
      return result;
    } finally {
      release();
    }
  }
}

module.exports = CodeEditorService;


