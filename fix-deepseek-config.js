// 完整的DeepSeek配置修复脚本
console.log('=== DeepSeek配置修复脚本 ===');

// 1. 清除所有可能冲突的配置
console.log('1. 清除旧配置...');
localStorage.removeItem('model-config.v1');
localStorage.removeItem('custom-models.v1');
localStorage.removeItem('indexeddb_migrated');
localStorage.removeItem('localStorage_backup');

// 2. 设置正确的DeepSeek配置
console.log('2. 设置DeepSeek配置...');
const deepseekConfig = {
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
};

localStorage.setItem('model-config.v1', JSON.stringify(deepseekConfig));

// 3. 设置自定义模型
console.log('3. 设置自定义模型...');
const customModels = {
  deepseek: ['deepseek-chat', 'deepseek-reasoner']
};
localStorage.setItem('custom-models.v1', JSON.stringify(customModels));

// 4. 验证配置
console.log('4. 验证配置...');
const savedConfig = JSON.parse(localStorage.getItem('model-config.v1'));
console.log('保存的配置:', savedConfig);

const savedModels = JSON.parse(localStorage.getItem('custom-models.v1'));
console.log('保存的模型:', savedModels);

// 5. 重新加载页面
console.log('5. 重新加载页面...');
setTimeout(() => {
  location.reload();
}, 1000);

console.log('=== 配置修复完成 ===');
