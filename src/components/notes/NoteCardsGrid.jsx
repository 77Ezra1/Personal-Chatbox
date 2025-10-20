/**
 * 笔记卡片网格组件
 * 显示所有笔记的卡片视图
 */

import { formatNoteTime } from '@/lib/utils';
import './NoteCardsGrid.css';

export function NoteCardsGrid({ notes, onEditNote, translate, userTimezone, categories, loading }) {
  if (loading) {
    return (
      <div className="notes-cards-loading">
        <div className="loading-spinner">
          {translate('common.loading') || 'Loading...'}
        </div>
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="notes-cards-empty">
        <div className="empty-icon">📝</div>
        <h2>{translate('notes.noNotes') || 'No notes yet'}</h2>
        <p>{translate('notes.createFirstNote') || 'Create your first note to get started'}</p>
      </div>
    );
  }

  return (
    <div className="notes-cards-grid">
      {notes.map((note) => {
        // 获取分类信息
        const categoryInfo = categories?.find(cat => cat.name === note.category);
        const categoryColor = categoryInfo?.color || '#6366f1';

        return (
          <div key={note.id} className="note-card-item">
            {/* 卡片头部 */}
            <div className="card-header">
              <h3 className="card-title">{note.title || translate('notes.untitled') || 'Untitled'}</h3>
              <button 
                className="card-edit-btn" 
                onClick={() => onEditNote(note)}
                title={translate('common.edit') || 'Edit'}
              >
                <span className="edit-icon">✏️</span>
              </button>
            </div>

            {/* 卡片元信息 */}
            <div className="card-meta">
              {/* 分类 */}
              <div className="card-meta-item">
                <span className="meta-icon">📂</span>
                <span 
                  className="category-tag" 
                  style={{ 
                    backgroundColor: `${categoryColor}15`,
                    color: categoryColor,
                    borderColor: `${categoryColor}30`
                  }}
                >
                  {note.category}
                </span>
              </div>

              {/* 时间信息 */}
              <div className="card-meta-row">
                <div className="card-meta-item">
                  <span className="meta-icon">📅</span>
                  <span className="meta-text">
                    {formatNoteTime(note.created_at, note.created_at, userTimezone)}
                  </span>
                </div>
                <div className="card-meta-item">
                  <span className="meta-icon">🕐</span>
                  <span className="meta-text">
                    {formatNoteTime(note.updated_at, note.created_at, userTimezone)}
                  </span>
                </div>
              </div>

              {/* 标签 */}
              {note.tags && note.tags.length > 0 && (
                <div className="card-meta-item tags-container">
                  <span className="meta-icon">🏷️</span>
                  <div className="tags-list">
                    {note.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="tag-item">{tag}</span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="tag-more">+{note.tags.length - 3}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 内容预览 */}
            <div className="card-content">
              <div
                className="content-preview"
                dangerouslySetInnerHTML={{ 
                  __html: note.content?.substring(0, 200) || '' 
                }}
              />
              {note.content?.length > 200 && (
                <span className="content-ellipsis">...</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
