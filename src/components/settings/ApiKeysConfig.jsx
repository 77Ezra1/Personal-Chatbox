import { useState, useEffect } from 'react'
import { Key, Check, X, ExternalLink, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './ApiKeysConfig.css'

/**
 * API Keys 配置组件
 * 允许用户配置各种服务的 API Keys
 */
export function ApiKeysConfig({ translate }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingService, setEditingService] = useState(null)
  const [formData, setFormData] = useState({})
  const [showPassword, setShowPassword] = useState({})
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  // 加载服务配置
  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/config/services')
      const data = await response.json()
      
      if (data.success) {
        setServices(data.services)
      }
    } catch (error) {
      console.error('加载服务配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (service) => {
    setEditingService(service.id)
    
    // 初始化表单数据
    const initialData = {}
    service.fields.forEach(field => {
      initialData[field.key] = ''
    })
    setFormData(initialData)
  }

  const handleCancel = () => {
    setEditingService(null)
    setFormData({})
    setShowPassword({})
  }

  const handleSave = async (serviceId) => {
    try {
      setSaving(true)
      
      const response = await fetch(`http://localhost:3001/api/config/service/${serviceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: true,
          ...formData
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // 重新加载服务列表
        await loadServices()
        handleCancel()
        alert('配置保存成功!')
      } else {
        alert(`保存失败: ${data.error}`)
      }
    } catch (error) {
      console.error('保存配置失败:', error)
      alert('保存失败,请检查网络连接')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (serviceId) => {
    try {
      setTesting(true)
      
      const response = await fetch(`http://localhost:3001/api/config/service/${serviceId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('连接测试成功!')
      } else {
        alert(`测试失败: ${data.error}`)
      }
    } catch (error) {
      console.error('测试失败:', error)
      alert('测试失败,请检查配置是否正确')
    } finally {
      setTesting(false)
    }
  }

  const handleDelete = async (serviceId) => {
    if (!confirm('确定要删除此服务的配置吗?')) {
      return
    }
    
    try {
      const response = await fetch(`http://localhost:3001/api/config/service/${serviceId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadServices()
        alert('配置已删除')
      } else {
        alert(`删除失败: ${data.error}`)
      }
    } catch (error) {
      console.error('删除配置失败:', error)
      alert('删除失败,请检查网络连接')
    }
  }

  const togglePasswordVisibility = (fieldKey) => {
    setShowPassword(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }))
  }

  if (loading) {
    return (
      <div className="api-keys-loading">
        <Loader2 className="spinner" />
        <p>加载配置中...</p>
      </div>
    )
  }

  return (
    <div className="api-keys-config">
      <div className="api-keys-header">
        <Key className="icon" />
        <div>
          <h2>API Keys 配置</h2>
          <p>配置各种服务的 API Keys 和凭据</p>
        </div>
      </div>

      <div className="services-list">
        {services.map(service => (
          <div key={service.id} className="service-card">
            <div className="service-header">
              <div className="service-info">
                <h3>{service.name}</h3>
                <p>{service.description}</p>
              </div>
              <div className="service-status">
                {service.configured ? (
                  <span className="status-badge configured">
                    <Check size={14} />
                    已配置
                  </span>
                ) : (
                  <span className="status-badge unconfigured">
                    <X size={14} />
                    未配置
                  </span>
                )}
              </div>
            </div>

            {editingService === service.id ? (
              <div className="service-form">
                {service.fields.map(field => (
                  <div key={field.key} className="form-field">
                    <label>
                      {field.label}
                      {field.required && <span className="required">*</span>}
                    </label>
                    
                    {field.type === 'select' ? (
                      <select
                        value={formData[field.key] || field.default || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          [field.key]: e.target.value
                        }))}
                      >
                        {field.options?.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="input-with-toggle">
                        <input
                          type={field.type === 'password' && !showPassword[field.key] ? 'password' : 'text'}
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [field.key]: e.target.value
                          }))}
                          placeholder={field.placeholder}
                        />
                        {field.type === 'password' && (
                          <button
                            type="button"
                            className="toggle-password"
                            onClick={() => togglePasswordVisibility(field.key)}
                          >
                            {showPassword[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        )}
                      </div>
                    )}
                    
                    {field.helpUrl && (
                      <a
                        href={field.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="help-link"
                      >
                        <ExternalLink size={12} />
                        获取 {field.label}
                      </a>
                    )}
                  </div>
                ))}

                <div className="form-actions">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving || testing}
                  >
                    取消
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleTest(service.id)}
                    disabled={saving || testing}
                  >
                    {testing ? <Loader2 className="spinner" size={16} /> : null}
                    测试连接
                  </Button>
                  <Button
                    onClick={() => handleSave(service.id)}
                    disabled={saving || testing}
                  >
                    {saving ? <Loader2 className="spinner" size={16} /> : null}
                    保存
                  </Button>
                </div>
              </div>
            ) : (
              <div className="service-actions">
                <Button
                  variant="outline"
                  onClick={() => handleEdit(service)}
                >
                  {service.configured ? '修改配置' : '配置'}
                </Button>
                {service.configured && (
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(service.id)}
                  >
                    删除配置
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

