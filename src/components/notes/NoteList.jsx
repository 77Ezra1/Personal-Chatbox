/**
 * 笔记列表组件
 */

import { memo } from 'react';
import { formatNoteTime } from '@/lib/utils';
import './NoteCard.css';
import './NoteList.css';

export const NoteList = memo(function NoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  onDeleteNote,
  onToggleFavorite,
  translate,
  userTimezone = 'Asia/Shanghai'
}) {
  console.log('[NoteList] Rendering with notes count:', notes.length);
  console.log('[NoteList] Selected note ID:', selectedNoteId);
  
  const formatDate = (note) => {
    // 使用 formatNoteTime 统一格式化，带回退逻辑
    // normalizeNote 确保 updated_at 和 created_at 已经是 ISO 格式
    return formatNoteTime(
      note.updated_at,
      note.created_at,
      userTimezone
    );
  };

  if (notes.length === 0) {
    console.log('[NoteList] No notes to display');
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
      {notes.map((note, index) => (
        <div
          key={note.id}
          className={`note-list-item ${selectedNoteId === note.id ? 'selected' : ''} ${note.is_favorite ? 'favorited' : ''}`}
          style={{ animationDelay: `${index * 30}ms` }}
          onClick={() => onSelectNote(note)}
        >
          {/* 笔记名称 + 收藏图标 */}
          <div className="note-list-item-title">
            {note.is_favorite && <span className="favorite-indicator">⭐</span>}
            <span className="note-title-text">{note.title || 'Untitled Note'}</span>
          </div>

          {/* 笔记分类 */}
          {note.category && note.category !== 'default' && (
            <div className="note-list-item-category">
              <span className="category-badge" style={{ 
                backgroundColor: note.category_color || '#6366f1',
                color: '#fff'
              }}>
                {note.category}
              </span>
            </div>
          )}

          {/* 时间信息 */}
          <div className="note-list-item-time">
            <span className="time-created" title="创建时间">
              📝 {new Date(note.created_at).toLocaleDateString('zh-CN', {
                timeZone: userTimezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })}
            </span>
            <span className="time-separator">•</span>
            <span className="time-updated" title="最后修改">
              ✏️ {formatDate(note)}
            </span>
          </div>

          {/* 操作按钮 */}
          <div className="note-list-item-actions">
            <button
              className="btn-list-action btn-favorite"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(note.id, !note.is_favorite);
              }}
              title={note.is_favorite ? '取消收藏' : '收藏'}
            >
              {note.is_favorite ? '★' : '☆'}
            </button>
            <button
              className="btn-list-action btn-delete"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('确定要删除这条笔记吗？')) {
                  onDeleteNote(note.id);
                }
              }}
              title="删除笔记"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});
