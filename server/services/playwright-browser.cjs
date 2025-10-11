const BaseService = require('./base.cjs');
const { chromium } = require('playwright');

class PlaywrightBrowserService extends BaseService {
  constructor(config) {
    super(config);
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  getInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      enabled: this.enabled,
      loaded: this.loaded,
      version: '1.0.0',
      author: 'AI-Life-system',
      tools: this.getTools().map(tool => ({
        name: tool.name,
        description: tool.description
      }))
    };
  }

  getTools() {
    if (!this.enabled) {
      return [];
    }
    
    return [
      {
        type: 'function',
        function: {
          name: 'navigate_to_url',
          description: '导航到指定的URL',
          parameters: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: '要访问的URL地址'
              }
            },
            required: ['url']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_page_content',
          description: '获取当前页面的文本内容',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'click_element',
          description: '点击页面上的元素',
          parameters: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS选择器或文本选择器'
              }
            },
            required: ['selector']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'fill_input',
          description: '填写输入框',
          parameters: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS选择器'
              },
              text: {
                type: 'string',
                description: '要填写的文本'
              }
            },
            required: ['selector', 'text']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'take_screenshot',
          description: '截取当前页面的屏幕截图',
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: '保存截图的路径(可选)'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'close_browser',
          description: '关闭浏览器',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      }
    ];
  }

  async ensureBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();
    }
    return this.page;
  }

  async execute(toolName, parameters) {
    try {
      switch (toolName) {
        case 'navigate_to_url':
          return await this.navigateToUrl(parameters.url);
        
        case 'get_page_content':
          return await this.getPageContent();
        
        case 'click_element':
          return await this.clickElement(parameters.selector);
        
        case 'fill_input':
          return await this.fillInput(parameters.selector, parameters.text);
        
        case 'take_screenshot':
          return await this.takeScreenshot(parameters.path);
        
        case 'close_browser':
          return await this.closeBrowser();
        
        default:
          throw new Error(`未知的工具: ${toolName}`);
      }
    } catch (error) {
      console.error(`[PlaywrightBrowserService] 执行工具 ${toolName} 失败:`, error);
      throw error;
    }
  }

  async navigateToUrl(url) {
    const page = await this.ensureBrowser();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const title = await page.title();
    return {
      success: true,
      message: `成功导航到: ${url}`,
      title: title,
      url: page.url()
    };
  }

  async getPageContent() {
    const page = await this.ensureBrowser();
    const content = await page.textContent('body');
    const title = await page.title();
    return {
      success: true,
      title: title,
      url: page.url(),
      content: content.substring(0, 5000) // 限制返回内容长度
    };
  }

  async clickElement(selector) {
    const page = await this.ensureBrowser();
    await page.click(selector, { timeout: 10000 });
    return {
      success: true,
      message: `成功点击元素: ${selector}`
    };
  }

  async fillInput(selector, text) {
    const page = await this.ensureBrowser();
    await page.fill(selector, text, { timeout: 10000 });
    return {
      success: true,
      message: `成功填写输入框: ${selector}`
    };
  }

  async takeScreenshot(path) {
    const page = await this.ensureBrowser();
    const screenshotPath = path || `/tmp/screenshot-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return {
      success: true,
      message: '截图成功',
      path: screenshotPath
    };
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
      return {
        success: true,
        message: '浏览器已关闭'
      };
    }
    return {
      success: true,
      message: '浏览器未启动'
    };
  }
}

module.exports = PlaywrightBrowserService;

