/**
 * 浏览器控制台诊断脚本
 * 
 * 使用方法:
 * 1. 打开你的应用
 * 2. 按F12打开开发者工具
 * 3. 切换到Console标签
 * 4. 复制此文件的全部内容
 * 5. 粘贴到控制台并按回车
 */

(async function checkSystemPrompt() {
  console.log('=== 检查系统提示词配置 ===\n')
  
  const DB_NAME = 'ai-life-system-db'
  const DB_VERSION = 3
  
  try {
    // 打开数据库
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    
    console.log('✅ 数据库连接成功\n')
    
    // 检查系统提示词
    const transaction = db.transaction(['system_prompts'], 'readonly')
    const store = transaction.objectStore('system_prompts')
    const request = store.get('default')
    
    const systemPrompt = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    
    if (systemPrompt) {
      console.log('当前系统提示词配置:')
      console.log('- 模式:', systemPrompt.mode)
      console.log('- 全局提示词:', systemPrompt.globalPrompt ? '已设置' : '未设置')
      
      if (systemPrompt.globalPrompt) {
        console.log('\n全局提示词内容:')
        console.log('---')
        console.log(systemPrompt.globalPrompt)
        console.log('---\n')
        
        // 检查是否包含可能干扰工具调用的内容
        const problematicPatterns = [
          'tool_calls_begin',
          'tool_call_begin',
          'tool_sep',
          'tool_calls_end',
          'tool_call_end',
          '<|',
          '|>',
          'function_call'
        ]
        
        const foundProblems = problematicPatterns.filter(pattern => 
          systemPrompt.globalPrompt.includes(pattern)
        )
        
        if (foundProblems.length > 0) {
          console.log('%c⚠️  发现问题!', 'color: orange; font-weight: bold; font-size: 14px')
          console.log('系统提示词中包含以下可能干扰工具调用的内容:')
          foundProblems.forEach(pattern => console.log(`  - ${pattern}`))
          console.log('\n这些内容会让模型模仿文本格式而不是真正调用工具。')
          console.log('\n%c修复方法:', 'color: green; font-weight: bold')
          console.log('1. 打开应用设置(左下角齿轮图标)')
          console.log('2. 进入"系统提示词"标签')
          console.log('3. 删除或修改包含上述特殊标记的内容')
          console.log('4. 保存后刷新页面')
        } else {
          console.log('%c✅ 系统提示词看起来正常', 'color: green; font-weight: bold')
          console.log('没有发现明显的干扰性内容')
        }
      } else {
        console.log('%c✅ 未设置全局提示词', 'color: green')
      }
    } else {
      console.log('%c✅ 未找到系统提示词配置', 'color: green')
    }
    
    // 检查模型特定提示词
    console.log('\n--- 检查模型特定提示词 ---\n')
    const modelPromptsTransaction = db.transaction(['model_prompts'], 'readonly')
    const modelPromptsStore = modelPromptsTransaction.objectStore('model_prompts')
    const allModelPrompts = await new Promise((resolve, reject) => {
      const req = modelPromptsStore.getAll()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    
    if (allModelPrompts && allModelPrompts.length > 0) {
      console.log(`找到 ${allModelPrompts.length} 个模型特定提示词:`)
      allModelPrompts.forEach(mp => {
        console.log(`\n模型: ${mp.modelKey}`)
        console.log('提示词:', mp.prompt ? '已设置' : '未设置')
        
        if (mp.prompt) {
          const problematicPatterns = [
            'tool_calls_begin',
            'tool_call_begin',
            'tool_sep',
            'tool_calls_end',
            'tool_call_end',
            '<|',
            '|>'
          ]
          
          const foundProblems = problematicPatterns.filter(pattern => 
            mp.prompt.includes(pattern)
          )
          
          if (foundProblems.length > 0) {
            console.log('%c⚠️  发现问题!', 'color: orange; font-weight: bold')
            console.log('包含:', foundProblems.join(', '))
          }
        }
      })
    } else {
      console.log('%c✅ 未找到模型特定提示词', 'color: green')
    }
    
    console.log('\n=== 检查完成 ===')
    
    db.close()
    
  } catch (error) {
    console.error('%c❌ 检查失败:', 'color: red; font-weight: bold', error)
    console.log('\n可能的原因:')
    console.log('1. 数据库尚未初始化(请先打开应用)')
    console.log('2. 浏览器不支持IndexedDB')
    console.log('3. 数据库版本不匹配')
  }
})()

