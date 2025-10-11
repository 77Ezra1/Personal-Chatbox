/**
 * 天气服务 (迁移自前端)
 */

const BaseService = require('./base.cjs');
const logger = require('../utils/logger.cjs');

class WeatherService extends BaseService {
  constructor(config) {
    super(config);
    
    // 定义工具
    this.tools = [
      {
        type: 'function',
        function: {
          name: 'get_current_weather',
          description: '获取指定城市的当前天气信息',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: '城市名称，例如：北京、上海、纽约'
              },
              units: {
                type: 'string',
                enum: ['celsius', 'fahrenheit'],
                description: '温度单位',
                default: 'celsius'
              }
            },
            required: ['location']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_weather_forecast',
          description: '获取指定城市未来几天的天气预报',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: '城市名称'
              },
              days: {
                type: 'number',
                description: '预报天数（1-7天）',
                default: 3
              },
              units: {
                type: 'string',
                enum: ['celsius', 'fahrenheit'],
                description: '温度单位',
                default: 'celsius'
              }
            },
            required: ['location']
          }
        }
      }
    ];
  }

  async execute(toolName, parameters) {
    logger.debug(`执行天气工具: ${toolName}`, parameters);

    try {
      const { location, units = 'celsius', days = 1 } = parameters;

      // 验证参数
      this.validateParameters(parameters, ['location']);

      // 地理编码
      const geocodeUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
      geocodeUrl.searchParams.append('name', location);
      geocodeUrl.searchParams.append('count', '1');
      geocodeUrl.searchParams.append('language', 'zh');

      const geocodeResponse = await fetch(geocodeUrl);
      if (!geocodeResponse.ok) {
        throw new Error('地理编码失败');
      }

      const geocodeData = await geocodeResponse.json();
      if (!geocodeData.results || geocodeData.results.length === 0) {
        return {
          success: false,
          error: `未找到城市: ${location}`,
          details: '请检查城市名称是否正确'
        };
      }

      const { latitude, longitude, name, country } = geocodeData.results[0];

      // 获取天气数据
      const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
      weatherUrl.searchParams.append('latitude', latitude);
      weatherUrl.searchParams.append('longitude', longitude);
      weatherUrl.searchParams.append('current', 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m');
      weatherUrl.searchParams.append('daily', 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum');
      weatherUrl.searchParams.append('forecast_days', toolName === 'get_weather_forecast' ? days : 1);
      weatherUrl.searchParams.append('timezone', 'auto');

      if (units === 'fahrenheit') {
        weatherUrl.searchParams.append('temperature_unit', 'fahrenheit');
      }

      const weatherResponse = await fetch(weatherUrl);
      if (!weatherResponse.ok) {
        throw new Error('天气数据获取失败');
      }

      const weatherData = await weatherResponse.json();

      // 格式化响应
      const tempUnit = units === 'fahrenheit' ? '°F' : '°C';
      let content = `**${name}${country ? `, ${country}` : ''} 天气信息**\n\n`;

      if (weatherData.current) {
        content += `🌡️ 当前温度: ${weatherData.current.temperature_2m}${tempUnit}\n`;
        content += `💧 相对湿度: ${weatherData.current.relative_humidity_2m}%\n`;
        content += `💨 风速: ${weatherData.current.wind_speed_10m} km/h\n`;
        content += `☁️ 天气状况: ${this.getWeatherDescription(weatherData.current.weather_code)}\n\n`;
      }

      if (toolName === 'get_weather_forecast' && weatherData.daily && weatherData.daily.temperature_2m_max) {
        content += `**未来几天预报:**\n`;
        for (let i = 1; i < Math.min(weatherData.daily.temperature_2m_max.length, days + 1); i++) {
          const maxTemp = weatherData.daily.temperature_2m_max[i];
          const minTemp = weatherData.daily.temperature_2m_min[i];
          const weatherCode = weatherData.daily.weather_code[i];
          const precipitation = weatherData.daily.precipitation_sum[i] || 0;

          content += `第${i}天: ${minTemp}${tempUnit} - ${maxTemp}${tempUnit}, ${this.getWeatherDescription(weatherCode)}`;
          if (precipitation > 0) {
            content += `, 降水 ${precipitation}mm`;
          }
          content += '\n';
        }
      }

      return {
        success: true,
        content
      };

    } catch (error) {
      return this.handleApiError(error, this.name);
    }
  }

  getWeatherDescription(code) {
    const weatherCodes = {
      0: '晴朗',
      1: '基本晴朗',
      2: '部分多云',
      3: '阴天',
      45: '有雾',
      48: '雾凇',
      51: '小雨',
      53: '中雨',
      55: '大雨',
      61: '小雨',
      63: '中雨',
      65: '大雨',
      71: '小雪',
      73: '中雪',
      75: '大雪',
      77: '雪粒',
      80: '阵雨',
      81: '中阵雨',
      82: '大阵雨',
      85: '小阵雪',
      86: '大阵雪',
      95: '雷暴',
      96: '雷暴伴冰雹',
      99: '强雷暴伴冰雹'
    };
    return weatherCodes[code] || '未知';
  }
}

module.exports = WeatherService;

