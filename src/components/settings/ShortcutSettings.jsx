/**
 * 快捷键设置组件
 * 允许用户自定义所有快捷键
 */

import { useState, useEffect } from 'react'
import { Keyboard, RotateCcw, Check, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  shortcutManager,
  SHORTCUT_CATEGORIES,
  getModifierDisplayName,
  currentOS,
  extractShortcutFromEvent,
  isValidShortcut
} from '@/lib/shortcuts'
import './ShortcutSettings.css'

export function ShortcutSettings() {
  const [shortcuts, setShortcuts] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [recordingKey, setRecordingKey] = useState(null)
  const [conflict, setConflict] = useState(null)
  const [filter, setFilter] = useState('all')

  // 加载快捷键配置
  useEffect(() => {
    loadShortcuts()
  }, [])

  const loadShortcuts = () => {
    setShortcuts(shortcutManager.getAllShortcuts())
  }

  // 开始录制快捷键
  const startRecording = (id) => {
    setEditingId(id)
    setRecordingKey(null)
    setConflict(null)
  }

  // 取消录制
  const cancelRecording = () => {
    setEditingId(null)
    setRecordingKey(null)
    setConflict(null)
  }

  // 处理按键事件
  const handleKeyDown = (event, id) => {
    if (!editingId) return

    event.preventDefault()
    event.stopPropagation()

    // 提取快捷键信息
    const { key, modifiers } = extractShortcutFromEvent(event)

    // ESC 取消录制
    if (key === 'escape') {
      cancelRecording()
      return
    }

    // 验证快捷键
    if (!isValidShortcut(key, modifiers)) {
      setConflict({
        type: 'invalid',
        message: '无效的快捷键组合'
      })
      return
    }

    // 检查冲突
    const conflictInfo = shortcutManager.findConflict(id, key, modifiers)
    if (conflictInfo) {
      setConflict({
        type: 'conflict',
        message: `与 "${conflictInfo.name}" 冲突`,
        conflictWith: conflictInfo
      })
      setRecordingKey({ key, modifiers })
      return
    }

    // 无冲突，记录按键
    setRecordingKey({ key, modifiers })
    setConflict(null)
  }

  // 保存快捷键
  const saveShortcut = (id) => {
    if (!recordingKey) {
      cancelRecording()
      return
    }

    const result = shortcutManager.updateShortcut(
      id,
      recordingKey.key,
      recordingKey.modifiers
    )

    if (result.success) {
      loadShortcuts()
      cancelRecording()
    } else if (result.conflict) {
      setConflict({
        type: 'conflict',
        message: `与 "${result.conflict.name}" 冲突`,
        conflictWith: result.conflict
      })
    }
  }

  // 重置快捷键
  const resetShortcut = (id) => {
    shortcutManager.resetShortcut(id)
    loadShortcuts()
  }

  // 重置所有快捷键
  const resetAllShortcuts = () => {
    if (confirm('确定要重置所有快捷键为默认值吗？')) {
      shortcutManager.resetAllShortcuts()
      loadShortcuts()
    }
  }

  // 启用/禁用快捷键
  const toggleShortcut = (id, enabled) => {
    shortcutManager.toggleShortcut(id, enabled)
    loadShortcuts()
  }

  // 格式化快捷键显示
  const formatShortcut = (shortcut) => {
    const parts = []

    for (const modifier of shortcut.modifiers) {
      parts.push(getModifierDisplayName(modifier, currentOS))
    }

    parts.push(shortcut.key.toUpperCase())

    return parts.join(' + ')
  }

  // 按分类分组快捷键
  const groupedShortcuts = {}
  for (const [id, shortcut] of Object.entries(shortcuts)) {
    const category = shortcut.category || 'other'
    if (!groupedShortcuts[category]) {
      groupedShortcuts[category] = []
    }
    groupedShortcuts[category].push({ id, ...shortcut })
  }

  // 过滤快捷键
  const filteredCategories = filter === 'all'
    ? Object.keys(groupedShortcuts)
    : [filter]

  return (
    <div className="shortcut-settings">
      <div className="shortcut-settings-header">
        <div className="shortcut-settings-title">
          <Keyboard className="title-icon" />
          <div>
            <h2>快捷键设置</h2>
            <p className="subtitle">自定义所有快捷键，提升您的工作效率</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={resetAllShortcuts}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          重置所有
        </Button>
      </div>

      {/* 系统信息 */}
      <div className="shortcut-settings-info">
        <div className="info-item">
          <span className="info-label">当前系统:</span>
          <span className="info-value">{currentOS === 'mac' ? 'macOS' : currentOS === 'windows' ? 'Windows' : 'Linux'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">快捷键数量:</span>
          <span className="info-value">{Object.keys(shortcuts).length} 个</span>
        </div>
      </div>

      {/* 分类过滤器 */}
      <div className="shortcut-settings-filter">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          全部
        </button>
        {Object.values(SHORTCUT_CATEGORIES).map((category) => (
          <button
            key={category.id}
            className={`filter-btn ${filter === category.id ? 'active' : ''}`}
            onClick={() => setFilter(category.id)}
          >
            <span className="filter-icon">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* 快捷键列表 */}
      <div className="shortcut-settings-list">
        {filteredCategories.map((categoryId) => {
          const category = SHORTCUT_CATEGORIES[categoryId]
          const items = groupedShortcuts[categoryId] || []

          if (items.length === 0) return null

          return (
            <div key={categoryId} className="shortcut-category">
              <h3 className="category-title">
                <span className="category-icon">{category?.icon}</span>
                {category?.name || '其他'}
              </h3>

              <div className="shortcut-items">
                {items.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className={`shortcut-item ${editingId === shortcut.id ? 'editing' : ''} ${!shortcut.enabled ? 'disabled' : ''}`}
                  >
                    <div className="shortcut-info">
                      <div className="shortcut-name">{shortcut.name}</div>
                      <div className="shortcut-description">{shortcut.description}</div>
                    </div>

                    <div className="shortcut-key-container">
                      {editingId === shortcut.id ? (
                        <div className="shortcut-recording">
                          <input
                            type="text"
                            className="shortcut-input"
                            value={recordingKey ? formatShortcut(recordingKey) : '按下快捷键...'}
                            readOnly
                            autoFocus
                            onKeyDown={(e) => handleKeyDown(e, shortcut.id)}
                            placeholder="按下快捷键 (ESC 取消)"
                          />

                          {conflict && (
                            <div className={`conflict-message ${conflict.type}`}>
                              <AlertCircle className="conflict-icon" />
                              {conflict.message}
                            </div>
                          )}

                          <div className="recording-actions">
                            <button
                              className="recording-btn save"
                              onClick={() => saveShortcut(shortcut.id)}
                              disabled={!recordingKey || conflict}
                              title="保存"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="recording-btn cancel"
                              onClick={cancelRecording}
                              title="取消"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <kbd className="shortcut-key">
                            {formatShortcut(shortcut)}
                          </kbd>

                          <div className="shortcut-actions">
                            <button
                              className="action-btn"
                              onClick={() => startRecording(shortcut.id)}
                              title="编辑快捷键"
                            >
                              编辑
                            </button>
                            <button
                              className="action-btn"
                              onClick={() => resetShortcut(shortcut.id)}
                              title="重置为默认值"
                            >
                              重置
                            </button>
                            <label className="toggle-switch" title={shortcut.enabled ? '禁用' : '启用'}>
                              <input
                                type="checkbox"
                                checked={shortcut.enabled}
                                onChange={(e) => toggleShortcut(shortcut.id, e.target.checked)}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* 帮助提示 */}
      <div className="shortcut-settings-help">
        <h4>💡 使用提示</h4>
        <ul>
          <li>点击"编辑"按钮，然后按下您想要的快捷键组合</li>
          <li>按 ESC 取消录制</li>
          <li>系统会自动检测快捷键冲突</li>
          <li>macOS 用户会看到 ⌘ (Command) 符号，Windows 用户会看到 Ctrl</li>
          <li>禁用的快捷键不会响应按键事件</li>
        </ul>
      </div>
    </div>
  )
}

