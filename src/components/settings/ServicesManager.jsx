/**
 * 服务管理组件
 * 允许用户启用/禁用各种MCP服务和内置服务
 */

import { useState, useEffect } from 'react';
import './ServicesManager.css';

export default function ServicesManager() {
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, free, requires-key, mcp, builtin
  const [hasChanges, setHasChanges] = useState(false);

  // 加载服务列表
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/services', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('加载服务列表失败');
      }

      const data = await response.json();
      setServices(data.services);
      setStats(data.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = async (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const newEnabled = !service.enabled;

    // 乐观更新UI
    setServices(services.map(s =>
      s.id === serviceId ? { ...s, enabled: newEnabled } : s
    ));
    setHasChanges(true);

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ enabled: newEnabled })
      });

      if (!response.ok) {
        throw new Error('更新服务状态失败');
      }

      const result = await response.json();
      console.log(result.message);
    } catch (err) {
      // 回滚
      setServices(services.map(s =>
        s.id === serviceId ? { ...s, enabled: service.enabled } : s
      ));
      setError(err.message);
    }
  };

  const saveAllChanges = async () => {
    try {
      setSaving(true);
      setError(null);

      const updates = services.map(s => ({
        id: s.id,
        enabled: s.enabled
      }));

      const response = await fetch('/api/services/batch/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ services: updates })
      });

      if (!response.ok) {
        throw new Error('批量更新失败');
      }

      const result = await response.json();
      setHasChanges(false);
      alert(result.message + '\n' + result.note);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const restartServices = async () => {
    if (!confirm('确定要重启服务吗？这将中断所有正在进行的对话。')) {
      return;
    }

    try {
      const response = await fetch('/api/services/restart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      alert(result.message);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredServices = services.filter(service => {
    if (filter === 'all') return true;
    if (filter === 'free') return service.category === 'free';
    if (filter === 'requires-key') return service.category === 'requires-key';
    if (filter === 'mcp') return service.type === 'mcp';
    if (filter === 'builtin') return service.type === 'builtin';
    return true;
  });

  if (loading) {
    return (
      <div className="services-manager">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>加载服务列表中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="services-manager">
      <div className="services-header">
        <div className="header-title">
          <h2>🔧 服务管理</h2>
          <p className="subtitle">管理所有AI服务的启用状态（需要重启后端才能生效）</p>
        </div>

        {stats && (
          <div className="services-stats">
            <div className="stat-card">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">总服务数</div>
            </div>
            <div className="stat-card enabled">
              <div className="stat-value">{stats.enabled}</div>
              <div className="stat-label">已启用</div>
            </div>
            <div className="stat-card free">
              <div className="stat-value">{stats.free}</div>
              <div className="stat-label">免费服务</div>
            </div>
            <div className="stat-card requires-key">
              <div className="stat-value">{stats.requiresKey}</div>
              <div className="stat-label">需要API Key</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {hasChanges && (
        <div className="changes-banner">
          <div className="banner-content">
            <span>⚠️ 有未保存的更改</span>
            <div className="banner-actions">
              <button onClick={() => window.location.reload()} className="btn-secondary">
                取消
              </button>
              <button onClick={saveAllChanges} disabled={saving} className="btn-primary">
                {saving ? '保存中...' : '保存所有更改'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="services-controls">
        <div className="filter-tabs">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            全部 ({services.length})
          </button>
          <button
            className={filter === 'free' ? 'active' : ''}
            onClick={() => setFilter('free')}
          >
            免费服务 ({services.filter(s => s.category === 'free').length})
          </button>
          <button
            className={filter === 'requires-key' ? 'active' : ''}
            onClick={() => setFilter('requires-key')}
          >
            需要Key ({services.filter(s => s.category === 'requires-key').length})
          </button>
          <button
            className={filter === 'mcp' ? 'active' : ''}
            onClick={() => setFilter('mcp')}
          >
            MCP服务 ({services.filter(s => s.type === 'mcp').length})
          </button>
          <button
            className={filter === 'builtin' ? 'active' : ''}
            onClick={() => setFilter('builtin')}
          >
            内置服务 ({services.filter(s => s.type === 'builtin').length})
          </button>
        </div>

        <button onClick={restartServices} className="btn-restart">
          🔄 重启服务
        </button>
      </div>

      <div className="services-list">
        {filteredServices.map(service => (
          <div
            key={service.id}
            className={`service-card ${service.enabled ? 'enabled' : 'disabled'} ${service.type}`}
          >
            <div className="service-header">
              <div className="service-info">
                <div className="service-title">
                  <h3>{service.name}</h3>
                  <div className="service-badges">
                    <span className={`badge type-${service.type}`}>
                      {service.type === 'mcp' ? 'MCP' : '内置'}
                    </span>
                    {service.requiresConfig && (
                      <span className="badge requires-key">需要API Key</span>
                    )}
                    {service.enabled && (
                      <span className="badge status-enabled">运行中</span>
                    )}
                  </div>
                </div>
                <p className="service-description">{service.description}</p>

                {service.signupUrl && (
                  <a
                    href={service.signupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="signup-link"
                  >
                    🔗 获取API Key
                  </a>
                )}

                {service.notes && service.notes.length > 0 && (
                  <div className="service-notes">
                    <details>
                      <summary>📝 使用说明</summary>
                      <ul>
                        {service.notes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                )}
              </div>

              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={service.enabled}
                  onChange={() => toggleService(service.id)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        ))}

        {filteredServices.length === 0 && (
          <div className="empty-state">
            <p>没有符合条件的服务</p>
          </div>
        )}
      </div>

      <div className="services-footer">
        <div className="help-text">
          <h4>💡 使用提示</h4>
          <ul>
            <li>✅ 免费服务可以直接启用，无需配置</li>
            <li>🔑 需要API Key的服务需要先配置密钥</li>
            <li>🔄 修改服务状态后需要重启后端才能生效</li>
            <li>📊 启用的服务越多，AI的能力越强大</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

