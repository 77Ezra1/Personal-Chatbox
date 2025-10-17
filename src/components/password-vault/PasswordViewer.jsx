/**
 * 密码查看器组件
 */

import { useState } from 'react';
import { toast } from 'sonner';

export function PasswordViewer({ entry, password, onEdit, onDelete }) {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);

  // 复制到剪贴板
  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label}已复制到剪贴板`);
    } catch (error) {
      toast.error('复制失败');
    }
  };

  // 检查密码强度
  const checkStrength = async () => {
    if (passwordStrength) {
      setPasswordStrength(null);
      return;
    }

    try {
      const response = await fetch('/api/password-vault/check-strength', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password })
      });
      const strength = await response.json();
      setPasswordStrength(strength);
    } catch (error) {
      toast.error('检查密码强度失败');
    }
  };

  return (
    <div className="password-viewer">
      <div className="password-viewer-header">
        <h1 className="password-viewer-title">{entry.title}</h1>
        <div className="password-viewer-actions">
          <button className="button button-secondary" onClick={onEdit}>
            ✏️ 编辑
          </button>
          <button
            className="button button-secondary"
            onClick={onDelete}
            style={{ color: 'var(--destructive)' }}
          >
            🗑️ 删除
          </button>
        </div>
      </div>

      <div className="password-viewer-meta">
        <span>分类: {entry.category}</span>
        <span>创建: {new Date(entry.created_at).toLocaleString()}</span>
        <span>更新: {new Date(entry.updated_at).toLocaleString()}</span>
        {entry.last_accessed && (
          <span>上次访问: {new Date(entry.last_accessed).toLocaleString()}</span>
        )}
      </div>

      {entry.username && (
        <div className="password-viewer-field">
          <div className="password-viewer-field-label">用户名</div>
          <div className="password-viewer-field-value">
            {entry.username}
            <button
              className="button-icon button-ghost button-sm"
              onClick={() => copyToClipboard(entry.username, '用户名')}
              title="复制用户名"
            >
              📋
            </button>
          </div>
        </div>
      )}

      <div className="password-viewer-field">
        <div className="password-viewer-field-label">密码</div>
        <div className="password-viewer-field-value">
          {showPassword ? (
            <span style={{ fontFamily: 'monospace', fontSize: '16px' }}>{password}</span>
          ) : (
            <span className="password-viewer-field-value-hidden">••••••••••••</span>
          )}
          <button
            className="button-icon button-ghost button-sm"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? '隐藏密码' : '显示密码'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
          <button
            className="button-icon button-ghost button-sm"
            onClick={() => copyToClipboard(password, '密码')}
            title="复制密码"
          >
            📋
          </button>
          <button
            className="button-icon button-ghost button-sm"
            onClick={checkStrength}
            title="检查密码强度"
          >
            {passwordStrength ? '✅' : '🔍'}
          </button>
        </div>
      </div>

      {passwordStrength && (
        <div className="password-strength">
          <div className="password-strength-bar">
            <div className={`password-strength-fill ${passwordStrength.strength}`}></div>
          </div>
          <div className={`password-strength-text ${passwordStrength.strength}`}>
            {passwordStrength.strengthText}
          </div>
        </div>
      )}

      {passwordStrength && passwordStrength.feedback && (
        <div className="password-viewer-field">
          <div className="password-viewer-field-label">建议</div>
          <div className="password-viewer-field-value">
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {passwordStrength.feedback.map((item, index) => (
                <li key={index} style={{ fontSize: '13px', marginBottom: '4px' }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {entry.url && (
        <div className="password-viewer-field">
          <div className="password-viewer-field-label">网址</div>
          <div className="password-viewer-field-value">
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary)', textDecoration: 'underline' }}
            >
              {entry.url}
            </a>
            <button
              className="button-icon button-ghost button-sm"
              onClick={() => copyToClipboard(entry.url, '网址')}
              title="复制网址"
            >
              📋
            </button>
          </div>
        </div>
      )}

      {entry.notes && (
        <div className="password-viewer-field">
          <div className="password-viewer-field-label">备注</div>
          <div className="password-viewer-field-value">
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {entry.notes}
            </div>
          </div>
        </div>
      )}

      {entry.tags && (
        <div className="password-viewer-field">
          <div className="password-viewer-field-label">标签</div>
          <div className="password-viewer-field-value">
            {entry.tags.split(',').map((tag, index) => (
              <span
                key={index}
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  margin: '4px 4px 4px 0',
                  background: 'var(--secondary)',
                  borderRadius: 'calc(var(--radius) - 2px)',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
