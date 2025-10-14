import React, { useState, useEffect } from 'react';
import './ProxyConfig.css';

import { createLogger } from '../../lib/logger'
const logger = createLogger('ProxyConfig')


const ProxyConfig = () => {
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [proxyHost, setProxyHost] = useState('127.0.0.1');
  const [proxyPort, setProxyPort] = useState('7890');
  const [proxyProtocol, setProxyProtocol] = useState('http');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [currentProxy, setCurrentProxy] = useState(null);

  // 加载当前代理配置
  useEffect(() => {
    loadProxyConfig();
  }, []);

  const loadProxyConfig = async () => {
    try {
      const response = await fetch('/api/proxy/config');
      const data = await response.json();
      
      if (data.success && data.config) {
        setProxyEnabled(data.config.enabled || false);
        setProxyHost(data.config.host || '127.0.0.1');
        setProxyPort(data.config.port || '7890');
        setProxyProtocol(data.config.protocol || 'http');
        setCurrentProxy(data.current);
      }
    } catch (error) {
      logger.error('加载代理配置失败:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/proxy/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: proxyEnabled,
          protocol: proxyProtocol,
          host: proxyHost,
          port: parseInt(proxyPort),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('代理配置已保存!重启服务后生效。');
        setMessageType('success');
        loadProxyConfig();
      } else {
        setMessage(data.error || '保存失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('保存失败: ' + error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/proxy/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocol: proxyProtocol,
          host: proxyHost,
          port: parseInt(proxyPort),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('代理连接测试成功! ✓');
        setMessageType('success');
      } else {
        setMessage('代理连接测试失败: ' + (data.error || '未知错误'));
        setMessageType('error');
      }
    } catch (error) {
      setMessage('测试失败: ' + error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    if (!window.confirm('确定要重启后端服务吗?这将中断当前所有连接。')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/proxy/restart', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage('服务重启中...请稍候');
        setMessageType('success');
        
        // 等待服务重启
        setTimeout(() => {
          loadProxyConfig();
          setMessage('服务已重启!');
        }, 5000);
      } else {
        setMessage(data.error || '重启失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('重启请求失败: ' + error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="proxy-config">
      <h3>代理配置</h3>
      <p className="description">
        配置系统代理,用于访问外部 MCP 服务(如 Wikipedia, Brave Search, GitHub 等)
      </p>

      {currentProxy && (
        <div className="current-proxy-info">
          <h4>当前代理状态</h4>
          <div className="proxy-status">
            <span className={`status-indicator ${currentProxy.enabled ? 'active' : 'inactive'}`}>
              {currentProxy.enabled ? '● 已启用' : '○ 未启用'}
            </span>
            {currentProxy.enabled && currentProxy.url && (
              <span className="proxy-url">{currentProxy.url}</span>
            )}
          </div>
        </div>
      )}

      <div className="config-form">
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={proxyEnabled}
              onChange={(e) => setProxyEnabled(e.target.checked)}
            />
            <span>启用代理</span>
          </label>
        </div>

        <div className="form-group">
          <label>协议</label>
          <select
            value={proxyProtocol}
            onChange={(e) => setProxyProtocol(e.target.value)}
            disabled={!proxyEnabled}
          >
            <option value="http">HTTP</option>
            <option value="https">HTTPS</option>
            <option value="socks5">SOCKS5</option>
          </select>
        </div>

        <div className="form-group">
          <label>主机地址</label>
          <input
            type="text"
            value={proxyHost}
            onChange={(e) => setProxyHost(e.target.value)}
            placeholder="127.0.0.1"
            disabled={!proxyEnabled}
          />
          <small>通常是 127.0.0.1 或 localhost</small>
        </div>

        <div className="form-group">
          <label>端口</label>
          <input
            type="number"
            value={proxyPort}
            onChange={(e) => setProxyPort(e.target.value)}
            placeholder="7890"
            disabled={!proxyEnabled}
          />
          <small>常见端口: 7890 (Clash), 1080 (SOCKS5), 10808</small>
        </div>

        <div className="preview">
          <strong>代理地址预览:</strong>
          {proxyEnabled ? (
            <code>{proxyProtocol}://{proxyHost}:{proxyPort}</code>
          ) : (
            <span className="disabled-text">未启用代理</span>
          )}
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="button-group">
          <button
            onClick={handleTest}
            disabled={loading || !proxyEnabled}
            className="btn-test"
          >
            {loading ? '测试中...' : '测试连接'}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-save"
          >
            {loading ? '保存中...' : '保存配置'}
          </button>
          <button
            onClick={handleRestart}
            disabled={loading}
            className="btn-restart"
          >
            重启服务
          </button>
        </div>
      </div>

      <div className="proxy-help">
        <h4>💡 使用提示</h4>
        <ul>
          <li>如果您使用 Clash,通常端口是 7890</li>
          <li>如果您使用 V2Ray,通常端口是 10808</li>
          <li>如果您使用 SOCKS5 代理,选择 SOCKS5 协议</li>
          <li>配置保存后需要重启服务才能生效</li>
          <li>可以先点击"测试连接"验证代理是否可用</li>
        </ul>
      </div>
    </div>
  );
};

export default ProxyConfig;

