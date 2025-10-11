// 完整的配置修复脚本
console.log('开始修复DeepSeek配置...')

// 1. 清除所有相关的localStorage配置
const keysToRemove = [
  'model-config.v1',
  'modelConfig',
  'ai-chat-config',
  'deepseek-config'
]

keysToRemove.forEach(key => {
  localStorage.removeItem(key)
  console.log(`已清除: ${key}`)
})

// 2. 设置正确的配置格式
const correctConfig = {
  "version": 1,
  "lastProvider": "deepseek",
  "providers": {
    "deepseek": {
      "apiKey": "sk-03db8009812649359e2f83cc738861aa",
      "activeModel": "deepseek-chat",
      "models": {
        "deepseek-chat": {
          "temperature": 0.7,
          "maxTokens": 1024,
          "supportsDeepThinking": false,
          "thinkingMode": "disabled"
        }
      }
    }
  }
}

// 3. 保存配置
localStorage.setItem('model-config.v1', JSON.stringify(correctConfig))
console.log('已设置正确的配置:', correctConfig)

// 4. 验证配置
const savedConfig = JSON.parse(localStorage.getItem('model-config.v1'))
console.log('验证保存的配置:', savedConfig)

// 5. 强制刷新页面
console.log('配置修复完成，即将刷新页面...')
setTimeout(() => {
  window.location.reload()
}, 1000)
