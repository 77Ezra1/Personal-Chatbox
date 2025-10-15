const BaseService = require('./base.cjs');
const { createError } = require('../utils/errors.cjs');
const { auditToolCall } = require('../lib/audit.cjs');
const CommandRunnerService = require('./command-runner.cjs');

class TestRunnerService extends BaseService {
  constructor(config) {
    super({
      id: 'test_runner',
      name: '测试运行器',
      description: '封装 Vitest/Jest 与 Playwright 的运行入口',
      enabled: true
    });

    this.commandRunner = new CommandRunnerService({});

    this.tools = [
      {
        type: 'function',
        function: {
          name: 'run_tests',
          description: '运行单元测试（Vitest/Jest）',
          parameters: {
            type: 'object',
            properties: {
              pattern: { type: 'string', description: '测试文件匹配，如 src/**/*.test.ts' },
              updateSnapshots: { type: 'boolean', description: '是否更新快照', default: false }
            },
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'run_e2e',
          description: '运行端到端测试（Playwright）',
          parameters: {
            type: 'object',
            properties: {
              pattern: { type: 'string', description: 'E2E 测试匹配' },
              ui: { type: 'boolean', description: '是否打开 UI', default: false }
            },
            required: []
          }
        }
      }
    ];
  }

  async execute(toolName, parameters) {
    switch (toolName) {
      case 'run_tests':
        return await this.runTests(parameters);
      case 'run_e2e':
        return await this.runE2E(parameters);
      default:
        throw createError.invalidParameters(`未知工具: ${toolName}`);
    }
  }

  async runTests({ pattern, updateSnapshots = false }) {
    const args = ['run', 'test', '--'];
    if (pattern) args.push(pattern);
    if (updateSnapshots) args.push('--update');
    const result = await this.commandRunner.runCommand({ cmd: 'pnpm', args });
    auditToolCall({ toolName: 'run_tests', parameters: { pattern, updateSnapshots }, result });
    return result;
  }

  async runE2E({ pattern, ui = false }) {
    const args = ['run', ui ? 'test:e2e:ui' : 'test:e2e'];
    if (pattern) args.push('--', pattern);
    const result = await this.commandRunner.runCommand({ cmd: 'pnpm', args });
    auditToolCall({ toolName: 'run_e2e', parameters: { pattern, ui }, result });
    return result;
  }
}

module.exports = TestRunnerService;


