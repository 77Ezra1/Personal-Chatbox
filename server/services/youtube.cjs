const BaseService = require('./base.cjs');
const { getSubtitles } = require('youtube-captions-scraper');
const logger = require('../utils/logger.cjs');

class YouTubeService extends BaseService {
  constructor() {
    super('youtube', 'YouTube字幕提取', 'YouTube字幕服务');
  }

  getTools() {
    return [
      {
        name: 'get_youtube_transcript',
        description: '获取YouTube视频的字幕和转录文本。支持多种语言,如果未指定语言会自动尝试中文和英文。',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'YouTube视频URL(如 https://www.youtube.com/watch?v=VIDEO_ID) 或视频ID'
            },
            lang: {
              type: 'string',
              description: '字幕语言代码(可选,如zh表示中文,en表示英文)。如果不指定,会自动尝试中文和英文。',
              default: 'auto'
            }
          },
          required: ['url']
        }
      }
    ];
  }

  extractVideoId(url) {
    // 如果已经是视频ID,直接返回
    if (url.length === 11 && !url.includes('/') && !url.includes('?')) {
      return url;
    }
    
    // 从URL提取视频ID
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    throw new Error('无效的YouTube URL或视频ID');
  }

  async tryGetSubtitles(videoId, languages) {
    const errors = [];
    
    for (const lang of languages) {
      try {
        logger.info(`尝试获取${lang}语言的字幕...`);
        const subtitles = await getSubtitles({
          videoID: videoId,
          lang: lang
        });
        
        if (subtitles && subtitles.length > 0) {
          logger.info(`成功获取${lang}语言的字幕`);
          return { subtitles, lang };
        }
      } catch (error) {
        logger.debug(`${lang}语言字幕不可用: ${error.message}`);
        errors.push(`${lang}: ${error.message}`);
        continue;
      }
    }
    
    logger.warn(`所有语言尝试失败: ${errors.join('; ')}`);
    return null;
  }

  async execute(toolName, parameters) {
    if (toolName !== 'get_youtube_transcript') {
      return {
        success: false,
        error: `未知工具: ${toolName}`
      };
    }

    try {
      const { url, lang = 'auto' } = parameters;
      
      // 提取视频ID
      const videoId = this.extractVideoId(url);
      logger.info(`提取YouTube字幕: ${videoId}, 语言偏好: ${lang}`);
      
      // 确定要尝试的语言列表
      let languagesToTry;
      if (lang === 'auto') {
        // 自动模式:尝试中文和英文
        languagesToTry = ['zh', 'zh-Hans', 'zh-CN', 'en'];
      } else {
        // 指定语言:先尝试指定语言,然后尝试常见变体
        languagesToTry = [lang];
        if (lang === 'zh') {
          languagesToTry.push('zh-Hans', 'zh-CN', 'zh-TW');
        } else if (lang === 'en') {
          languagesToTry.push('en-US', 'en-GB');
        }
      }
      
      // 尝试获取字幕
      const result = await this.tryGetSubtitles(videoId, languagesToTry);
      
      if (!result) {
        return {
          success: false,
          error: '未找到字幕',
          details: lang === 'auto' 
            ? '该视频没有中文或英文字幕,请尝试指定其他语言代码(如ja表示日语,ko表示韩语)'
            : `该视频没有${lang}语言的字幕,请尝试其他语言(如zh表示中文,en表示英文)`
        };
      }
      
      // 格式化字幕
      const transcript = this.formatTranscript(result.subtitles);
      
      const content = `**YouTube视频字幕**\n\n` +
                     `🎬 视频ID: ${videoId}\n` +
                     `🌐 语言: ${result.lang}\n` +
                     `📝 字数: ${transcript.length} 字符\n\n` +
                     `**字幕内容:**\n\n${transcript}`;
      
      return {
        success: true,
        content: content,
        metadata: {
          videoId: videoId,
          language: result.lang,
          charCount: transcript.length
        }
      };
      
    } catch (error) {
      logger.error('YouTube字幕提取失败:', error);
      
      if (error.message && error.message.includes('无效的YouTube URL')) {
        return {
          success: false,
          error: error.message,
          details: '请提供有效的YouTube URL或11位视频ID'
        };
      }
      
      if (error.message && error.message.includes('Could not find captions')) {
        return {
          success: false,
          error: '未找到字幕',
          details: '该视频可能没有字幕,或者字幕已被禁用'
        };
      }
      
      return this.handleApiError(error, this.name);
    }
  }

  formatTranscript(subtitles) {
    return subtitles
      .map(sub => sub.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

module.exports = YouTubeService;

