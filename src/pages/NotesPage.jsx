/**
 * 笔记管理页面
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { NoteList } from '@/components/notes/NoteList';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { useTranslation } from '@/hooks/useTranslation';
import * as notesApi from '@/lib/notesApi';
import './NotesPage.css';

export default function NotesPage() {
  const { translate } = useTranslation();

  // 状态管理
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
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

  // 加载笔记
  const loadNotes = useCallback(async () => {
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

      let fetchedNotes;
      if (searchQuery) {
        fetchedNotes = await notesApi.searchNotes(searchQuery, options);
      } else {
        fetchedNotes = await notesApi.getAllNotes(options);
      }

      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
      toast.error(translate('notes.loadError') || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterCategory, filterTag, showFavoritesOnly, showArchived, sortBy, sortOrder, translate]);

  // 加载分类和标签
  const loadMetadata = useCallback(async () => {
    try {
      const [fetchedCategories, fetchedTags, stats] = await Promise.all([
        notesApi.getCategories(),
        notesApi.getAllTags(),
        notesApi.getStatistics()
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
    loadNotes();
    loadMetadata();
  }, [loadNotes, loadMetadata]);

  // 创建新笔记
  const handleCreateNote = useCallback(() => {
    setSelectedNote(null);
    setIsEditing(true);
  }, []);

  // 选择笔记
  const handleSelectNote = useCallback((note) => {
    setSelectedNote(note);
    setIsEditing(false);
  }, []);

  // 保存笔记
  const handleSaveNote = useCallback(async (noteData) => {
    try {
      if (selectedNote) {
        // 更新现有笔记
        const updated = await notesApi.updateNote(selectedNote.id, noteData);
        setNotes(notes.map(n => n.id === updated.id ? updated : n));
        setSelectedNote(updated);
        toast.success(translate('notes.updateSuccess') || 'Note updated');
      } else {
        // 创建新笔记
        const created = await notesApi.createNote(noteData);
        setNotes([created, ...notes]);
        setSelectedNote(created);
        toast.success(translate('notes.createSuccess') || 'Note created');
      }
      setIsEditing(false);
      loadMetadata(); // 更新统计信息
    } catch (error) {
      console.error('Failed to save note:', error);
      toast.error(translate('notes.saveError') || 'Failed to save note');
    }
  }, [selectedNote, notes, translate, loadMetadata]);

  // 删除笔记
  const handleDeleteNote = useCallback(async (noteId) => {
    if (!confirm(translate('notes.deleteConfirm') || 'Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await notesApi.deleteNote(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
      toast.success(translate('notes.deleteSuccess') || 'Note deleted');
      loadMetadata();
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error(translate('notes.deleteError') || 'Failed to delete note');
    }
  }, [notes, selectedNote, translate, loadMetadata]);

  // 切换收藏
  const handleToggleFavorite = useCallback(async (noteId, isFavorite) => {
    try {
      const updated = await notesApi.updateNote(noteId, { is_favorite: isFavorite });
      setNotes(notes.map(n => n.id === updated.id ? updated : n));
      if (selectedNote?.id === noteId) {
        setSelectedNote(updated);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error(translate('notes.favoriteError') || 'Failed to update favorite');
    }
  }, [notes, selectedNote, translate]);

  // 编辑当前笔记
  const handleEditCurrentNote = useCallback(() => {
    if (selectedNote) {
      setIsEditing(true);
    }
  }, [selectedNote]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  // 导出笔记
  const handleExport = useCallback(async () => {
    try {
      const data = await notesApi.exportNotes();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(translate('notes.exportSuccess') || 'Notes exported');
    } catch (error) {
      console.error('Failed to export notes:', error);
      toast.error(translate('notes.exportError') || 'Failed to export notes');
    }
  }, [translate]);

  // 导入笔记
  const handleImport = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const notesToImport = data.notes || data;

      const result = await notesApi.importNotes(notesToImport);
      toast.success(translate('notes.importSuccess', { count: result.imported }) || `Imported ${result.imported} notes`);
      loadNotes();
      loadMetadata();
    } catch (error) {
      console.error('Failed to import notes:', error);
      toast.error(translate('notes.importError') || 'Failed to import notes');
    }
  }, [translate, loadNotes, loadMetadata]);

  return (
    <div className="notes-page">
      {/* 侧边栏 */}
      <div className="notes-sidebar">
        <div className="notes-sidebar-header">
          <h2>{translate('notes.title') || 'Notes'}</h2>
          <button className="btn-primary" onClick={handleCreateNote}>
            + {translate('notes.newNote') || 'New Note'}
          </button>
        </div>

        {/* 统计信息 */}
        {statistics && (
          <div className="notes-stats">
            <div className="stat-item">
              <span className="stat-label">{translate('notes.total') || 'Total'}</span>
              <span className="stat-value">{statistics.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{translate('notes.favorites') || 'Favorites'}</span>
              <span className="stat-value">{statistics.favorites}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{translate('notes.categories') || 'Categories'}</span>
              <span className="stat-value">{statistics.categories}</span>
            </div>
          </div>
        )}

        {/* 搜索和过滤 */}
        <div className="notes-filters">
          <input
            type="text"
            className="search-input"
            placeholder={translate('notes.search') || 'Search notes...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">{translate('notes.allCategories') || 'All Categories'}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="">{translate('notes.allTags') || 'All Tags'}</option>
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
              {translate('notes.favoritesOnly') || 'Favorites Only'}
            </label>
            <label>
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              {translate('notes.showArchived') || 'Show Archived'}
            </label>
          </div>

          <div className="sort-controls">
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="updated_at">{translate('notes.sortUpdated') || 'Last Updated'}</option>
              <option value="created_at">{translate('notes.sortCreated') || 'Created'}</option>
              <option value="title">{translate('notes.sortTitle') || 'Title'}</option>
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

        {/* 笔记列表 */}
        <div className="notes-list-container">
          {loading ? (
            <div className="loading-spinner">{translate('common.loading') || 'Loading...'}</div>
          ) : (
            <NoteList
              notes={notes}
              selectedNoteId={selectedNote?.id}
              onSelectNote={handleSelectNote}
              onDeleteNote={handleDeleteNote}
              onToggleFavorite={handleToggleFavorite}
              translate={translate}
            />
          )}
        </div>

        {/* 操作按钮 */}
        <div className="notes-actions">
          <button className="btn-secondary" onClick={handleExport}>
            📥 {translate('notes.export') || 'Export'}
          </button>
          <label className="btn-secondary">
            📤 {translate('notes.import') || 'Import'}
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
      <div className="notes-content">
        {isEditing ? (
          <NoteEditor
            note={selectedNote}
            categories={categories}
            onSave={handleSaveNote}
            onCancel={handleCancelEdit}
            translate={translate}
          />
        ) : selectedNote ? (
          <div className="note-viewer">
            <div className="note-viewer-header">
              <h1>{selectedNote.title}</h1>
              <button className="btn-primary" onClick={handleEditCurrentNote}>
                ✏️ {translate('common.edit') || 'Edit'}
              </button>
            </div>
            <div className="note-viewer-meta">
              <span>{translate('notes.category') || 'Category'}: {selectedNote.category}</span>
              <span>{translate('notes.updated') || 'Updated'}: {new Date(selectedNote.updated_at).toLocaleString()}</span>
            </div>
            {selectedNote.tags && selectedNote.tags.length > 0 && (
              <div className="note-viewer-tags">
                {selectedNote.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            )}
            <div className="note-viewer-content">
              {selectedNote.content}
            </div>
          </div>
        ) : (
          <div className="note-placeholder">
            <div className="placeholder-icon">📝</div>
            <h2>{translate('notes.selectNote') || 'Select a note to view'}</h2>
            <p>{translate('notes.selectNoteHint') || 'Or create a new note to get started'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
