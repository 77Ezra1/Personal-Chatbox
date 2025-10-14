import React, { useState, useEffect } from 'react'
import { Settings, FolderOpen, Database, Plus, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import { createLogger } from '../../lib/logger'
const logger = createLogger('McpPathConfigDialog')


/**
 * MCP服务路径配置对话框
 * 用于配置SQLite数据库路径和Filesystem允许目录
 */
export function McpPathConfigDialog({ service, onSave }) {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState({
    databasePath: '',
    allowedDirectories: []
  })
  const [newDirectory, setNewDirectory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // 加载现有配置
  useEffect(() => {
    if (open && service) {
      loadConfig()
    }
  }, [open, service])

  const loadConfig = async () => {
    try {
      const response = await fetch(`/api/config/service/${service.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.config) {
          setConfig({
            databasePath: data.config.databasePath || '',
            allowedDirectories: data.config.allowedDirectories || []
          })
        }
      }
    } catch (err) {
      logger.error('加载配置失败:', err)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const configData = service.id === 'sqlite' 
        ? { databasePath: config.databasePath }
        : { allowedDirectories: config.allowedDirectories }

      const response = await fetch(`/api/config/service/${service.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      })

      const data = await response.json()

      if (data.success) {
        setOpen(false)
        if (onSave) {
          onSave(configData)
        }
        alert('配置保存成功！服务将在下次重启时生效。')
      } else {
        setError(data.error || '保存失败')
      }
    } catch (err) {
      logger.error('保存配置失败:', err)
      setError('保存失败，请检查网络连接')
    } finally {
      setSaving(false)
    }
  }

  const handleAddDirectory = () => {
    if (newDirectory.trim() && !config.allowedDirectories.includes(newDirectory.trim())) {
      setConfig({
        ...config,
        allowedDirectories: [...config.allowedDirectories, newDirectory.trim()]
      })
      setNewDirectory('')
    }
  }

  const handleRemoveDirectory = (index) => {
    setConfig({
      ...config,
      allowedDirectories: config.allowedDirectories.filter((_, i) => i !== index)
    })
  }

  // 如果服务不需要路径配置，不显示按钮
  if (!service || (service.id !== 'sqlite' && service.id !== 'filesystem')) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="ml-2">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {service.id === 'sqlite' ? (
              <Database className="w-5 h-5" />
            ) : (
              <FolderOpen className="w-5 h-5" />
            )}
            {service.name} 配置
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {service.id === 'sqlite' && (
            <div className="space-y-2">
              <Label htmlFor="database-path">数据库文件路径</Label>
              <Input
                id="database-path"
                type="text"
                placeholder="/path/to/database.db"
                value={config.databasePath}
                onChange={(e) => setConfig({ ...config, databasePath: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                请输入SQLite数据库文件的完整路径
              </p>
            </div>
          )}

          {service.id === 'filesystem' && (
            <div className="space-y-2">
              <Label>允许访问的目录</Label>
              <div className="space-y-2">
                {config.allowedDirectories.map((dir, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex-1 justify-between">
                      <span className="truncate">{dir}</span>
                      <button
                        onClick={() => handleRemoveDirectory(index)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="/path/to/directory"
                  value={newDirectory}
                  onChange={(e) => setNewDirectory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDirectory()}
                />
                <Button onClick={handleAddDirectory} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                添加文件系统服务可以访问的目录
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存配置'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

