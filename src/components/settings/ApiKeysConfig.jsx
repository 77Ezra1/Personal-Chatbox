import { useState, useEffect } from 'react'
import { Key, Check, X, ExternalLink, Eye, EyeOff, Loader2, Shield, ShieldOff, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PasswordSetupDialog } from './PasswordSetupDialog'
import { SecureStorage } from '@/lib/secure-storage'
import './ApiKeysConfig.css'

import { createLogger } from '../../lib/logger'
const logger = createLogger('ApiKeysConfig')


/**
 * API Keys 配置组件
 * 允许用户配置各种服务的 API Keys，支持加密存储
 */
export function ApiKeysConfig({ translate }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingService, setEditingService] = useState(null)
  const [formData, setFormData] = useState({})
  const [showPassword, setShowPassword] = useState({})
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  
  // 加密相关状态
  const [encryptionEnabled, setEncryptionEnabled] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [passwordDialog, setPasswordDialog] = useState({ open: false, mode: 'setup' })
  const [sessionPassword, setSessionPassword] = useState(null)
  const [secureStorage] = useState(() => new SecureStorage('api_keys_encrypted'))
  
  // 会话超时 (15分钟)
  const SESSION_TIMEOUT = 15 * 60 * 1000

  // 加载服务配置
  useEffect(() => {
    loadServices()
    checkEncryptionStatus()
  }, [])
  
  // 会话超时自动锁定
  useEffect(() => {
    if (!isUnlocked || !sessionPassword) return
    
    const timer = setTimeout(() => {
      handleLock()
    }, SESSION_TIMEOUT)
    
    return () => clearTimeout(timer)
  }, [isUnlocked, sessionPassword])
  
  // 检查加密状态
  const checkEncryptionStatus = () => {
    const encrypted = localStorage.getItem('api_keys_encrypted')
    const enabled = localStorage.getItem('encryption_enabled') === 'true'
    setEncryptionEnabled(enabled)
    setIsUnlocked(!enabled || !!sessionPassword)
  }
  
  // 切换加密功能
  const handleToggleEncryption = async (enabled) => {
    if (enabled) {
      // 启用加密 - 需要设置密码
      setPasswordDialog({ open: true, mode: 'setup' })
    } else {
      // 禁用加密 - 需要先验证密码解密数据
      if (encryptionEnabled) {
        setPasswordDialog({ open: true, mode: 'verify' })
      } else {
        setEncryptionEnabled(false)
        localStorage.setItem('encryption_enabled', 'false')
      }
    }
  }
  
  // 密码确认回调
  const handlePasswordConfirm = async (password) => {
    const { mode } = passwordDialog
    
    try {
      if (mode === 'setup') {
        // 首次设置密码 - 加密现有数据
        await encryptExistingData(password)
        setEncryptionEnabled(true)
        setIsUnlocked(true)
        setSessionPassword(password)
        localStorage.setItem('encryption_enabled', 'true')
        alert('加密已启用！您的 API 密钥现在得到保护。')
      } else if (mode === 'verify') {
        // 验证密码 - 解锁或禁用加密
        const valid = await verifyPassword(password)
        if (valid) {
          if (passwordDialog.action === 'disable') {
            // 禁用加密 - 解密数据到明文
            await decryptToPlaintext(password)
            setEncryptionEnabled(false)
            setIsUnlocked(true)
            setSessionPassword(null)
            localStorage.setItem('encryption_enabled', 'false')
            alert('加密已禁用，数据已解密为明文存储。')
          } else {
            // 解锁访问
            setIsUnlocked(true)
            setSessionPassword(password)
          }
        } else {
          alert('密码错误，请重试')
        }
      } else if (mode === 'change') {
        // 修改密码
        await reencryptData(sessionPassword, password)
        setSessionPassword(password)
        alert('密码已修改！')
      }
    } catch (error) {
      logger.error('密码操作失败:', error)
      alert('操作失败：' + error.message)
    }
  }
  
  // 加密现有明文数据
  const encryptExistingData = async (password) => {
    try {
      // 查找所有明文存储的 API 密钥
      const plaintextKeys = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key.startsWith('api_key_') || key.startsWith('service_')) {
          plaintextKeys[key] = localStorage.getItem(key)
        }
      }
      
      if (Object.keys(plaintextKeys).length > 0) {
        // 加密保存
        await secureStorage.save(plaintextKeys, password)
        
        // 删除明文数据
        Object.keys(plaintextKeys).forEach(key => {
          localStorage.removeItem(key)
        })
        
        logger.log(`已加密 ${Object.keys(plaintextKeys).length} 个密钥`)
      }
    } catch (error) {
      logger.error('加密数据失败:', error)
      throw error
    }
  }
  
  // 验证密码
  const verifyPassword = async (password) => {
    try {
      await secureStorage.load(password)
      return true
    } catch (error) {
      return false
    }
  }
  
  // 解密到明文
  const decryptToPlaintext = async (password) => {
    try {
      const data = await secureStorage.load(password)
      
      // 恢复到明文存储
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, value)
      })
      
      // 删除加密数据
      secureStorage.clear()
      
      logger.log(`已解密 ${Object.keys(data).length} 个密钥到明文`)
    } catch (error) {
      logger.error('解密失败:', error)
      throw error
    }
  }
  
  // 重新加密数据（修改密码）
  const reencryptData = async (oldPassword, newPassword) => {
    try {
      // 使用旧密码解密
      const data = await secureStorage.load(oldPassword)
      
      // 使用新密码加密
      await secureStorage.save(data, newPassword)
      
      logger.log('密码已修改')
    } catch (error) {
      logger.error('重新加密失败:', error)
      throw error
    }
  }
  
  // 锁定（清除会话密码）
  const handleLock = () => {
    setIsUnlocked(false)
    setSessionPassword(null)
    setEditingService(null)
    setFormData({})
    alert('会话已锁定，请重新输入密码以访问 API 密钥')
  }
  
  // 解锁
  const handleUnlock = () => {
    setPasswordDialog({ open: true, mode: 'verify', action: 'unlock' })
  }

  const loadServices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/config/services')
      const data = await response.json()
      
      if (data.success) {
        setServices(data.services)
      }
    } catch (error) {
      logger.error('加载服务配置失败:', error)
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
      
      const response = await fetch(`/api/config/service/${serviceId}`, {
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
      logger.error('保存配置失败:', error)
      alert('保存失败,请检查网络连接')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (serviceId) => {
    try {
      setTesting(true)
      
      const response = await fetch(`/api/config/service/${serviceId}/test`, {
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
      logger.error('测试失败:', error)
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
      const response = await fetch(`/api/config/service/${serviceId}`, {
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
      logger.error('删除配置失败:', error)
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
    <>
      {/* 密码对话框 */}
      <PasswordSetupDialog
        open={passwordDialog.open}
        mode={passwordDialog.mode}
        onClose={() => setPasswordDialog({ ...passwordDialog, open: false })}
        onConfirm={handlePasswordConfirm}
      />
      
      <div className="api-keys-config">
        <div className="api-keys-header">
          <Key className="icon" />
          <div>
            <h2>API Keys 配置</h2>
            <p>配置各种服务的 API Keys 和凭据</p>
          </div>
        </div>
        
        {/* 加密控制面板 */}
        <div className="encryption-panel">
          <div className="encryption-header">
            {encryptionEnabled ? (
              <Shield className="icon-enabled" size={20} />
            ) : (
              <ShieldOff className="icon-disabled" size={20} />
            )}
            <div>
              <h3>加密保护</h3>
              <p>
                {encryptionEnabled
                  ? '您的 API 密钥已使用 AES-256 加密保护'
                  : '启用加密以保护您的 API 密钥'}
              </p>
            </div>
            <label className="encryption-toggle">
              <input
                type="checkbox"
                checked={encryptionEnabled}
                onChange={(e) => handleToggleEncryption(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          {encryptionEnabled && (
            <div className="encryption-status">
              {isUnlocked ? (
                <>
                  <div className="status-item unlocked">
                    <Check size={16} />
                    <span>已解锁</span>
                  </div>
                  <div className="encryption-actions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLock}
                    >
                      <Lock size={14} />
                      锁定
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPasswordDialog({ open: true, mode: 'change' })}
                    >
                      修改密码
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="status-item locked">
                    <Lock size={16} />
                    <span>已锁定</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleUnlock}
                  >
                    解锁访问
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* 锁定提示 */}
        {encryptionEnabled && !isUnlocked ? (
          <div className="locked-notice">
            <Lock size={48} />
            <h3>数据已加密保护</h3>
            <p>您的 API 密钥已使用 AES-256-GCM 加密，请解锁以查看和编辑。</p>
            <Button onClick={handleUnlock}>
              <Lock size={16} />
              解锁访问
            </Button>
          </div>
        ) : (
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
        )}
    </div>
    </>
  )
}

