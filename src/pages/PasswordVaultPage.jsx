/**
 * 密码保险库页面
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { PasswordList } from '@/components/password-vault/PasswordList';
import { PasswordViewer } from '@/components/password-vault/PasswordViewer';
import { PasswordEditor } from '@/components/password-vault/PasswordEditor';
import { MasterPasswordSetup } from '@/components/password-vault/MasterPasswordSetup';
import { useTranslation } from '@/hooks/useTranslation';
import * as vaultApi from '@/lib/passwordVaultApi';
import './PasswordVaultPage.css';

export default function PasswordVaultPage() {
  const { translate } = useTranslation();

  // 状态管理
  const [hasMasterPassword, setHasMasterPassword] = useState(null);
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedEntryPassword, setSelectedEntryPassword] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'card'

  // 检查是否设置主密码
  useEffect(() => {
    checkMasterPassword();
  }, []);

  const checkMasterPassword = async () => {
    try {
      const result = await vaultApi.checkMasterPassword();
      setHasMasterPassword(result.hasMainPassword);
    } catch (error) {
      console.error('Failed to check master password:', error);
      toast.error('检查主密码状态失败');
    } finally {
      setLoading(false);
    }
  };

  // 设置主密码
  const handleSetupMasterPassword = async (password) => {
    try {
      await vaultApi.setupMasterPassword(password);
      setMasterPassword(password);
      setHasMasterPassword(true);
      setIsUnlocked(true);
      toast.success('主密码设置��功');
      loadEntries();
      loadStatistics();
    } catch (error) {
      console.error('Failed to setup master password:', error);
      toast.error(error.message || '设置主密码失败');
    }
  };

  // 验证主密码
  const handleUnlock = async (password) => {
    try {
      await vaultApi.verifyMasterPassword(password);
      setMasterPassword(password);
      setIsUnlocked(true);
      toast.success('解锁成功');
      loadEntries();
      loadStatistics();
    } catch (error) {
      console.error('Failed to unlock vault:', error);
      toast.error('主密码错误');
    }
  };

  // 加载密码条目
  const loadEntries = useCallback(async () => {
    if (!isUnlocked) return;

    try {
      setLoading(true);
      const params = {
        search: searchQuery || undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        favorite: showFavoritesOnly ? 'true' : undefined
      };
      const fetchedEntries = await vaultApi.getEntries(params);
      setEntries(fetchedEntries);
    } catch (error) {
      console.error('Failed to load entries:', error);
      toast.error('加载密码条目失败');
    } finally {
      setLoading(false);
    }
  }, [isUnlocked, searchQuery, filterCategory, showFavoritesOnly]);

  // 加载统计信息
  const loadStatistics = useCallback(async () => {
    if (!isUnlocked) return;

    try {
      const stats = await vaultApi.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }, [isUnlocked]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // 创建新条目
  const handleCreateEntry = () => {
    setSelectedEntry(null);
    setSelectedEntryPassword(null);
    setIsEditing(true);
  };

  // 选择条目
  const handleSelectEntry = async (entry) => {
    try {
      const decrypted = await vaultApi.decryptEntry(entry.id, masterPassword);
      setSelectedEntry(entry);
      setSelectedEntryPassword(decrypted.password);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to decrypt entry:', error);
      toast.error('解密失败');
    }
  };

  // 保存条目
  const handleSaveEntry = async (entryData) => {
    try {
      const dataWithMasterPassword = {
        ...entryData,
        masterPassword
      };

      if (selectedEntry) {
        // 更新
        await vaultApi.updateEntry(selectedEntry.id, dataWithMasterPassword);
        toast.success('密码更新成功');
      } else {
        // 创建
        await vaultApi.createEntry(dataWithMasterPassword);
        toast.success('密码保存成功');
      }

      setIsEditing(false);
      setSelectedEntry(null);
      setSelectedEntryPassword(null);
      loadEntries();
      loadStatistics();
    } catch (error) {
      console.error('Failed to save entry:', error);
      toast.error(error.message || '保存失败');
    }
  };

  // 删除条目
  const handleDeleteEntry = async (entryId) => {
    if (!confirm('确定要删除此密码吗？')) {
      return;
    }

    try {
      await vaultApi.deleteEntry(entryId);
      toast.success('密码删除成功');

      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null);
        setSelectedEntryPassword(null);
      }

      loadEntries();
      loadStatistics();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      toast.error('删除失败');
    }
  };

  // 切换收藏
  const handleToggleFavorite = async (entryId, favorite) => {
    try {
      await vaultApi.toggleFavorite(entryId, favorite);
      loadEntries();
      loadStatistics();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('操作失败');
    }
  };

  // 编辑当前条目
  const handleEditEntry = () => {
    setIsEditing(true);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // 导出密码
  const handleExport = async () => {
    try {
      const result = await vaultApi.exportPasswords(masterPassword);

      // 创建下载
      const blob = new Blob([JSON.stringify({
        data: result.data,
        salt: result.salt
      })], { type: 'application/json' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('密码导出成功');
    } catch (error) {
      console.error('Failed to export passwords:', error);
      toast.error('导出失败');
    }
  };

  // 导入密码
  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const { data, salt } = JSON.parse(text);

      const result = await vaultApi.importPasswords(data, salt, masterPassword);
      toast.success(`导入成功：${result.successCount} 条`);

      loadEntries();
      loadStatistics();
    } catch (error) {
      console.error('Failed to import passwords:', error);
      toast.error('导入失败');
    }
  };

  // 如果还在加载
  if (loading && hasMasterPassword === null) {
    return (
      <div className="password-vault-page">
        <div className="vault-loading">
          <div className="loading-dots">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        </div>
      </div>
    );
  }

  // 如果没有设置主密码
  if (!hasMasterPassword) {
    return (
      <div className="password-vault-page">
        <MasterPasswordSetup onSetup={handleSetupMasterPassword} />
      </div>
    );
  }

  // 如果未解锁
  if (!isUnlocked) {
    return (
      <div className="password-vault-page">
        <MasterPasswordSetup
          isUnlock={true}
          onUnlock={handleUnlock}
        />
      </div>
    );
  }

  // 主界面
  return (
    <div className="password-vault-page">
      {/* 侧边栏 */}
      <div className="vault-sidebar">
        <div className="vault-sidebar-header">
          <div className="vault-header-top">
            <h2>🔐 密码保险库</h2>
            <div className="view-mode-toggle">
              <button
                className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="列表视图"
              >
                ☰
              </button>
              <button
                className={`view-mode-btn ${viewMode === 'card' ? 'active' : ''}`}
                onClick={() => setViewMode('card')}
                title="卡片视图"
              >
                ▦
              </button>
            </div>
          </div>
          <button className="button button-primary" onClick={handleCreateEntry}>
            + 新建密码
          </button>
        </div>

        {/* 统计信息 */}
        {statistics && (
          <div className="vault-stats">
            <div className="vault-stat-item">
              <div className="vault-stat-value">{statistics.total}</div>
              <div className="vault-stat-label">总数</div>
            </div>
            <div className="vault-stat-item">
              <div className="vault-stat-value">{statistics.favorites}</div>
              <div className="vault-stat-label">收藏</div>
            </div>
            <div className="vault-stat-item">
              <div className="vault-stat-value">
                {statistics.byCategory?.length || 0}
              </div>
              <div className="vault-stat-label">分��</div>
            </div>
          </div>
        )}

        {/* 搜索和筛选 */}
        <div className="vault-filters">
          <input
            type="text"
            className="vault-search-input"
            placeholder="搜索密码..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="vault-filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">所有分类</option>
            <option value="general">通用</option>
            <option value="social">社交媒体</option>
            <option value="email">电子邮件</option>
            <option value="banking">银行金融</option>
            <option value="work">工作</option>
            <option value="shopping">购物</option>
            <option value="entertainment">娱乐</option>
            <option value="other">其他</option>
          </select>

          <div className="vault-filter-checkboxes">
            <label>
              <input
                type="checkbox"
                checked={showFavoritesOnly}
                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
              />
              仅显示收藏
            </label>
          </div>
        </div>

        {/* 密码列表 */}
        <div className="vault-list-container">
          <PasswordList
            entries={entries}
            selectedEntryId={selectedEntry?.id}
            onSelectEntry={handleSelectEntry}
            onDeleteEntry={handleDeleteEntry}
            onToggleFavorite={handleToggleFavorite}
            viewMode={viewMode}
          />
        </div>

        {/* 操作按钮 */}
        <div className="vault-actions">
          <button className="button button-secondary button-sm" onClick={handleExport}>
            📥 导出
          </button>
          <label className="button button-secondary button-sm">
            📤 导入
            <input
              type="file"
              accept=".json,.encrypted"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </label>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="vault-content">
        {isEditing ? (
          <PasswordEditor
            entry={selectedEntry}
            entryPassword={selectedEntryPassword}
            onSave={handleSaveEntry}
            onCancel={handleCancelEdit}
          />
        ) : selectedEntry ? (
          <PasswordViewer
            entry={selectedEntry}
            password={selectedEntryPassword}
            onEdit={handleEditEntry}
            onDelete={() => handleDeleteEntry(selectedEntry.id)}
          />
        ) : (
          <div className="vault-placeholder">
            <div className="vault-placeholder-icon">🔒</div>
            <h2>选择一个密码条目</h2>
            <p>或创建新的密码条目来开始</p>
          </div>
        )}
      </div>
    </div>
  );
}
