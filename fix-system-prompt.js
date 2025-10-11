/**
 * 修复系统提示词问题
 * 检查并清除可能干扰MCP工具调用的系统提示词
 */

import { openDatabase } from './src/lib/db/index.js'
import { STORES } from './src/lib/db/schema.js'

async function checkAndFixSystemPrompt() {
  console.log('=== 检查系统提示词配置 ===\n')
  
  try {
    const db = await openDatabase()
    
    // 检查系统提示词
    const transaction = db.transaction([STORES.SYSTEM_PROMPTS], 'readonly')
    const store = transaction.objectStore(STORES.SYSTEM_PROMPTS)
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
          console.log('⚠️  发现问题!')
          console.log('系统提示词中包含以下可能干扰工具调用的内容:')
          foundProblems.forEach(pattern => console.log(`  - ${pattern}`))
          console.log('\n这些内容会让模型模仿文本格式而不是真正调用工具。')
          console.log('\n建议: 删除或修改系统提示词中关于工具调用的示例。')
          console.log('你可以在应用的"设置 > 系统提示词"中修改。')
        } else {
          console.log('✅ 系统提示词看起来正常,没有发现明显问题。')
        }
      } else {
        console.log('✅ 未设置全局提示词')
      }
    } else {
      console.log('✅ 未找到系统提示词配置')
    }
    
    // 检查模型特定提示词
    console.log('\n--- 检查模型特定提示词 ---\n')
    const modelPromptsTransaction = db.transaction([STORES.MODEL_PROMPTS], 'readonly')
    const modelPromptsStore = modelPromptsTransaction.objectStore(STORES.MODEL_PROMPTS)
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
            console.log('⚠️  发现问题! 包含:', foundProblems.join(', '))
          }
        }
      })
    } else {
      console.log('✅ 未找到模型特定提示词')
    }
    
    console.log('\n=== 检查完成 ===')
    
  } catch (error) {
    console.error('检查失败:', error)
  }
}

checkAndFixSystemPrompt()

