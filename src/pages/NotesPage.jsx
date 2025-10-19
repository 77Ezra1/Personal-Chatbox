/**
 * 笔记管理页面
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { NoteList } from '@/components/notes/NoteList';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { Select } from '@/components/notes/Select';
import { RightPanel } from '@/components/notes/RightPanel';
import { OutlinePanel } from '@/components/notes/OutlinePanel';
import { AIAssistantPanel } from '@/components/notes/AIAssistantPanel';
import { ResizablePanel } from '@/components/notes/ResizablePanel';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { formatNoteTime } from '@/lib/utils';
import * as notesApi from '@/lib/notesApi';
import '@/styles/notes-v0-theme.css';
import '@/styles/notes-v0-enhanced.css';
import './NotesPage.css';

export default function NotesPage() {
  const { translate } = useTranslation();
  const { user } = useAuth();

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

  // 右侧面板状态
  const [rightPanelTab, setRightPanelTab] = useState('outline');
  const [currentEditor, setCurrentEditor] = useState(null);
  const [currentContent, setCurrentContent] = useState('');

  // 获取用户时区，优先使用用户设置，否则使用默认值
  const getUserTimezone = useCallback(() => {
    return user?.timezone || 'Asia/Shanghai';
  }, [user]);

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
    console.log('[NotesPage] Saving note:', noteData);
    console.log('[NotesPage] Selected note:', selectedNote);

    try {
      if (selectedNote) {
        // 更新现有笔记
        console.log('[NotesPage] Updating note ID:', selectedNote.id);
        const updated = await notesApi.updateNote(selectedNote.id, noteData);
        console.log('[NotesPage] Update response:', updated);

        if (!updated || !updated.id) {
          throw new Error('Invalid response from server');
        }
        setNotes(notes.map(n => n.id === updated.id ? updated : n));
        setSelectedNote(updated);
        toast.success(translate('notes.updateSuccess') || 'Note updated');
      } else {
        // 创建新笔记
        console.log('[NotesPage] Creating new note');
        const created = await notesApi.createNote(noteData);
        console.log('[NotesPage] Create response:', created);

        if (!created || !created.id) {
          throw new Error('Invalid response from server');
        }
        setNotes([created, ...notes]);
        setSelectedNote(created);
        toast.success(translate('notes.createSuccess') || 'Note created');
      }
      setIsEditing(false);
      loadMetadata(); // 更新统计信息
    } catch (error) {
      console.error('[NotesPage] Failed to save note:', error);
      console.error('[NotesPage] Error details:', error.response?.data || error.message);
      toast.error(translate('notes.saveError') || `Failed to save note: ${error.message}`);
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
      if (!updated || !updated.id) {
        throw new Error('Invalid response from server');
      }
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

  // 创建新分类
  const handleCreateCategory = useCallback(async (categoryName) => {
    try {
      console.log('[NotesPage] Creating category:', categoryName);
      
      // 调用 API 创建分类
      const result = await notesApi.createCategory({
        name: categoryName,
        color: '#6366f1', // 默认颜色
        description: '',
        icon: ''
      });

      console.log('[NotesPage] Category created:', result);

      if (result.success && result.category) {
        // 将新分类添加到状态中
        setCategories(prevCategories => [...prevCategories, result.category]);
        
        // 更新统计信息
        loadMetadata();
        
        toast.success(result.message || translate('notes.categoryCreated') || 'Category created successfully');
        
        // 返回新创建的分类
        return result.category;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('[NotesPage] Failed to create category:', error);
      
      // 处理特定错误
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.error || error.message;
      
      switch (errorCode) {
        case 'DUPLICATE_CATEGORY':
          toast.error(translate('notes.categoryExists') || 'Category already exists');
          break;
        case 'NAME_TOO_LONG':
          toast.error(translate('notes.categoryNameTooLong') || 'Category name is too long (max 50 characters)');
          break;
        case 'INVALID_COLOR':
          toast.error(translate('notes.invalidColor') || 'Invalid color format');
          break;
        default:
          toast.error(translate('notes.categoryCreateError') || `Failed to create category: ${errorMessage}`);
      }
      
      // 抛出错误以便 NoteEditor 可以处理
      throw error;
    }
  }, [translate, loadMetadata]);

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
      {/* 左侧边栏 - 可调整宽度 */}
      <ResizablePanel
        side="left"
        defaultWidth={280}
        minWidth={200}
        maxWidth={400}
        storageKey="notes-sidebar-width"
        className="notes-sidebar"
      >
        <div className="notes-sidebar-header">
          <button className="btn-primary btn-new-note" onClick={handleCreateNote}>
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
            placeholder={translate('notes.search') || '搜索...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Select
            value={filterCategory}
            onChange={setFilterCategory}
            options={[
              { value: '', label: translate('notes.allCategories') || '所有分类', icon: '📁' },
              ...categories.map(cat => ({
                value: cat.name,
                label: cat.name,
                icon: '📂'
              }))
            ]}
            icon="📁"
            placeholder={translate('notes.allCategories') || '分类'}
          />

          <Select
            value={filterTag}
            onChange={setFilterTag}
            options={[
              { value: '', label: translate('notes.allTags') || '所有标签', icon: '🏷️' },
              ...tags.map(tag => ({
                value: tag.tag,
                label: tag.tag,
                count: tag.count,
                icon: '🏷️'
              }))
            ]}
            icon="🏷️"
            placeholder={translate('notes.allTags') || '标签'}
            searchable={tags.length > 5}
          />

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
            <Select
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'updated_at', label: translate('notes.sortUpdated') || 'Last Updated', icon: '🕐' },
                { value: 'created_at', label: translate('notes.sortCreated') || 'Created', icon: '📅' },
                { value: 'title', label: translate('notes.sortTitle') || 'Title', icon: '📝' }
              ]}
              icon="🔽"
            />
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
              userTimezone={getUserTimezone()}
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
      </ResizablePanel>

      {/* 主内容区 */}
      <div className="notes-content">
        {isEditing ? (
          <NoteEditor
            note={selectedNote}
            categories={categories}
            onSave={handleSaveNote}
            onCancel={handleCancelEdit}
            onCreateCategory={handleCreateCategory}
            translate={translate}
            onEditorReady={setCurrentEditor}
            onContentChange={setCurrentContent}
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
              <span>
                {translate('notes.updated') || 'Updated'}: {formatNoteTime(
                  selectedNote.updated_at,
                  selectedNote.created_at,
                  getUserTimezone()
                )}
              </span>
            </div>
            {/* normalizeNote 确保 tags 是数组 */}
            {selectedNote.tags.length > 0 && (
              <div className="note-viewer-tags">
                {selectedNote.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            )}
            <div
              className="note-viewer-content note-preview"
              dangerouslySetInnerHTML={{ __html: selectedNote.content }}
            />
          </div>
        ) : (
          <div className="note-placeholder">
            <div className="placeholder-icon">📝</div>
            <h2>{translate('notes.selectNote') || 'Select a note to view'}</h2>
            <p>{translate('notes.selectNoteHint') || 'Or create a new note to get started'}</p>
          </div>
        )}
      </div>

      {/* 右侧面板 - 仅在编辑模式显示，可调整宽度 */}
      {isEditing && (
        <ResizablePanel
          side="right"
          defaultWidth={350}
          minWidth={280}
          maxWidth={600}
          storageKey="notes-right-panel-width"
        >
          <RightPanel
            activeTab={rightPanelTab}
            onTabChange={setRightPanelTab}
            tabs={[
              { id: 'outline', label: '大纲', icon: '📑' },
              { id: 'ai', label: 'AI助手', icon: '🤖' }
            ]}
          >
            {rightPanelTab === 'outline' && (
              <OutlinePanel
                editor={currentEditor}
                content={currentContent}
              />
            )}
            {rightPanelTab === 'ai' && (
              <AIAssistantPanel
                noteContent={currentContent}
                onInsertText={(text) => {
                  if (currentEditor) {
                    currentEditor.chain().focus().insertContent(text).run();
                  }
                }}
              />
            )}
          </RightPanel>
        </ResizablePanel>
      )}
    </div>
  );
}
