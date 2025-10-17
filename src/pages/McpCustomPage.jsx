import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Filter,
  Settings,
  Power,
  PowerOff,
  Trash2,
  Edit,
  Check,
  X,
  ExternalLink,
  Info,
  Zap,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import './McpCustomPage.css'

/**
 * MCP自定义配置页面
 * 用户可以从模板添加MCP服务，或自定义配置
 */
export default function McpCustomPage() {
  const [templates, setTemplates] = useState([])
  const [categories, setCategories] = useState({})
  const [userConfigs, setUserConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeTab, setActiveTab] = useState('templates')
  const [showAddCustomDialog, setShowAddCustomDialog] = useState(false)

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // 加载模板
      const templatesRes = await fetch('/api/mcp/templates')
      const templatesData = await templatesRes.json()
      if (templatesData.success) {
        setTemplates(templatesData.templates)
        setCategories(templatesData.categories)
      }

      // 加载用户配置
      const configsRes = await fetch('/api/mcp/user-configs')
      const configsData = await configsRes.json()
      if (configsData.success) {
        setUserConfigs(configsData.configs)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 从模板添加服务
  const handleAddFromTemplate = async (templateId, envVars = {}) => {
    try {
      const res = await fetch('/api/mcp/user-configs/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, customEnvVars: envVars })
      })

      const data = await res.json()
      if (data.success) {
        alert('MCP服务添加成功!')
        loadData()
      } else {
        alert(data.message || '添加失败')
      }
    } catch (error) {
      console.error('添加服务失败:', error)
      alert('添加失败，请重试')
    }
  }

  // 切换服务启用状态
  const handleToggleConfig = async (configId) => {
    try {
      const res = await fetch(`/api/mcp/user-configs/${configId}/toggle`, {
        method: 'POST'
      })

      const data = await res.json()
      if (data.success) {
        loadData()
      }
    } catch (error) {
      console.error('切换服务失败:', error)
    }
  }

  // 删除配置
  const handleDeleteConfig = async (configId) => {
    if (!confirm('确定要删除此MCP服务配置吗?')) return

    try {
      const res = await fetch(`/api/mcp/user-configs/${configId}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        alert('删除成功')
        loadData()
      }
    } catch (error) {
      console.error('删除配置失败:', error)
      alert('删除失败，请重试')
    }
  }

  // 过滤模板
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory

    // 检查是否已添加
    const isAdded = userConfigs.some((config) => config.mcp_id === template.id)

    return matchesSearch && matchesCategory && !isAdded
  })

  if (loading) {
    return (
      <div className="mcp-custom-page">
        <div className="mcp-loading">加载中...</div>
      </div>
    )
  }

  return (
    <div className="mcp-custom-page">
      {/* 页面标题 */}
      <div className="mcp-page-header">
        <div>
          <h1 className="mcp-page-title">
            <Zap className="w-6 h-6" />
            MCP 服务管理
          </h1>
          <p className="mcp-page-subtitle">从模板添加MCP服务，或自定义配置自己的服务</p>
        </div>
        <Button onClick={() => setShowAddCustomDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          自定义添加
        </Button>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mcp-tabs">
        <TabsList className="mcp-tabs-list">
          <TabsTrigger value="templates">
            服务模板 ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="my-configs">
            我的服务 ({userConfigs.length})
          </TabsTrigger>
        </TabsList>

        {/* 模板列表标签页 */}
        <TabsContent value="templates" className="mcp-tab-content">
          {/* 搜索和过滤 */}
          <div className="mcp-filters">
            <div className="mcp-search-box">
              <Search className="w-4 h-4 mcp-search-icon" />
              <Input
                type="text"
                placeholder="搜索MCP服务..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mcp-search-input"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="mcp-category-select">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="全部分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {Object.entries(categories).map(([key, cat]) => (
                  <SelectItem key={key} value={key}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 模板卡片网格 */}
          <div className="mcp-grid">
            {filteredTemplates.length === 0 ? (
              <div className="mcp-empty">
                <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                <p>没有找到匹配的服务模板</p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  category={categories[template.category]}
                  onAdd={handleAddFromTemplate}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* 我的配置标签页 */}
        <TabsContent value="my-configs" className="mcp-tab-content">
          {userConfigs.length === 0 ? (
            <div className="mcp-empty">
              <Settings className="w-12 h-12 mb-4 opacity-50" />
              <p>您还没有添加任何MCP服务</p>
              <Button onClick={() => setActiveTab('templates')} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                从模板添加
              </Button>
            </div>
          ) : (
            <div className="mcp-grid">
              {userConfigs.map((config) => (
                <ConfigCard
                  key={config.id}
                  config={config}
                  category={categories[config.category]}
                  onToggle={handleToggleConfig}
                  onDelete={handleDeleteConfig}
                  onEdit={() => {}}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 自定义添加对话框 */}
      <AddCustomDialog
        open={showAddCustomDialog}
        onOpenChange={setShowAddCustomDialog}
        onSuccess={loadData}
      />
    </div>
  )
}

/**
 * 模板卡片组件
 */
function TemplateCard({ template, category, onAdd }) {
  const [showDetails, setShowDetails] = useState(false)
  const [showEnvDialog, setShowEnvDialog] = useState(false)

  const requiresEnv = template.env && Object.keys(template.env).length > 0

  const handleAdd = () => {
    if (requiresEnv) {
      setShowEnvDialog(true)
    } else {
      onAdd(template.id)
    }
  }

  return (
    <>
      <div className="mcp-card">
        <div className="mcp-card-header">
          <div className="mcp-card-icon">{template.icon}</div>
          <div className="mcp-card-title-section">
            <h3 className="mcp-card-title">{template.name}</h3>
            <p className="mcp-card-description">{template.description}</p>
          </div>
        </div>

        <div className="mcp-card-badges">
          {template.official && <Badge variant="default">官方</Badge>}
          {category && <Badge variant="outline">{category.icon} {category.name}</Badge>}
          {template.popularity === 'high' && <Badge variant="secondary">热门</Badge>}
        </div>

        {template.features && template.features.length > 0 && (
          <div className="mcp-card-features">
            {template.features.slice(0, 3).map((feature, index) => (
              <span key={index} className="mcp-feature-tag">
                {feature}
              </span>
            ))}
            {template.features.length > 3 && (
              <span className="mcp-feature-more">+{template.features.length - 3} 更多</span>
            )}
          </div>
        )}

        <div className="mcp-card-actions">
          <Button onClick={handleAdd} className="mcp-add-btn">
            <Plus className="w-4 h-4 mr-2" />
            添加服务
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowDetails(true)}>
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 详情对话框 */}
      <TemplateDetailDialog
        template={template}
        category={category}
        open={showDetails}
        onOpenChange={setShowDetails}
        onAdd={handleAdd}
      />

      {/* 环境变量配置对话框 */}
      <EnvConfigDialog
        template={template}
        open={showEnvDialog}
        onOpenChange={setShowEnvDialog}
        onConfirm={(envVars) => {
          onAdd(template.id, envVars)
          setShowEnvDialog(false)
        }}
      />
    </>
  )
}

/**
 * 配置卡片组件
 */
function ConfigCard({ config, category, onToggle, onDelete, onEdit }) {
  const [showDetails, setShowDetails] = useState(false)
  const [testing, setTesting] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    try {
      const res = await fetch(`/api/mcp/user-configs/${config.id}/test`, {
        method: 'POST'
      })
      const data = await res.json()
      if (data.success) {
        alert(`连接成功! 延迟: ${data.latency}ms`)
      } else {
        alert('连接失败: ' + data.message)
      }
    } catch (error) {
      alert('测试失败: ' + error.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className={`mcp-card ${config.enabled ? 'mcp-card-enabled' : ''}`}>
      <div className="mcp-card-header">
        <div className="mcp-card-icon">{config.icon}</div>
        <div className="mcp-card-title-section">
          <h3 className="mcp-card-title">{config.name}</h3>
          <p className="mcp-card-description">{config.description}</p>
        </div>
        <div className="mcp-card-status">
          {config.enabled ? (
            <Badge variant="default" className="mcp-status-badge">
              <Power className="w-3 h-3 mr-1" />
              已启用
            </Badge>
          ) : (
            <Badge variant="secondary" className="mcp-status-badge">
              <PowerOff className="w-3 h-3 mr-1" />
              已禁用
            </Badge>
          )}
        </div>
      </div>

      <div className="mcp-card-badges">
        {config.official && <Badge variant="default">官方</Badge>}
        {category && <Badge variant="outline">{category.icon} {category.name}</Badge>}
      </div>

      <div className="mcp-card-actions">
        <Button
          variant={config.enabled ? 'secondary' : 'default'}
          size="sm"
          onClick={() => onToggle(config.id)}
        >
          {config.enabled ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleTest} disabled={testing || !config.enabled}>
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowDetails(true)}>
          <Info className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(config.id)} className="text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* 详情对话框 */}
      <ConfigDetailDialog
        config={config}
        category={category}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </div>
  )
}

/**
 * 模板详情对话框
 */
function TemplateDetailDialog({ template, category, open, onOpenChange, onAdd }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mcp-dialog max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">{template.icon}</span>
            <div>
              <div>{template.name}</div>
              <div className="text-sm font-normal text-muted-foreground mt-1">
                {template.description}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div>
            <h4 className="font-semibold mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">分类</span>
                <div className="font-medium">{category?.icon} {category?.name}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">热门程度</span>
                <div className="font-medium">
                  {template.popularity === 'high' ? '⭐⭐⭐' : template.popularity === 'medium' ? '⭐⭐' : '⭐'}
                </div>
              </div>
            </div>
          </div>

          {/* 功能列表 */}
          {template.features && template.features.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">主要功能</h4>
              <div className="grid grid-cols-2 gap-2">
                {template.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 安装说明 */}
          {template.setupInstructions && (
            <div>
              <h4 className="font-semibold mb-3">配置说明</h4>
              <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                {template.setupInstructions.zh || template.setupInstructions.en}
              </div>
            </div>
          )}

          {/* 文档链接 */}
          {template.documentation && (
            <div>
              <h4 className="font-semibold mb-3">文档</h4>
              <a
                href={template.documentation}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-2"
              >
                查看官方文档
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={() => { onAdd(); onOpenChange(false); }}>
            <Plus className="w-4 h-4 mr-2" />
            添加此服务
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 配置详情对话框
 */
function ConfigDetailDialog({ config, category, open, onOpenChange }) {
  const [showEnv, setShowEnv] = useState({})

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mcp-dialog max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <div>{config.name}</div>
              <div className="text-sm font-normal text-muted-foreground mt-1">
                {config.description}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 状态信息 */}
          <div>
            <h4 className="font-semibold mb-3">状态</h4>
            <div className="flex items-center gap-2">
              {config.enabled ? (
                <Badge variant="default">
                  <Power className="w-3 h-3 mr-1" />
                  已启用
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <PowerOff className="w-3 h-3 mr-1" />
                  已禁用
                </Badge>
              )}
            </div>
          </div>

          {/* 配置信息 */}
          <div>
            <h4 className="font-semibold mb-3">配置信息</h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">命令</span>
                <div className="font-mono text-sm bg-muted p-2 rounded">
                  {config.command} {config.args?.join(' ')}
                </div>
              </div>
              {config.env_vars && Object.keys(config.env_vars).length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">环境变量</span>
                  <div className="space-y-1 mt-2">
                    {Object.entries(config.env_vars).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="font-mono text-sm">{key}:</span>
                        <div className="flex items-center gap-2 flex-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                            {showEnv[key] ? value : '••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowEnv({ ...showEnv, [key]: !showEnv[key] })}
                          >
                            {showEnv[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 功能列表 */}
          {config.features && config.features.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">功能</h4>
              <div className="grid grid-cols-2 gap-2">
                {config.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 文档链接 */}
          {config.documentation && (
            <div>
              <h4 className="font-semibold mb-3">文档</h4>
              <a
                href={config.documentation}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-2"
              >
                查看官方文档
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 环境变量配置对话框
 */
function EnvConfigDialog({ template, open, onOpenChange, onConfirm }) {
  const [envVars, setEnvVars] = useState({})
  const [showValues, setShowValues] = useState({})

  useEffect(() => {
    if (open && template.env) {
      const initialEnv = {}
      Object.keys(template.env).forEach((key) => {
        initialEnv[key] = template.env[key] || ''
      })
      setEnvVars(initialEnv)
    }
  }, [open, template])

  const handleSubmit = () => {
    // 验证必填项
    const missingKeys = Object.keys(template.env).filter((key) => !envVars[key])
    if (missingKeys.length > 0) {
      alert(`请填写以下环境变量: ${missingKeys.join(', ')}`)
      return
    }
    onConfirm(envVars)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mcp-dialog">
        <DialogHeader>
          <DialogTitle>配置环境变量</DialogTitle>
          <DialogDescription>
            此服务需要配置环境变量才能正常工作。请填写以下信息:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {template.env &&
            Object.entries(template.env).map(([key, defaultValue]) => (
              <div key={key}>
                <label className="text-sm font-medium">{key}</label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type={showValues[key] ? 'text' : 'password'}
                    value={envVars[key] || ''}
                    onChange={(e) => setEnvVars({ ...envVars, [key]: e.target.value })}
                    placeholder={`输入${key}...`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowValues({ ...showValues, [key]: !showValues[key] })}
                  >
                    {showValues[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            ))}

          {template.setupInstructions && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
                  {template.setupInstructions.zh || template.setupInstructions.en}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            <Plus className="w-4 h-4 mr-2" />
            添加服务
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 自定义添加对话框
 */
function AddCustomDialog({ open, onOpenChange, onSuccess }) {
  const [formData, setFormData] = useState({
    mcp_id: '',
    name: '',
    description: '',
    category: 'other',
    icon: '🔧',
    command: 'npx',
    args: '',
    env_vars: '',
    documentation: ''
  })

  const handleSubmit = async () => {
    try {
      // 验证必填项
      if (!formData.mcp_id || !formData.name || !formData.command) {
        alert('请填写所有必填项')
        return
      }

      // 解析args和env_vars
      let args = []
      let env_vars = {}

      if (formData.args) {
        try {
          args = formData.args.split(' ').filter((s) => s.trim())
        } catch (e) {
          alert('参数格式错误')
          return
        }
      }

      if (formData.env_vars) {
        try {
          env_vars = JSON.parse(formData.env_vars)
        } catch (e) {
          alert('环境变量格式错误，请使用JSON格式')
          return
        }
      }

      const res = await fetch('/api/mcp/user-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          args,
          env_vars
        })
      })

      const data = await res.json()
      if (data.success) {
        alert('添加成功!')
        onOpenChange(false)
        onSuccess()
        // 重置表单
        setFormData({
          mcp_id: '',
          name: '',
          description: '',
          category: 'other',
          icon: '🔧',
          command: 'npx',
          args: '',
          env_vars: '',
          documentation: ''
        })
      } else {
        alert(data.message || '添加失败')
      }
    } catch (error) {
      console.error('添加失败:', error)
      alert('添加失败，请重试')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mcp-dialog max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>自定义添加MCP服务</DialogTitle>
          <DialogDescription>手动配置一个自定义的MCP服务</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">服务ID *</label>
            <Input
              value={formData.mcp_id}
              onChange={(e) => setFormData({ ...formData, mcp_id: e.target.value })}
              placeholder="例如: my-custom-service"
            />
          </div>

          <div>
            <label className="text-sm font-medium">服务名称 *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如: 我的自定义服务"
            />
          </div>

          <div>
            <label className="text-sm font-medium">描述</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="简要描述此服务的功能..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">分类</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">开发工具</SelectItem>
                  <SelectItem value="database">数据库</SelectItem>
                  <SelectItem value="cloud">云服务</SelectItem>
                  <SelectItem value="automation">自动化</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">图标 Emoji</label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="🔧"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">命令 *</label>
            <Input
              value={formData.command}
              onChange={(e) => setFormData({ ...formData, command: e.target.value })}
              placeholder="例如: npx"
            />
          </div>

          <div>
            <label className="text-sm font-medium">参数</label>
            <Input
              value={formData.args}
              onChange={(e) => setFormData({ ...formData, args: e.target.value })}
              placeholder="例如: -y @modelcontextprotocol/server-example"
            />
            <span className="text-xs text-muted-foreground">用空格分隔多个参数</span>
          </div>

          <div>
            <label className="text-sm font-medium">环境变量 (JSON格式)</label>
            <Textarea
              value={formData.env_vars}
              onChange={(e) => setFormData({ ...formData, env_vars: e.target.value })}
              placeholder='{"API_KEY": "your-api-key", "API_URL": "https://api.example.com"}'
              rows={3}
              className="font-mono text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">文档链接</label>
            <Input
              value={formData.documentation}
              onChange={(e) => setFormData({ ...formData, documentation: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            <Plus className="w-4 h-4 mr-2" />
            添加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
