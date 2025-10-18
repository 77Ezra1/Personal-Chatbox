/**
 * 笔记列表组件
 */

import { memo } from 'react';
import './NoteCard.css';
import './NoteList.css';

export const NoteList = memo(function NoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  onDeleteNote,
  onToggleFavorite,
  translate
}) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    // 小于1分钟
    if (diff < 60000) {
      return translate?.('time.justNow') || 'Just now';
    }
    // 小于1小时
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return translate?.('time.minutesAgo', { count: minutes }) || `${minutes}m ago`;
    }
    // 小于1天
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return translate?.('time.hoursAgo', { count: hours }) || `${hours}h ago`;
    }
    // 小于7天
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return translate?.('time.daysAgo', { count: days }) || `${days}d ago`;
    }
    // 显示日期
    return date.toLocaleDateString();
  };

  const truncateContent = (content, maxLength = 100) => {
    if (!content) return '';
    // 移除Markdown格式
    const plainText = content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  if (notes.length === 0) {
    return (
      <div className="note-list-empty">
        <div className="empty-icon">📝</div>
        <p>{translate?.('notes.empty') || 'No notes yet'}</p>
        <p className="empty-hint">
          {translate?.('notes.emptyHint') || 'Create your first note to get started'}
        </p>
      </div>
    );
  }

  return (
    <div className="note-list">
      {notes.filter(note => note && note.id).map((note, index) => (
        <div
          key={note.id}
          className={`note-card ${selectedNoteId === note.id ? 'selected' : ''} ${note.is_favorite ? 'favorited' : ''}`}
          style={{ animationDelay: `${index * 50}ms` }}
          onClick={() => onSelectNote(note)}
        >
          <div className="note-card-header">
            <h3 className="note-card-title">
              {note.is_favorite && <span className="favorite-icon">⭐</span>}
              {note.title || 'Untitled Note'}
            </h3>
            <div className="note-card-actions">
              <button
                className="btn-card-action"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(note.id, !note.is_favorite);
                }}
                title={note.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {note.is_favorite ? '★' : '☆'}
              </button>
              <button
                className="btn-card-action btn-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNote(note.id);
                }}
                title="Delete note"
              >
                🗑️
              </button>
            </div>
          </div>

          <p className="note-card-content">
            {truncateContent(note.content)}
          </p>

          <div className="note-card-footer">
            <div className="note-card-meta">
              {note.category && note.category !== 'default' && (
                <span className="note-category-badge">
                  📁 {note.category}
                </span>
              )}
              <span className="note-date">
                {formatDate(note.updated_at)}
              </span>
            </div>

            {note.tags && note.tags.length > 0 && (
              <div className="note-card-tags">
                {note.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="note-tag-pill">
                    {tag}
                  </span>
                ))}
                {note.tags.length > 3 && (
                  <span className="note-tag-more">
                    +{note.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});
