// 测试配置加载
import { PROVIDERS } from './src/lib/constants.js';
import { loadStoredModelState, buildModelConfigFromState } from './src/lib/modelConfig.js';

console.log('=== 测试配置加载 ===');

// 模拟localStorage
const mockLocalStorage = {
  'model-config.v1': JSON.stringify({
    lastProvider: 'deepseek',
    providers: {
      deepseek: {
        models: {
          'deepseek-chat': {
            apiKey: 'sk-03db8009812649359e2f83cc738861aa',
            temperature: 0.7,
            maxTokens: 1024,
            supportsDeepThinking: false,
            thinkingMode: 'disabled'
          }
        }
      }
    }
  })
};

// 模拟window.localStorage
global.window = {
  localStorage: {
    getItem: (key) => mockLocalStorage[key] || null,
    setItem: (key, value) => { mockLocalStorage[key] = value; }
  }
};

console.log('1. PROVIDERS配置:');
console.log('DeepSeek端点:', PROVIDERS.deepseek?.endpoint);

console.log('\n2. 模拟localStorage配置:');
console.log(mockLocalStorage['model-config.v1']);

try {
  console.log('\n3. 加载配置状态:');
  const { initialProvider, initialModel, savedProviders } = loadStoredModelState({});
  console.log('初始提供商:', initialProvider);
  console.log('初始模型:', initialModel);
  console.log('保存的提供商:', JSON.stringify(savedProviders, null, 2));

  console.log('\n4. 构建模型配置:');
  const modelConfig = buildModelConfigFromState(savedProviders, initialProvider, initialModel, {});
  console.log('最终模型配置:', JSON.stringify(modelConfig, null, 2));

  console.log('\n5. 端点验证:');
  const endpoint = PROVIDERS[initialProvider]?.endpoint;
  console.log('应该使用的端点:', endpoint);
  
} catch (error) {
  console.error('配置加载错误:', error);
}
