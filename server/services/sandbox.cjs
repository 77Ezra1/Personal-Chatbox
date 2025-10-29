/**
 * 代码沙箱服务
 * 支持安全执行 JavaScript、Python 等多种语言代码
 */

const { VM } = require('vm2');
const { spawn } = require('child_process');
const BaseService = require('./base.cjs');
const logger = require('../utils/logger.cjs');
const { createError } = require('../utils/errors.cjs');

class SandboxService extends BaseService {
  constructor(config) {
    super({
      id: 'sandbox',
      name: '代码沙箱',
      description: '安全的代码执行环境，支持多种编程语言',
      enabled: true
    });

    this.config = {
      timeout: config?.timeout || 30000, // 默认30秒超时
      memoryLimit: config?.memoryLimit || 128, // MB
      ...config
    };

    this.tools = [
      {
        type: 'function',
        function: {
          name: 'execute_code',
          description: '在安全沙箱环境中执行代码并返回结果。适用于需要计算、数据处理、算法验证等场景。支持 JavaScript 和 Python。可以用来：1) 执行数学计算和统计分析 2) 验证算法逻辑 3) 处理和转换数据 4) 生成测试数据 5) 演示编程概念',
          parameters: {
            type: 'object',
            properties: {
              language: {
                type: 'string',
                enum: ['javascript', 'python'],
                description: '编程语言，javascript 用于 Node.js 代码，python 用于 Python 3 代码'
              },
              code: {
                type: 'string',
                description: '要执行的代码。JavaScript 使用 console.log() 输出，Python 使用 print() 输出。代码会在隔离环境中运行，无法访问文件系统或网络'
              },
              timeout: {
                type: 'number',
                description: '超时时间（毫秒），默认30000（30秒）。如果代码执行超时会被自动终止',
                default: 30000
              }
            },
            required: ['language', 'code']
          }
        }
      }
    ];
  }

  /**
   * 执行 JavaScript 代码
   */
  async executeJavaScript(code, options = {}) {
    const timeout = options.timeout || this.config.timeout;

    try {
      // 创建 VM2 沙箱
      const vm = new VM({
        timeout,
        sandbox: {
          console: {
            log: (...args) => {
              options.onOutput?.('stdout', args.map(String).join(' ') + '\n');
            },
            error: (...args) => {
              options.onOutput?.('stderr', args.map(String).join(' ') + '\n');
            },
            warn: (...args) => {
              options.onOutput?.('stdout', '[WARN] ' + args.map(String).join(' ') + '\n');
            },
            info: (...args) => {
              options.onOutput?.('stdout', '[INFO] ' + args.map(String).join(' ') + '\n');
            }
          },
          // 提供一些安全的内置函数
          setTimeout: undefined, // 禁用异步操作
          setInterval: undefined,
          setImmediate: undefined,
          // 提供安全的全局对象
          Math,
          JSON,
          Date,
          Array,
          Object,
          String,
          Number,
          Boolean
        },
        eval: false, // 禁用 eval
        wasm: false, // 禁用 WebAssembly
        fixAsync: true
      });

      // 包装代码以捕获返回值
      const wrappedCode = `
        (function() {
          ${code}
        })();
      `;

      const result = vm.run(wrappedCode);

      return {
        success: true,
        output: result !== undefined ? String(result) : '',
        error: null
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error.message || String(error)
      };
    }
  }

  /**
   * 执行 Python 代码
   */
  async executePython(code, options = {}) {
    const timeout = options.timeout || this.config.timeout;

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let killed = false;

      // 检查 Python 是否可用
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

      const child = spawn(pythonCmd, ['-c', code], {
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8'
        }
      });

      // 设置超时
      const timer = setTimeout(() => {
        killed = true;
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 1000);
      }, timeout);

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        options.onOutput?.('stdout', output);
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        options.onOutput?.('stderr', output);
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        resolve({
          success: false,
          output: stdout,
          error: `执行失败: ${error.message}\n提示: 请确保已安装 Python`
        });
      });

      child.on('close', (code) => {
        clearTimeout(timer);

        if (killed) {
          resolve({
            success: false,
            output: stdout,
            error: `执行超时 (${timeout}ms)`
          });
        } else if (code === 0) {
          resolve({
            success: true,
            output: stdout,
            error: stderr || null
          });
        } else {
          resolve({
            success: false,
            output: stdout,
            error: stderr || `进程退出码: ${code}`
          });
        }
      });
    });
  }

  /**
   * 执行代码（主入口）
   */
  async execute_code(params) {
    const { language, code, timeout } = params;

    logger.info(`[Sandbox] 执行 ${language} 代码`);

    try {
      let result;

      switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
        case 'node':
          result = await this.executeJavaScript(code, { timeout });
          break;

        case 'python':
        case 'py':
          result = await this.executePython(code, { timeout });
          break;

        default:
          throw createError.invalidParameters(`不支持的语言: ${language}`);
      }

      return {
        success: result.success,
        language,
        output: result.output,
        error: result.error,
        executionTime: Date.now()
      };
    } catch (error) {
      logger.error(`[Sandbox] 执行失败:`, error);
      throw error;
    }
  }

  /**
   * 执行工具（通用接口）
   * @param {string} toolName - 工具名称
   * @param {Object} parameters - 工具参数
   * @returns {Promise<Object>} 执行结果
   */
  async execute(toolName, parameters) {
    logger.info(`[Sandbox] 执行工具: ${toolName}`);

    switch (toolName) {
      case 'execute_code':
        return await this.execute_code(parameters);
      default:
        throw createError.invalidParameters(`未知工具: ${toolName}`);
    }
  }

  /**
   * 验证工具调用
   */
  validateToolCall(toolName, params) {
    if (toolName === 'execute_code') {
      if (!params.language) {
        throw createError.invalidParameters('缺少 language 参数');
      }
      if (!params.code) {
        throw createError.invalidParameters('缺少 code 参数');
      }
    }
    return true;
  }
}

module.exports = SandboxService;
