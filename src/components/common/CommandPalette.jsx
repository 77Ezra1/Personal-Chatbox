import { useState, useEffect, useCallback } from 'react'
import { Command } from 'cmdk'
import { Search, Zap, X } from 'lucide-react'
import { commandManager, COMMAND_CATEGORIES } from '@/lib/commands'
import { createLogger } from '@/lib/logger'
import './CommandPalette.css'

const logger = createLogger('CommandPalette')

/**
 * 快捷指令面板
 * 使用 cmdk 实现的指令选择器
 */
export function CommandPalette({ open, onClose, onExecuteCommand, context }) {
  const [search, setSearch] = useState('')
  const [commands, setCommands] = useState([])

  // 加载指令列表
  useEffect(() => {
    if (open) {
      setCommands(commandManager.getAllCommands())
      setSearch('')
    }
  }, [open])

  // 搜索指令
  useEffect(() => {
    if (search) {
      const filtered = commandManager.searchCommands(search)
      setCommands(filtered)
    } else {
      setCommands(commandManager.getAllCommands())
    }
  }, [search])

  // 执行指令
  const handleSelectCommand = useCallback(async (commandId) => {
    const command = commands.find(cmd => cmd.id === commandId)
    if (!command) return

    logger.log('选择指令:', command.name)

    try {
      // 关闭面板
      onClose()

      // 如果指令需要参数，显示参数输入
      if (command.parameters && command.parameters.some(p => p.required)) {
        // TODO: 显示参数输入对话框
        logger.warn('指令需要参数:', command.parameters)
        onExecuteCommand?.(command, {})
      } else {
        // 直接执行
        onExecuteCommand?.(command, {})
      }
    } catch (error) {
      logger.error('执行指令失败:', error)
    }
  }, [commands, onClose, onExecuteCommand])

  // 键盘事件
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }, [onClose])

  if (!open) return null

  // 按分类组织指令
  const groupedCommands = {}
  commands.forEach(cmd => {
    const categoryId = cmd.category.id
    if (!groupedCommands[categoryId]) {
      groupedCommands[categoryId] = []
    }
    groupedCommands[categoryId].push(cmd)
  })

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div
        className="command-palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <Command label="指令面板">
          {/* 搜索输入 */}
          <div className="command-search">
            <Search className="command-search-icon" size={18} />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="输入指令名称或 / 搜索..."
              autoFocus
            />
            {search && (
              <button
                className="command-search-clear"
                onClick={() => setSearch('')}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* 指令列表 */}
          <Command.List>
            {commands.length === 0 ? (
              <Command.Empty>
                <div className="command-empty">
                  <Zap size={32} opacity={0.3} />
                  <p>未找到匹配的指令</p>
                  <small>尝试其他关键词</small>
                </div>
              </Command.Empty>
            ) : (
              <>
                {Object.entries(groupedCommands).map(([categoryId, categoryCommands]) => {
                  const category = Object.values(COMMAND_CATEGORIES).find(
                    c => c.id === categoryId
                  )

                  return (
                    <Command.Group key={categoryId} heading={`${category.icon} ${category.name}`}>
                      {categoryCommands.map(cmd => (
                        <Command.Item
                          key={cmd.id}
                          value={cmd.id}
                          onSelect={() => handleSelectCommand(cmd.id)}
                          keywords={[cmd.trigger, ...cmd.aliases || []]}
                        >
                          <div className="command-item">
                            <div className="command-item-icon">{cmd.icon}</div>
                            <div className="command-item-content">
                              <div className="command-item-header">
                                <span className="command-item-name">{cmd.name}</span>
                                <span className="command-item-trigger">{cmd.trigger}</span>
                              </div>
                              <div className="command-item-description">
                                {cmd.description}
                              </div>
                              {cmd.parameters && cmd.parameters.length > 0 && (
                                <div className="command-item-params">
                                  {cmd.parameters.map(param => (
                                    <span key={param.name} className="command-param">
                                      {param.name}
                                      {param.required && '*'}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {cmd.shortcut && (
                              <div className="command-item-shortcut">
                                {cmd.shortcut}
                              </div>
                            )}
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )
                })}
              </>
            )}
          </Command.List>
        </Command>

        {/* 底部提示 */}
        <div className="command-footer">
          <div className="command-footer-hint">
            <kbd>↑↓</kbd> 导航
            <kbd>Enter</kbd> 选择
            <kbd>Esc</kbd> 关闭
          </div>
          <div className="command-footer-count">
            {commands.length} 个指令
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 指令帮助对话框
 */
export function CommandHelpDialog({ open, onClose }) {
  if (!open) return null

  const categories = Object.values(COMMAND_CATEGORIES)
  const allCommands = commandManager.getAllCommands()

  return (
    <div className="command-help-overlay" onClick={onClose}>
      <div className="command-help-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="command-help-header">
          <h2>⚡ 快捷指令帮助</h2>
          <button className="command-help-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="command-help-content">
          <div className="command-help-intro">
            <p>使用快捷指令可以快速执行常用操作，提升使用效率。</p>
            <div className="command-help-triggers">
              <div className="help-trigger-item">
                <kbd>/</kbd>
                <span>在输入框开头输入 / 触发指令</span>
              </div>
              <div className="help-trigger-item">
                <kbd>Ctrl+K</kbd>
                <span>打开指令面板</span>
              </div>
            </div>
          </div>

          {categories.map(category => {
            const categoryCommands = allCommands.filter(
              cmd => cmd.category.id === category.id
            )

            if (categoryCommands.length === 0) return null

            return (
              <div key={category.id} className="command-help-category">
                <h3>{category.icon} {category.name}</h3>
                <div className="command-help-list">
                  {categoryCommands.map(cmd => (
                    <div key={cmd.id} className="command-help-item">
                      <div className="command-help-item-header">
                        <span className="command-help-icon">{cmd.icon}</span>
                        <code className="command-help-trigger">{cmd.trigger}</code>
                        <span className="command-help-name">{cmd.name}</span>
                      </div>
                      <p className="command-help-desc">{cmd.description}</p>
                      {cmd.aliases && cmd.aliases.length > 0 && (
                        <div className="command-help-aliases">
                          别名: {cmd.aliases.map(alias => (
                            <code key={alias}>{alias}</code>
                          ))}
                        </div>
                      )}
                      {cmd.parameters && cmd.parameters.length > 0 && (
                        <div className="command-help-params">
                          参数: {cmd.parameters.map(param => (
                            <span key={param.name} className="command-help-param">
                              {param.name}
                              {param.required && <span className="required">*</span>}
                              {param.description && ` - ${param.description}`}
                            </span>
                          ))}
                        </div>
                      )}
                      {cmd.shortcut && (
                        <div className="command-help-shortcut">
                          快捷键: <kbd>{cmd.shortcut}</kbd>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

