import { useState } from 'react'
import { Lock, Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './PasswordSetupDialog.css'

import { createLogger } from '../../lib/logger'
const logger = createLogger('PasswordSetupDialog')

/**
 * 密码设置对话框
 * 用于首次设置或修改加密密码
 */
export function PasswordSetupDialog({ open, onClose, onConfirm, mode = 'setup' }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  // 密码强度检查
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, text: '', color: '' }
    
    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^a-zA-Z0-9]/.test(pwd)) score++

    if (score <= 2) return { level: 1, text: '弱', color: '#999' }
    if (score <= 4) return { level: 2, text: '中等', color: '#666' }
    return { level: 3, text: '强', color: '#333' }
  }

  const strength = getPasswordStrength(password)

  // 密码要求检查
  const requirements = [
    { text: '至少 8 个字符', valid: password.length >= 8 },
    { text: '包含大小写字母', valid: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { text: '包含数字', valid: /[0-9]/.test(password) },
    { text: '包含特殊字符', valid: /[^a-zA-Z0-9]/.test(password) }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // 验证密码
    if (password.length < 8) {
      setError('密码长度至少为 8 个字符')
      return
    }

    if (mode === 'setup' || mode === 'change') {
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致')
        return
      }
    }

    // 验证密码强度
    if (strength.level < 2) {
      setError('密码强度不足，请使用更复杂的密码')
      return
    }

    onConfirm(password)
    handleClose()
  }

  const handleClose = () => {
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirm(false)
    setError('')
    onClose()
  }

  const titles = {
    setup: '设置加密密码',
    change: '修改加密密码',
    verify: '验证密码'
  }

  const descriptions = {
    setup: '设置一个强密码来保护您的 API 密钥。此密码不会被存储，请务必牢记。',
    change: '请设置新的加密密码。修改后需要使用新密码才能访问已加密的数据。',
    verify: '请输入您的加密密码以访问已加密的 API 密钥。'
  }

  return (
    <div className="password-dialog-overlay" onClick={handleClose}>
      <div className="password-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="header-icon">
            <Lock size={24} />
          </div>
          <div>
            <h2>{titles[mode]}</h2>
            <p>{descriptions[mode]}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 密码输入 */}
          <div className="form-group">
            <label htmlFor="password">
              {mode === 'verify' ? '密码' : '加密密码'}
            </label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'verify' ? '请输入密码' : '请输入至少 8 位密码'}
                autoFocus
                required
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* 密码强度指示器 (仅在设置/修改模式) */}
          {(mode === 'setup' || mode === 'change') && password && (
            <div className="password-strength">
              <div className="strength-bars">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`strength-bar ${level <= strength.level ? 'active' : ''}`}
                    style={{ backgroundColor: level <= strength.level ? strength.color : '#e5e7eb' }}
                  />
                ))}
              </div>
              <span className="strength-text" style={{ color: strength.color }}>
                {strength.text}
              </span>
            </div>
          )}

          {/* 密码要求 (仅在设置/修改模式) */}
          {(mode === 'setup' || mode === 'change') && (
            <div className="password-requirements">
              <p className="requirements-title">密码要求:</p>
              <ul>
                {requirements.map((req, index) => (
                  <li key={index} className={req.valid ? 'valid' : 'invalid'}>
                    {req.valid ? (
                      <Check size={14} className="icon-valid" />
                    ) : (
                      <X size={14} className="icon-invalid" />
                    )}
                    {req.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 确认密码 (仅在设置/修改模式) */}
          {(mode === 'setup' || mode === 'change') && (
            <div className="form-group">
              <label htmlFor="confirmPassword">确认密码</label>
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  required
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* 安全提示 */}
          <div className="security-notice">
            <AlertCircle size={16} className="notice-icon" />
            <div>
              <strong>安全提示:</strong>
              <p>此密码用于本地加密，不会上传至服务器。忘记密码将无法恢复数据！</p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="dialog-actions">
            <Button type="button" variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button type="submit">
              {mode === 'verify' ? '解锁' : '确认'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
