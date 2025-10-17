/**
 * 主密码设置/解锁组件
 */

import { useState } from 'react';
import { toast } from 'sonner';

export function MasterPasswordSetup({ isUnlock = false, onSetup, onUnlock }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isUnlock) {
      if (!password) {
        toast.error('请输入主密码');
        return;
      }
      onUnlock(password);
    } else {
      if (!password || !confirmPassword) {
        toast.error('请填写所有字段');
        return;
      }

      if (password.length < 8) {
        toast.error('主密码长度至少为8个字符');
        return;
      }

      if (password !== confirmPassword) {
        toast.error('两次输入的密码不一致');
        return;
      }

      onSetup(password);
    }
  };

  return (
    <div className="master-password-setup">
      <div className="master-password-setup-icon">🔐</div>
      <h2>
        {isUnlock ? '解锁密码保险库' : '设置主密码'}
      </h2>
      <p>
        {isUnlock
          ? '请输入您的主密码以解锁密码保险库'
          : '主密码用于加密和解密您的所有密码。请妥善保管，一旦遗失将无法恢复您的密码。'
        }
      </p>

      <form className="master-password-setup-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            {isUnlock ? '主密码' : '设置主密码'}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isUnlock ? '输入主密码' : '至少8个字符'}
              required
              autoFocus
              style={{ fontFamily: showPassword ? 'monospace' : 'inherit' }}
            />
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? '隐藏' : '显示'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {!isUnlock && (
          <div className="form-group">
            <label className="form-label">确认主密码</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入主密码"
              required
              style={{ fontFamily: showPassword ? 'monospace' : 'inherit' }}
            />
          </div>
        )}

        {!isUnlock && (
          <div
            style={{
              padding: '16px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              lineHeight: '1.6',
              color: 'var(--muted-foreground)'
            }}
          >
            <strong style={{ color: 'var(--foreground)', display: 'block', marginBottom: '8px' }}>
              ⚠️ 重要提示
            </strong>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>主密码将用于加密您的所有密码</li>
              <li>请务必记住主密码，系统不会保存明文密码</li>
              <li>如果忘记主密码，将无法恢复您的密码数据</li>
              <li>建议使用强密码，包含大小写字母、数字和符号</li>
            </ul>
          </div>
        )}

        <button type="submit" className="button button-primary button-lg" style={{ width: '100%' }}>
          {isUnlock ? '🔓 解锁' : '🔐 设置主密码'}
        </button>
      </form>

      {isUnlock && (
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
            如果忘记了主密码，您将无法访问保险库中的密码。
          </p>
        </div>
      )}
    </div>
  );
}
