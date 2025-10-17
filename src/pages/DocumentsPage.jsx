/**
 * 文档管理页面
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentEditor } from '@/components/documents/DocumentEditor';
import { useTranslation } from '@/hooks/useTranslation';
import * as documentsApi from '@/lib/documentsApi';
import './DocumentsPage.css';

export default function DocumentsPage() {
  const { translate } = useTranslation();

  // 状态管理
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [statistics, setStatistics] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'card'

  // 加载文档
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const options = {
        category: filterCategory || undefined,
        tag: filterTag || undefined,
        isFavorite: showFavoritesOnly || undefined,
        isArchived: showArchived,
        sortBy,
        sortOrder
      };

      let fetchedDocuments;
      if (searchQuery) {
        fetchedDocuments = await documentsApi.searchDocuments(searchQuery, options);
      } else {
        fetchedDocuments = await documentsApi.getAllDocuments(options);
      }

      setDocuments(fetchedDocuments);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error(translate('documents.loadError') || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterCategory, filterTag, showFavoritesOnly, showArchived, sortBy, sortOrder, translate]);

  // 加载分类和标签
  const loadMetadata = useCallback(async () => {
    try {
      const [fetchedCategories, fetchedTags, stats] = await Promise.all([
        documentsApi.getCategories(),
        documentsApi.getAllTags(),
        documentsApi.getStatistics()
      ]);

      setCategories(fetchedCategories);
      setTags(fetchedTags);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load metadata:', error);
    }
  }, []);

  // 初始化
  useEffect(() => {
    loadDocuments();
    loadMetadata();
  }, [loadDocuments, loadMetadata]);

  // 创建新文档
  const handleCreateDocument = useCallback(() => {
    setSelectedDocument(null);
    setIsEditing(true);
  }, []);

  // 选择文档
  const handleSelectDocument = useCallback(async (document) => {
    setSelectedDocument(document);
    setIsEditing(false);

    // 记录访问
    try {
      await documentsApi.recordVisit(document.id);
      loadMetadata(); // 更新统计信息
    } catch (error) {
      console.error('Failed to record visit:', error);
    }
  }, [loadMetadata]);

  // 保存文档
  const handleSaveDocument = useCallback(async (documentData) => {
    try {
      if (selectedDocument) {
        // 更新现有文档
        const updated = await documentsApi.updateDocument(selectedDocument.id, documentData);
        setDocuments(documents.map(d => d.id === updated.id ? updated : d));
        setSelectedDocument(updated);
        toast.success(translate('documents.updateSuccess') || 'Document updated');
      } else {
        // 创建新文档
        const created = await documentsApi.createDocument(documentData);
        setDocuments([created, ...documents]);
        setSelectedDocument(created);
        toast.success(translate('documents.createSuccess') || 'Document created');
      }
      setIsEditing(false);
      loadMetadata(); // 更新统计信息
    } catch (error) {
      console.error('Failed to save document:', error);
      toast.error(translate('documents.saveError') || 'Failed to save document');
    }
  }, [selectedDocument, documents, translate, loadMetadata]);

  // 删除文档
  const handleDeleteDocument = useCallback(async (documentId) => {
    if (!confirm(translate('documents.deleteConfirm') || 'Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentsApi.deleteDocument(documentId);
      setDocuments(documents.filter(d => d.id !== documentId));
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
      }
      toast.success(translate('documents.deleteSuccess') || 'Document deleted');
      loadMetadata();
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast.error(translate('documents.deleteError') || 'Failed to delete document');
    }
  }, [documents, selectedDocument, translate, loadMetadata]);

  // 切换收藏
  const handleToggleFavorite = useCallback(async (documentId, isFavorite) => {
    try {
      const updated = await documentsApi.updateDocument(documentId, { is_favorite: isFavorite });
      setDocuments(documents.map(d => d.id === updated.id ? updated : d));
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(updated);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error(translate('documents.favoriteError') || 'Failed to update favorite');
    }
  }, [documents, selectedDocument, translate]);

  // 编辑当前文档
  const handleEditCurrentDocument = useCallback(() => {
    if (selectedDocument) {
      setIsEditing(true);
    }
  }, [selectedDocument]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  // 打开文档链接
  const handleOpenLink = useCallback(() => {
    if (selectedDocument && selectedDocument.url) {
      window.open(selectedDocument.url, '_blank', 'noopener,noreferrer');
    }
  }, [selectedDocument]);

  // 导出文档
  const handleExport = useCallback(async () => {
    try {
      const data = await documentsApi.exportDocuments();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documents-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(translate('documents.exportSuccess') || 'Documents exported');
    } catch (error) {
      console.error('Failed to export documents:', error);
      toast.error(translate('documents.exportError') || 'Failed to export documents');
    }
  }, [translate]);

  // 导入文档
  const handleImport = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const documentsToImport = data.documents || data;

      const result = await documentsApi.importDocuments(documentsToImport);
      toast.success(translate('documents.importSuccess', { count: result.imported }) || `Imported ${result.imported} documents`);
      loadDocuments();
      loadMetadata();
    } catch (error) {
      console.error('Failed to import documents:', error);
      toast.error(translate('documents.importError') || 'Failed to import documents');
    }
  }, [translate, loadDocuments, loadMetadata]);

  return (
    <div className="documents-page">
      {/* 侧边栏 */}
      <div className="documents-sidebar">
        <div className="documents-sidebar-header">
          <div className="documents-header-top">
            <h2>{translate('documents.title') || 'Documents'}</h2>
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
          <button className="btn-primary" onClick={handleCreateDocument}>
            + {translate('documents.newDocument') || 'New'}
          </button>
        </div>

        {/* 统计信息 */}
        {statistics && (
          <div className="documents-stats">
            <div className="stat-item">
              <span className="stat-label">{translate('documents.total') || 'Total'}</span>
              <span className="stat-value">{statistics.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{translate('documents.favorites') || 'Favorites'}</span>
              <span className="stat-value">{statistics.favorites}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{translate('documents.categories') || 'Categories'}</span>
              <span className="stat-value">{statistics.categories}</span>
            </div>
          </div>
        )}

        {/* 搜索和过滤 */}
        <div className="documents-filters">
          <input
            type="text"
            className="search-input"
            placeholder={translate('documents.search') || 'Search documents...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">{translate('documents.allCategories') || 'All Categories'}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="">{translate('documents.allTags') || 'All Tags'}</option>
            {tags.map(tag => (
              <option key={tag.tag} value={tag.tag}>
                {tag.tag} ({tag.count})
              </option>
            ))}
          </select>

          <div className="filter-checkboxes">
            <label>
              <input
                type="checkbox"
                checked={showFavoritesOnly}
                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
              />
              {translate('documents.favoritesOnly') || 'Favorites Only'}
            </label>
            <label>
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              {translate('documents.showArchived') || 'Show Archived'}
            </label>
          </div>

          <div className="sort-controls">
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="updated_at">{translate('documents.sortUpdated') || 'Last Updated'}</option>
              <option value="created_at">{translate('documents.sortCreated') || 'Created'}</option>
              <option value="title">{translate('documents.sortTitle') || 'Title'}</option>
              <option value="visit_count">{translate('documents.sortVisits') || 'Most Visited'}</option>
            </select>
            <button
              className="btn-icon"
              onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
              title={sortOrder === 'ASC' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'ASC' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* 文档列表 */}
        <div className="documents-list-container">
          {loading ? (
            <div className="loading-spinner">{translate('common.loading') || 'Loading...'}</div>
          ) : (
            <DocumentList
              documents={documents}
              selectedDocumentId={selectedDocument?.id}
              onSelectDocument={handleSelectDocument}
              onDeleteDocument={handleDeleteDocument}
              onToggleFavorite={handleToggleFavorite}
              translate={translate}
              viewMode={viewMode}
            />
          )}
        </div>

        {/* 操作按钮 */}
        <div className="documents-actions">
          <button className="btn-secondary" onClick={handleExport}>
            📥 {translate('documents.export') || 'Export'}
          </button>
          <label className="btn-secondary">
            📤 {translate('documents.import') || 'Import'}
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </label>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="documents-content">
        {isEditing ? (
          <DocumentEditor
            document={selectedDocument}
            categories={categories}
            onSave={handleSaveDocument}
            onCancel={handleCancelEdit}
            translate={translate}
          />
        ) : selectedDocument ? (
          <div className="document-viewer">
            <div className="document-viewer-header">
              <div className="document-viewer-title-section">
                <span className="document-viewer-icon">{selectedDocument.icon}</span>
                <h1>{selectedDocument.title}</h1>
              </div>
              <div className="document-viewer-actions">
                <button className="btn-secondary" onClick={handleOpenLink}>
                  🔗 {translate('documents.openLink') || 'Open Link'}
                </button>
                <button className="btn-primary" onClick={handleEditCurrentDocument}>
                  ✏️ {translate('common.edit') || 'Edit'}
                </button>
              </div>
            </div>

            <div className="document-viewer-meta">
              <span>{translate('documents.category') || 'Category'}: {selectedDocument.category}</span>
              <span>{translate('documents.updated') || 'Updated'}: {new Date(selectedDocument.updated_at).toLocaleString()}</span>
              {selectedDocument.visit_count > 0 && (
                <span>{translate('documents.visits') || 'Visits'}: {selectedDocument.visit_count}</span>
              )}
            </div>

            {selectedDocument.tags && selectedDocument.tags.length > 0 && (
              <div className="document-viewer-tags">
                {selectedDocument.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            )}

            {selectedDocument.description && (
              <div className="document-viewer-description">
                <h3>{translate('documents.description') || 'Description'}</h3>
                <p>{selectedDocument.description}</p>
              </div>
            )}

            <div className="document-viewer-url">
              <h3>{translate('documents.url') || 'URL'}</h3>
              <a href={selectedDocument.url} target="_blank" rel="noopener noreferrer" className="document-link">
                {selectedDocument.url}
              </a>
            </div>
          </div>
        ) : (
          <div className="document-placeholder">
            <div className="placeholder-icon">📚</div>
            <h2>{translate('documents.selectDocument') || 'Select a document to view'}</h2>
            <p>{translate('documents.selectDocumentHint') || 'Or create a new document to get started'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
