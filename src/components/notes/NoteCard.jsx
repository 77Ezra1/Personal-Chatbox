/**
 * 笔记卡片组件
 * 在非编辑状态下以卡片形式展示笔记信息
 */

import { formatNoteTime } from '@/lib/utils';
import './NoteCard.css';

export function NoteCard({ note, onEdit, translate, userTimezone, categories }) {
  if (!note) {
    return (
      <div className="note-card-placeholder">
        <div className="placeholder-icon">📝</div>
        <h2>{translate('notes.selectNote') || 'Select a note to view'}</h2>
        <p>{translate('notes.selectNoteHint') || 'Or create a new note to get started'}</p>
      </div>
    );
  }

  // 获取分类信息
  const categoryInfo = categories?.find(cat => cat.name === note.category);
  const categoryColor = categoryInfo?.color || '#6366f1';

  return (
    <div className="note-card-container">
      <div className="note-card">
        {/* 卡片头部 */}
        <div className="note-card-header">
          <h1 className="note-card-title">{note.title || translate('notes.untitled') || 'Untitled'}</h1>
          <button className="note-card-edit-btn" onClick={onEdit}>
            <span className="edit-icon">✏️</span>
            <span className="edit-text">{translate('common.edit') || 'Edit'}</span>
          </button>
        </div>

        {/* 卡片元信息 */}
        <div className="note-card-meta">
          <div className="meta-row">
            <div className="meta-item">
              <span className="meta-label">📂 {translate('notes.category') || 'Category'}:</span>
              <span 
                className="meta-value category-badge" 
                style={{ 
                  backgroundColor: `${categoryColor}15`,
                  color: categoryColor,
                  borderColor: `${categoryColor}30`
                }}
              >
                {note.category}
              </span>
            </div>
          </div>

          <div className="meta-row">
            <div className="meta-item">
              <span className="meta-label">📅 {translate('notes.created') || 'Created'}:</span>
              <span className="meta-value">
                {formatNoteTime(note.created_at, note.created_at, userTimezone)}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">🕐 {translate('notes.updated') || 'Updated'}:</span>
              <span className="meta-value">
                {formatNoteTime(note.updated_at, note.created_at, userTimezone)}
              </span>
            </div>
          </div>

          {/* 标签 */}
          {note.tags && note.tags.length > 0 && (
            <div className="meta-row">
              <div className="meta-item meta-tags">
                <span className="meta-label">🏷️ {translate('notes.tags') || 'Tags'}:</span>
                <div className="tags-list">
                  {note.tags.map((tag, index) => (
                    <span key={index} className="tag-badge">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 卡片内容预览 */}
        <div className="note-card-divider"></div>
        <div className="note-card-content">
          <div
            className="note-content-preview"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        </div>
      </div>
    </div>
  );
}
