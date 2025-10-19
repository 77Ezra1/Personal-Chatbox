/**
 * 笔记编辑器组件
 * 支持富文本编辑、Markdown语法
 * 使用 TipTap 编辑器提供 Typora/Feishu 风格的编辑体验
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import MarkdownLikeEditor from './MarkdownLikeEditor';
import { WordCounter } from './WordCounter';
import { AIToolbar } from './AIToolbar';
import { Select } from './Select';
import './NoteEditor-v0.css';
import './NoteEditor.css';

export function NoteEditor({ note, categories, onSave, onCancel, translate, onEditorReady, onContentChange, onCreateCategory }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [category, setCategory] = useState(note?.category || 'default');
  const [tags, setTags] = useState(note?.tags || []);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editor, setEditor] = useState(null);

  // 通知父组件 editor 已准备好
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // 通知父组件内容变化
  useEffect(() => {
    if (onContentChange) {
      onContentChange(content);
    }
  }, [content, onContentChange]);

  const titleRef = useRef(null);

  // 自动聚焦标题
  useEffect(() => {
    if (titleRef.current && !note) {
      titleRef.current.focus();
    }
  }, [note]);

  // 处理保存
  const handleSave = useCallback(async (e) => {
    // 阻止任何默认行为
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('[NoteEditor] handleSave called');

    if (!title.trim() && !content.trim()) {
      console.log('[NoteEditor] Empty note, skipping save');
      return;
    }

    console.log('[NoteEditor] Starting save process');
    setIsSaving(true);
    try {
      await onSave({
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        category,
        tags
      });
      console.log('[NoteEditor] Save completed successfully');
    } catch (error) {
      console.error('[NoteEditor] Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [title, content, category, tags, onSave]);

  // 处理标签添加
  const handleAddTag = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
        setTagInput('');
      }
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      // 删除最后一个标签
      setTags(tags.slice(0, -1));
    }
  }, [tagInput, tags]);

  // 处理标签删除
  const handleRemoveTag = useCallback((tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  }, [tags]);

  // 处理分类创建
  const handleCreateCategory = useCallback(async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    try {
      const created = await onCreateCategory?.(trimmed);
      const categoryName = created?.name || trimmed;
      setCategory(categoryName);
      setNewCategoryName('');
    } catch (error) {
      console.error('[NoteEditor] Failed to create category:', error);
    }
  }, [newCategoryName, onCreateCategory]);

  // 快捷键处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }
      // Escape 取消
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, onCancel]);

  // 格式化按钮 - 使用 TipTap 命令
  const formatButtons = [
    {
      label: 'B',
      title: 'Bold (Ctrl+B)',
      action: () => editor?.chain().focus().toggleBold().run(),
      isActive: () => editor?.isActive('bold')
    },
    {
      label: 'I',
      title: 'Italic (Ctrl+I)',
      action: () => editor?.chain().focus().toggleItalic().run(),
      isActive: () => editor?.isActive('italic')
    },
    {
      label: 'H1',
      title: 'Heading 1',
      action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor?.isActive('heading', { level: 1 })
    },
    {
      label: 'H2',
      title: 'Heading 2',
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor?.isActive('heading', { level: 2 })
    },
    {
      label: 'H3',
      title: 'Heading 3',
      action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor?.isActive('heading', { level: 3 })
    },
    {
      label: '•',
      title: 'Bullet List',
      action: () => editor?.chain().focus().toggleBulletList().run(),
      isActive: () => editor?.isActive('bulletList')
    },
    {
      label: '1.',
      title: 'Numbered List',
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      isActive: () => editor?.isActive('orderedList')
    },
    {
      label: '❝',
      title: 'Quote',
      action: () => editor?.chain().focus().toggleBlockquote().run(),
      isActive: () => editor?.isActive('blockquote')
    },
    {
      label: 'Code',
      title: 'Code Block',
      action: () => editor?.chain().focus().toggleCodeBlock().run(),
      isActive: () => editor?.isActive('codeBlock')
    }
  ];

  return (
    <div className="note-editor">
      {/* 统一顶部区域 - 包含标题、工具栏和AI功能 */}
      <div className="note-editor-top">
        {/* 标题和操作按钮 */}
        <div className="note-editor-header">
          <input
            ref={titleRef}
            type="text"
            className="note-title-input"
            placeholder={translate?.('notes.titlePlaceholder') || 'Note Title...'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          />
          <div className="note-editor-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={isSaving}
            >
              {translate?.('common.cancel') || 'Cancel'}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (translate?.('common.saving') || 'Saving...') : (translate?.('common.save') || 'Save')}
            </button>
          </div>
        </div>

        {/* 格式化工具栏 */}
        <div className="note-editor-toolbar">
          <div className="toolbar-section toolbar-category">
            <div className="category-section-header">
              <span className="section-icon">📂</span>
              <span className="section-label">{translate?.('notes.category') || 'Category'}</span>
            </div>
            <Select
              value={category}
              onChange={setCategory}
              options={[
                { value: 'default', label: translate?.('notes.defaultCategory') || 'Default', icon: '📁' },
                ...(categories?.map(cat => ({
                  value: cat.name,
                  label: cat.name,
                  icon: '📂'
                })) || [])
              ]}
              icon="📁"
              className="category-select-custom"
            />
            <div className="category-create-inline">
              <input
                type="text"
                className="category-create-input"
                placeholder={translate?.('notes.newCategoryPlaceholder') || 'New category name'}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
              />
              <button
                type="button"
                className="btn-secondary category-create-button"
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim()}
                title={translate?.('notes.addCategoryTooltip') || 'Add new category'}
              >
                {translate?.('notes.addCategory') || 'Add'}
              </button>
            </div>
          </div>

          <div className="toolbar-section toolbar-tags">
            <div className="tags-container">
              {tags.map((tag, index) => (
                <span key={index} className="tag-chip">
                  {tag}
                  <button
                    type="button"
                    className="tag-remove-btn"
                    onClick={() => handleRemoveTag(tag)}
                    title="Remove tag"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="tag-input-inline"
                placeholder={translate?.('notes.addTag') || '添加标签...'}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>
          </div>

          <div className="toolbar-section format-buttons">
            {formatButtons.map((btn, index) => (
              <button
                key={index}
                type="button"
                className={`btn-icon ${btn.isActive?.() ? 'active' : ''}`}
                title={btn.title}
                onClick={btn.action}
                disabled={!editor}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI 工具栏 */}
        {editor && (
          <AIToolbar
            noteContent={content}
            editor={editor}
            onInsert={(text) => {
              editor.chain().focus().insertContent(text).run();
            }}
            onReplace={() => {
              // 替换逻辑已在 AIToolbar 中处理
            }}
          />
        )}
      </div>

      <div className="note-editor-body">
        <MarkdownLikeEditor
          initialHTML={note?.content || ''}
          placeholder={translate?.('notes.contentPlaceholder') || '使用 Markdown 快捷键：# 标题，- 列表，> 引用...'}
          onUpdateHTML={setContent}
          onEditorReady={setEditor}
        />
      </div>

      <div className="note-editor-footer">
        <WordCounter content={content} />
        <div className="editor-hints">
          <span>{translate?.('notes.shortcuts') || 'Shortcuts'}: Ctrl+S {translate?.('common.save') || 'Save'}, Esc {translate?.('common.cancel') || 'Cancel'}</span>
        </div>
      </div>
    </div>
  );
}
