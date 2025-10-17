/**
 * 密码列表组件 - 支持列表/卡片双视图
 */

import './PasswordList.css';

export function PasswordList({ entries, selectedEntryId, onSelectEntry, onDeleteEntry, onToggleFavorite, viewMode = 'list' }) {
  // 获取分类图标
  const getCategoryIcon = (category) => {
    const icons = {
      general: '🔑',
      social: '📱',
      email: '📧',
      banking: '🏦',
      work: '💼',
      shopping: '🛒',
      entertainment: '🎮',
      other: '📦'
    };
    return icons[category] || '🔑';
  };

  if (entries.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
        <p>暂无密码条目</p>
      </div>
    );
  }

  // 渲染列表视图项
  const renderListItem = (entry) => (
    <div
      key={entry.id}
      className={`vault-item ${selectedEntryId === entry.id ? 'active' : ''}`}
      onClick={() => onSelectEntry(entry)}
    >
      <div className="vault-item-icon">
        {getCategoryIcon(entry.category)}
      </div>
      <div className="vault-item-content">
        <h3 className="vault-item-title">{entry.title}</h3>
        <p className="vault-item-username">{entry.username || entry.url || '无用户名'}</p>
      </div>
      {entry.favorite === 1 && (
        <div className="vault-item-favorite">⭐</div>
      )}
      <div className="vault-item-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className="vault-action-btn"
          onClick={() => onToggleFavorite(entry.id, entry.favorite === 1 ? 0 : 1)}
          title={entry.favorite === 1 ? '取消收藏' : '收藏'}
        >
          {entry.favorite === 1 ? '⭐' : '☆'}
        </button>
        <button
          className="vault-action-btn vault-action-delete"
          onClick={() => onDeleteEntry(entry.id)}
          title="删除"
        >
          🗑️
        </button>
      </div>
    </div>
  );

  // 渲染卡片视图项
  const renderCardItem = (entry) => (
    <div
      key={entry.id}
      className={`vault-card ${selectedEntryId === entry.id ? 'active' : ''}`}
      onClick={() => onSelectEntry(entry)}
    >
      <div className="vault-card-header">
        <div className="vault-card-icon">
          {getCategoryIcon(entry.category)}
        </div>
        <div className="vault-card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="vault-action-btn"
            onClick={() => onToggleFavorite(entry.id, entry.favorite === 1 ? 0 : 1)}
            title={entry.favorite === 1 ? '取消收藏' : '收藏'}
          >
            {entry.favorite === 1 ? '⭐' : '☆'}
          </button>
          <button
            className="vault-action-btn vault-action-delete"
            onClick={() => onDeleteEntry(entry.id)}
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="vault-card-body">
        <h3 className="vault-card-title">{entry.title}</h3>
        <p className="vault-card-username">{entry.username || entry.url || '无用户名'}</p>

        <div className="vault-card-meta">
          <span className="vault-card-category">{entry.category}</span>
          {entry.favorite === 1 && (
            <span className="vault-card-favorite-badge">⭐ 收藏</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`vault-list-wrapper ${viewMode === 'card' ? 'card-view' : 'list-view'}`}>
      {viewMode === 'list' ? (
        <div className="vault-list">
          {entries.map(renderListItem)}
        </div>
      ) : (
        <div className="vault-grid">
          {entries.map(renderCardItem)}
        </div>
      )}
    </div>
  );
}
