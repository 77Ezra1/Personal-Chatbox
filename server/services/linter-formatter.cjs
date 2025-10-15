const BaseService = require('./base.cjs');
const { createError } = require('../utils/errors.cjs');
const { auditToolCall } = require('../lib/audit.cjs');
const CommandRunnerService = require('./command-runner.cjs');

class LinterFormatterService extends BaseService {
  constructor(config) {
    super({
      id: 'linter_formatter',
      name: '代码质量工具',
      description: '封装 ESLint 与 Prettier 的运行接口',
      enabled: true
    });

    this.commandRunner = new CommandRunnerService({});

    this.tools = [
      {
        type: 'function',
        function: {
          name: 'run_lint',
          description: '运行 ESLint，支持 --fix',
          parameters: {
            type: 'object',
            properties: {
              fix: { type: 'boolean', description: '是否自动修复', default: false },
              paths: { type: 'array', items: { type: 'string' }, description: '指定校验路径，默认src/ server/' }
            },
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'run_format',
          description: '运行 Prettier，支持写入',
          parameters: {
            type: 'object',
            properties: {
              write: { type: 'boolean', description: '是否写回文件', default: false },
              paths: { type: 'array', items: { type: 'string' }, description: '指定格式化路径，默认src/ server/' }
            },
            required: []
          }
        }
      }
    ];
  }

  async execute(toolName, parameters) {
    switch (toolName) {
      case 'run_lint':
        return await this.runLint(parameters);
      case 'run_format':
        return await this.runFormat(parameters);
      default:
        throw createError.invalidParameters(`未知工具: ${toolName}`);
    }
  }

  async runLint({ fix = false, paths }) {
    const targetPaths = Array.isArray(paths) && paths.length > 0 ? paths : ['src', 'server'];
    const args = ['run', 'lint', '--'];
    if (fix) args.push('--fix');
    args.push(...targetPaths);
    const result = await this.commandRunner.runCommand({ cmd: 'pnpm', args });
    auditToolCall({ toolName: 'run_lint', parameters: { fix, paths: targetPaths }, result });
    return result;
  }

  async runFormat({ write = false, paths }) {
    const targetPaths = Array.isArray(paths) && paths.length > 0 ? paths : ['src', 'server'];
    const args = ['prettier', write ? '--write' : '--check', ...targetPaths];
    const result = await this.commandRunner.runCommand({ cmd: 'npx', args });
    auditToolCall({ toolName: 'run_format', parameters: { write, paths: targetPaths }, result });
    return result;
  }
}

module.exports = LinterFormatterService;


