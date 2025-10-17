/**
 * 文档列表组件 - 支持列表/卡片双视图
 */

import { memo } from 'react';
import './DocumentList.css';

const DocumentList = memo(function DocumentList({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onDeleteDocument,
  onToggleFavorite,
  translate,
  viewMode = 'list' // 'list' or 'card'
}) {
  if (!documents || documents.length === 0) {
    return (
      <div className="document-list-empty">
        <div className="empty-icon">📄</div>
        <p>{translate('documents.noDocuments') || 'No documents found'}</p>
      </div>
    );
  }

  const handleDocumentClick = (document, e) => {
    // 如果点击的是操作按钮，不触发选择
    if (e.target.closest('.document-item-actions')) {
      return;
    }
    onSelectDocument(document);
  };

  const handleToggleFavorite = (e, documentId, isFavorite) => {
    e.stopPropagation();
    onToggleFavorite(documentId, !isFavorite);
  };

  const handleDelete = (e, documentId) => {
    e.stopPropagation();
    onDeleteDocument(documentId);
  };

  // 渲染列表视图项
  const renderListItem = (document) => (
    <div
      key={document.id}
      className={`document-item ${selectedDocumentId === document.id ? 'active' : ''}`}
      onClick={(e) => handleDocumentClick(document, e)}
    >
      <div className="document-item-icon">
        {document.icon || '📄'}
      </div>

      <div className="document-item-content">
        <div className="document-item-header">
          <h4 className="document-item-title">{document.title}</h4>
          {document.is_favorite === 1 && (
            <span className="document-favorite-badge">⭐</span>
          )}
        </div>

        {document.description && (
          <p className="document-item-description">
            {document.description.length > 80
              ? `${document.description.substring(0, 80)}...`
              : document.description}
          </p>
        )}

        <div className="document-item-meta">
          <span className="document-meta-category">
            {document.category}
          </span>
          {document.visit_count > 0 && (
            <span className="document-meta-visits">
              👁️ {document.visit_count}
            </span>
          )}
        </div>

        {document.tags && document.tags.length > 0 && (
          <div className="document-item-tags">
            {document.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="document-tag">
                {tag}
              </span>
            ))}
            {document.tags.length > 3 && (
              <span className="document-tag-more">
                +{document.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="document-item-actions">
        <button
          className="document-action-btn"
          onClick={(e) => handleToggleFavorite(e, document.id, document.is_favorite)}
          title={document.is_favorite ? translate('documents.unfavorite') : translate('documents.favorite')}
        >
          {document.is_favorite === 1 ? '⭐' : '☆'}
        </button>
        <button
          className="document-action-btn document-action-delete"
          onClick={(e) => handleDelete(e, document.id)}
          title={translate('common.delete') || 'Delete'}
        >
          🗑️
        </button>
      </div>
    </div>
  );

  // 渲染卡片视图项
  const renderCardItem = (document) => (
    <div
      key={document.id}
      className={`document-card ${selectedDocumentId === document.id ? 'active' : ''}`}
      onClick={(e) => handleDocumentClick(document, e)}
    >
      <div className="document-card-header">
        <div className="document-card-icon">
          {document.icon || '📄'}
        </div>
        <div className="document-card-actions">
          <button
            className="document-action-btn"
            onClick={(e) => handleToggleFavorite(e, document.id, document.is_favorite)}
            title={document.is_favorite ? translate('documents.unfavorite') : translate('documents.favorite')}
          >
            {document.is_favorite === 1 ? '⭐' : '☆'}
          </button>
          <button
            className="document-action-btn document-action-delete"
            onClick={(e) => handleDelete(e, document.id)}
            title={translate('common.delete') || 'Delete'}
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="document-card-body">
        <h4 className="document-card-title">{document.title}</h4>

        {document.description && (
          <p className="document-card-description">
            {document.description.length > 120
              ? `${document.description.substring(0, 120)}...`
              : document.description}
          </p>
        )}

        <div className="document-card-meta">
          <span className="document-meta-category">
            {document.category}
          </span>
          {document.visit_count > 0 && (
            <span className="document-meta-visits">
              👁️ {document.visit_count}
            </span>
          )}
        </div>

        {document.tags && document.tags.length > 0 && (
          <div className="document-card-tags">
            {document.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="document-tag">
                {tag}
              </span>
            ))}
            {document.tags.length > 3 && (
              <span className="document-tag-more">
                +{document.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`document-list-wrapper ${viewMode === 'card' ? 'card-view' : 'list-view'}`}>
      {viewMode === 'list' ? (
        <div className="document-list">
          {documents.map(renderListItem)}
        </div>
      ) : (
        <div className="document-grid">
          {documents.map(renderCardItem)}
        </div>
      )}
    </div>
  );
});

export { DocumentList };
