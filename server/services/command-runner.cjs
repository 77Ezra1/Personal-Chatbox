const { spawn } = require('child_process');
const BaseService = require('./base.cjs');
const logger = require('../utils/logger.cjs');
const { createError } = require('../utils/errors.cjs');
const { auditToolCall } = require('../lib/audit.cjs');

const ALLOWED_COMMANDS = new Set([
  'pnpm', 'npm', 'node',
  'vitest', 'jest',
  'eslint', 'prettier',
  'playwright', 'git'
]);

class CommandRunnerService extends BaseService {
  constructor(config) {
    super({
      id: 'command_runner',
      name: '命令执行器',
      description: '受控白名单命令执行，支持超时与dryRun',
      enabled: true
    });

    this.defaultCwd = process.cwd();
    this.defaultTimeoutMs = 5 * 60 * 1000; // 5分钟

    this.tools = [
      {
        type: 'function',
        function: {
          name: 'run_command',
          description: '执行白名单命令，支持dryRun与超时。cmd必须在白名单中。',
          parameters: {
            type: 'object',
            properties: {
              cmd: { type: 'string', description: '命令名，如 pnpm、node、git' },
              args: { type: 'array', items: { type: 'string' }, description: '参数数组' },
              cwd: { type: 'string', description: '工作目录，默认项目根目录' },
              timeoutMs: { type: 'number', description: '超时时间毫秒，默认5分钟' },
              env: { type: 'object', description: '附加环境变量' },
              dryRun: { type: 'boolean', description: '只预览不执行', default: false }
            },
            required: ['cmd']
          }
        }
      }
    ];
  }

  async execute(toolName, parameters) {
    switch (toolName) {
      case 'run_command':
        return await this.runCommand(parameters);
      default:
        throw createError.invalidParameters(`未知工具: ${toolName}`);
    }
  }

  async runCommand({ cmd, args = [], cwd, timeoutMs, env = {}, dryRun = false }) {
    if (!cmd || typeof cmd !== 'string') {
      const err = createError.invalidParameters('缺少必需参数: cmd');
      auditToolCall({ toolName: 'run_command', parameters: { cmd, args, cwd }, error: err });
      throw err;
    }
    if (!ALLOWED_COMMANDS.has(cmd)) {
      const err = createError.invalidParameters(`命令不在白名单: ${cmd}`);
      auditToolCall({ toolName: 'run_command', parameters: { cmd, args, cwd }, error: err });
      throw err;
    }

    const runCwd = cwd || this.defaultCwd;
    const runTimeout = Number.isFinite(timeoutMs) ? timeoutMs : this.defaultTimeoutMs;

    if (dryRun) {
      const preview = { preview: true, cmd, args, cwd: runCwd, timeoutMs: runTimeout };
      auditToolCall({ toolName: 'run_command', parameters: { cmd, args, cwd, dryRun }, result: preview });
      return preview;
    }

    logger.info(`[CommandRunner] 执行: ${cmd} ${args.join(' ')} (cwd=${runCwd})`);

    return await new Promise((resolve, reject) => {
      const child = spawn(cmd, args, {
        cwd: runCwd,
        env: { ...process.env, ...env },
        shell: process.platform === 'win32'
      });

      let stdout = '';
      let stderr = '';
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
      }, runTimeout);

      child.stdout.on('data', (d) => {
        stdout += d.toString();
      });
      child.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      child.on('error', (err) => {
        clearTimeout(timeout);
        auditToolCall({ toolName: 'run_command', parameters: { cmd, args, cwd }, error: err });
        reject(createError.internalError(`命令执行失败: ${err.message}`));
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        const result = { code, stdout, stderr };
        auditToolCall({ toolName: 'run_command', parameters: { cmd, args, cwd }, result });
        if (code === 0) {
          resolve({ success: true, ...result });
        } else {
          resolve({ success: false, ...result });
        }
      });
    });
  }
}

module.exports = CommandRunnerService;


