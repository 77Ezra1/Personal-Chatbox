/**
 * 密码编辑器组件
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import * as vaultApi from '@/lib/passwordVaultApi';

export function PasswordEditor({ entry, entryPassword, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    category: 'general',
    notes: '',
    tags: ''
  });

  const [passwordStrength, setPasswordStrength] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorOptions, setGeneratorOptions] = useState({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeAmbiguous: true
  });

  // 初始化表单数据
  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title || '',
        username: entry.username || '',
        password: entryPassword || '',
        url: entry.url || '',
        category: entry.category || 'general',
        notes: entry.notes || '',
        tags: entry.tags || ''
      });
    }
  }, [entry, entryPassword]);

  // 检查密码强度
  useEffect(() => {
    if (formData.password) {
      checkPasswordStrength(formData.password);
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password]);

  const checkPasswordStrength = async (password) => {
    try {
      const strength = await vaultApi.checkPasswordStrength(password);
      setPasswordStrength(strength);
    } catch (error) {
      console.error('Failed to check password strength:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title || !formData.password) {
      toast.error('标题和密码为必填项');
      return;
    }

    onSave(formData);
  };

  const handleGeneratePassword = async () => {
    try {
      const result = await vaultApi.generatePassword(
        generatorOptions.length,
        {
          includeUppercase: generatorOptions.includeUppercase,
          includeLowercase: generatorOptions.includeLowercase,
          includeNumbers: generatorOptions.includeNumbers,
          includeSymbols: generatorOptions.includeSymbols,
          excludeAmbiguous: generatorOptions.excludeAmbiguous
        }
      );

      setFormData(prev => ({ ...prev, password: result.password }));
      toast.success('密码已生成');
      setShowGenerator(false);
    } catch (error) {
      console.error('Failed to generate password:', error);
      toast.error('生成密码失败');
    }
  };

  return (
    <div className="password-editor">
      <div className="password-editor-header">
        <h1 className="password-editor-title">
          {entry ? '编辑密码' : '新建密码'}
        </h1>
      </div>

      <form className="password-editor-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            标题 <span className="form-label-required">*</span>
          </label>
          <input
            type="text"
            name="title"
            className="form-input"
            value={formData.title}
            onChange={handleChange}
            placeholder="例如：Gmail 账户"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">用户名</label>
          <input
            type="text"
            name="username"
            className="form-input"
            value={formData.username}
            onChange={handleChange}
            placeholder="例如：user@example.com"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            密码 <span className="form-label-required">*</span>
          </label>
          <div className="form-input-password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="输入密码"
              required
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
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setShowGenerator(!showGenerator)}
              title="生成密码"
            >
              🎲
            </button>
          </div>

          {passwordStrength && (
            <div className="password-strength" style={{ marginTop: '12px' }}>
              <div className="password-strength-bar">
                <div className={`password-strength-fill ${passwordStrength.strength}`}></div>
              </div>
              <div className={`password-strength-text ${passwordStrength.strength}`}>
                {passwordStrength.strengthText}
              </div>
            </div>
          )}
        </div>

        {showGenerator && (
          <div className="password-generator">
            <div className="password-generator-header">密码生成器</div>

            <div className="password-generator-options">
              <div className="password-generator-option">
                <label style={{ flex: 1 }}>
                  长度: {generatorOptions.length}
                </label>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={generatorOptions.length}
                  onChange={(e) => setGeneratorOptions(prev => ({
                    ...prev,
                    length: parseInt(e.target.value)
                  }))}
                />
              </div>

              <div className="password-generator-option">
                <input
                  type="checkbox"
                  id="includeUppercase"
                  checked={generatorOptions.includeUppercase}
                  onChange={(e) => setGeneratorOptions(prev => ({
                    ...prev,
                    includeUppercase: e.target.checked
                  }))}
                />
                <label htmlFor="includeUppercase">包含大写字母 (A-Z)</label>
              </div>

              <div className="password-generator-option">
                <input
                  type="checkbox"
                  id="includeLowercase"
                  checked={generatorOptions.includeLowercase}
                  onChange={(e) => setGeneratorOptions(prev => ({
                    ...prev,
                    includeLowercase: e.target.checked
                  }))}
                />
                <label htmlFor="includeLowercase">包含小写字母 (a-z)</label>
              </div>

              <div className="password-generator-option">
                <input
                  type="checkbox"
                  id="includeNumbers"
                  checked={generatorOptions.includeNumbers}
                  onChange={(e) => setGeneratorOptions(prev => ({
                    ...prev,
                    includeNumbers: e.target.checked
                  }))}
                />
                <label htmlFor="includeNumbers">包含数字 (0-9)</label>
              </div>

              <div className="password-generator-option">
                <input
                  type="checkbox"
                  id="includeSymbols"
                  checked={generatorOptions.includeSymbols}
                  onChange={(e) => setGeneratorOptions(prev => ({
                    ...prev,
                    includeSymbols: e.target.checked
                  }))}
                />
                <label htmlFor="includeSymbols">包含符号 (!@#$%...)</label>
              </div>

              <div className="password-generator-option">
                <input
                  type="checkbox"
                  id="excludeAmbiguous"
                  checked={generatorOptions.excludeAmbiguous}
                  onChange={(e) => setGeneratorOptions(prev => ({
                    ...prev,
                    excludeAmbiguous: e.target.checked
                  }))}
                />
                <label htmlFor="excludeAmbiguous">排除易混淆字符 (0,O,l,1...)</label>
              </div>
            </div>

            <div className="password-generator-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={handleGeneratePassword}
              >
                生成密码
              </button>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">网址</label>
          <input
            type="url"
            name="url"
            className="form-input"
            value={formData.url}
            onChange={handleChange}
            placeholder="https://example.com"
          />
        </div>

        <div className="form-group">
          <label className="form-label">分类</label>
          <select
            name="category"
            className="form-select"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="general">通用</option>
            <option value="social">社交媒体</option>
            <option value="email">电子邮件</option>
            <option value="banking">银行金融</option>
            <option value="work">工作</option>
            <option value="shopping">购物</option>
            <option value="entertainment">娱乐</option>
            <option value="other">其他</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">标签</label>
          <input
            type="text"
            name="tags"
            className="form-input"
            value={formData.tags}
            onChange={handleChange}
            placeholder="用逗号分隔，例如：重要,工作,个人"
          />
        </div>

        <div className="form-group">
          <label className="form-label">备注</label>
          <textarea
            name="notes"
            className="form-textarea"
            value={formData.notes}
            onChange={handleChange}
            placeholder="添加其他备注信息..."
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="button button-primary">
            💾 保存
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={onCancel}
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
