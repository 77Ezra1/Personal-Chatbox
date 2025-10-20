/**
 * 聊天功能诊断脚本
 * 帮助诊断为什么配置API后发送消息没有反应
 */

console.log('========================================')
console.log('聊天功能诊断工具')
console.log('========================================\n')

// 1. 检查后端配置文件
console.log('1. 检查后端 API 配置...')
const fs = require('fs')
const path = require('path')

const configPath = path.join(__dirname, 'data', 'user-config.json')

try {
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    console.log('   ✓ 配置文件存在')
    console.log('   路径:', configPath)
    
    if (config.deepseek) {
      console.log('   DeepSeek 配置:')
      console.log('     - enabled:', config.deepseek.enabled)
      console.log('     - hasApiKey:', !!config.deepseek.apiKey)
      console.log('     - apiKey 长度:', config.deepseek.apiKey ? config.deepseek.apiKey.length : 0)
      console.log('     - model:', config.deepseek.model)
    } else {
      console.log('   ✗ DeepSeek 未配置')
    }
  } else {
    console.log('   ✗ 配置文件不存在:', configPath)
  }
} catch (error) {
  console.log('   ✗ 读取配置文件失败:', error.message)
}

console.log('\n2. 测试后端 API 连接...')
console.log('   运行以下命令测试:')
console.log('   ```bash')
console.log('   curl -X POST http://localhost:3001/api/chat \\')
console.log('     -H "Content-Type: application/json" \\')
console.log('     -d \'{"messages":[{"role":"user","content":"你好"}],"model":"deepseek-chat","stream":false}\'')
console.log('   ```')

console.log('\n3. 前端调试步骤:')
console.log('   1) 打开浏览器开发者工具 (F12)')
console.log('   2) 切换到 Console 标签')
console.log('   3) 发送一条测试消息')
console.log('   4) 查看是否有以下日志:')
console.log('      - [aiClient] generateAIResponse called')
console.log('      - [aiClient] Using DeepSeek with backend API')
console.log('      - [callDeepSeekMCP] Calling backend MCP API')
console.log('   5) 切换到 Network 标签')
console.log('   6) 查找 /api/chat 请求')
console.log('   7) 检查请求状态码和响应内容')

console.log('\n4. 常见问题检查清单:')
console.log('   [ ] 后端服务是否正在运行? (ps aux | grep node)')
console.log('   [ ] 端口3001是否被占用? (lsof -i :3001)')
console.log('   [ ] 前端是否成功连接到后端? (检查Network请求)')
console.log('   [ ] API key 是否有效? (通过设置页面测试)')
console.log('   [ ] 浏览器控制台是否有JavaScript错误?')
console.log('   [ ] 输入框是否有内容? (空消息不会发送)')

console.log('\n5. 需要提供的调试信息:')
console.log('   如果问题仍然存在,请提供:')
console.log('   - 浏览器 Console 的完整日志')
console.log('   - Network 标签中 /api/chat 请求的详细信息')
console.log('   - 服务器控制台的日志输出')
console.log('   - 截图显示问题的具体表现')

console.log('\n========================================')
console.log('运行完成')
console.log('========================================')
