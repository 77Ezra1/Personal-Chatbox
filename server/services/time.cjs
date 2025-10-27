/**
 * 时间服务 (迁移自前端)
 */

const BaseService = require('./base.cjs');
const logger = require('../utils/logger.cjs');

class TimeService extends BaseService {
  constructor(config) {
    super(config);
    
    // 定义工具
    this.tools = [
      {
        type: 'function',
        function: {
          name: 'get_current_time',
          description: '获取准确的当前时间。当用户询问"现在几点"、"今天日期"或需要时间戳时，调用此工具获取真实时间，不要猜测。',
          parameters: {
            type: 'object',
            properties: {
              timezone: {
                type: 'string',
                description: '时区标识符。常用: Asia/Shanghai(中国), America/New_York(纽约), Europe/London(伦敦), UTC(世界标准)',
                default: 'Asia/Shanghai'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'convert_time',
          description: '转换不同时区的时间。当用户需要知道"北京时间对应纽约几点"这类问题时使用。',
          parameters: {
            type: 'object',
            properties: {
              source_timezone: {
                type: 'string',
                description: '源时区，如: Asia/Shanghai'
              },
              time: {
                type: 'string',
                description: '要转换的时间，格式: HH:MM，如: 14:30'
              },
              target_timezone: {
                type: 'string',
                description: '目标时区，如: America/New_York'
              }
            },
            required: ['source_timezone', 'time', 'target_timezone']
          }
        }
      }
    ];
  }

  async execute(toolName, parameters) {
    logger.debug(`执行时间工具: ${toolName}`, parameters);

    try {
      if (toolName === 'get_current_time') {
        return await this.getCurrentTime(parameters);
      } else if (toolName === 'convert_time') {
        return await this.convertTime(parameters);
      } else {
        return {
          success: false,
          error: `未知工具: ${toolName}`
        };
      }
    } catch (error) {
      logger.error(`时间服务错误:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getCurrentTime(parameters) {
    const { timezone = 'Asia/Shanghai' } = parameters;

    try {
      const now = new Date();
      
      let timeString, offsetString;
      if (timezone && timezone !== 'local') {
        const options = {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        };
        
        const formatter = new Intl.DateTimeFormat('zh-CN', options);
        timeString = formatter.format(now);
        
        const offsetMinutes = now.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
        const offsetMins = Math.abs(offsetMinutes) % 60;
        offsetString = `${offsetMinutes <= 0 ? '+' : '-'}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
      } else {
        timeString = now.toLocaleString('zh-CN');
        offsetString = 'local';
      }

      const content = `**当前时间信息**

🕐 时间: ${timeString}
🌍 时区: ${timezone}
📅 ISO格式: ${now.toISOString()}
⏰ 时间戳: ${now.getTime()}`;

      return {
        success: true,
        content
      };
    } catch (error) {
      throw new Error(`时间查询失败: ${error.message}`);
    }
  }

  async convertTime(parameters) {
    const { source_timezone, time, target_timezone } = parameters;

    // 验证参数
    this.validateParameters(parameters, ['source_timezone', 'time', 'target_timezone']);

    try {
      const [hours, minutes] = time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        return {
          success: false,
          error: '时间格式错误',
          details: '请使用 HH:MM 格式，例如: 14:30'
        };
      }

      const today = new Date();
      const sourceDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);

      const sourceOptions = { timeZone: source_timezone, hour12: false };
      const targetOptions = { timeZone: target_timezone, hour12: false };

      const sourceTime = sourceDate.toLocaleString('zh-CN', sourceOptions);
      const targetTime = sourceDate.toLocaleString('zh-CN', targetOptions);

      const content = `**时间转换结果**

📍 源时区 (${source_timezone}): ${sourceTime}
📍 目标时区 (${target_timezone}): ${targetTime}`;

      return {
        success: true,
        content
      };
    } catch (error) {
      throw new Error(`时间转换失败: ${error.message}`);
    }
  }
}

module.exports = TimeService;

