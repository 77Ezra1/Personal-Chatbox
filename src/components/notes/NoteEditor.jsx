/**
 * 笔记编辑器组件
 * 支持富文本编辑、Markdown语法
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import './NoteEditor.css';

export function NoteEditor({ note, categories, onSave, onCancel, translate }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [category, setCategory] = useState(note?.category || 'default');
  const [tags, setTags] = useState(note?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const contentRef = useRef(null);
  const titleRef = useRef(null);

  // 自动聚焦标题
  useEffect(() => {
    if (titleRef.current && !note) {
      titleRef.current.focus();
    }
  }, [note]);

  // 处理保存
  const handleSave = useCallback(async () => {
    if (!title.trim() && !content.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        category,
        tags
      });
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
    }
  }, [tagInput, tags]);

  // 处理标签删除
  const handleRemoveTag = useCallback((tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  }, [tags]);

  // 快捷键处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Escape 取消
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, onCancel]);

  // 插入格式
  const insertFormat = useCallback((before, after = '') => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);

    setContent(newText);

    // 恢复光标位置
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content]);

  // 格式化按钮
  const formatButtons = [
    { label: 'B', title: 'Bold', action: () => insertFormat('**', '**') },
    { label: 'I', title: 'Italic', action: () => insertFormat('*', '*') },
    { label: 'H1', title: 'Heading 1', action: () => insertFormat('# ') },
    { label: 'H2', title: 'Heading 2', action: () => insertFormat('## ') },
    { label: 'H3', title: 'Heading 3', action: () => insertFormat('### ') },
    { label: '•', title: 'List', action: () => insertFormat('- ') },
    { label: '1.', title: 'Numbered List', action: () => insertFormat('1. ') },
    { label: 'Link', title: 'Link', action: () => insertFormat('[', '](url)') },
    { label: 'Code', title: 'Code Block', action: () => insertFormat('```\n', '\n```') }
  ];

  // 渲染Markdown预览
  const renderPreview = useCallback(() => {
    // 简单的Markdown渲染
    let html = content
      // 代码块
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // 行内代码
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // 标题
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // 粗体
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // 斜体
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      // 列表
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
      // 段落
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // 包裹列表
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

    return `<p>${html}</p>`;
  }, [content]);

  return (
    <div className="note-editor">
      <div className="note-editor-header">
        <input
          ref={titleRef}
          type="text"
          className="note-title-input"
          placeholder={translate?.('notes.titlePlaceholder') || 'Note Title...'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="note-editor-actions">
          <button
            className="btn-icon"
            onClick={() => setIsPreview(!isPreview)}
            title={isPreview ? 'Edit' : 'Preview'}
          >
            {isPreview ? '✏️' : '👁️'}
          </button>
          <button
            className="btn-secondary"
            onClick={onCancel}
            disabled={isSaving}
          >
            {translate?.('common.cancel') || 'Cancel'}
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (translate?.('common.saving') || 'Saving...') : (translate?.('common.save') || 'Save')}
          </button>
        </div>
      </div>

      <div className="note-editor-toolbar">
        <div className="toolbar-section">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="category-select"
          >
            <option value="default">{translate?.('notes.defaultCategory') || 'Default'}</option>
            {categories?.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {!isPreview && (
          <div className="toolbar-section format-buttons">
            {formatButtons.map((btn, index) => (
              <button
                key={index}
                className="btn-icon"
                title={btn.title}
                onClick={btn.action}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="note-editor-body">
        {isPreview ? (
          <div
            className="note-preview"
            dangerouslySetInnerHTML={{ __html: renderPreview() }}
          />
        ) : (
          <textarea
            ref={contentRef}
            className="note-content-input"
            placeholder={translate?.('notes.contentPlaceholder') || 'Start writing...'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        )}
      </div>

      <div className="note-editor-footer">
        <div className="tags-input-container">
          <div className="tags-list">
            {tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
                <button
                  className="tag-remove"
                  onClick={() => handleRemoveTag(tag)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            className="tag-input"
            placeholder={translate?.('notes.addTag') || 'Add tag...'}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
          />
        </div>

        <div className="editor-hints">
          <span>{translate?.('notes.shortcuts') || 'Shortcuts'}: Ctrl+S {translate?.('common.save') || 'Save'}, Esc {translate?.('common.cancel') || 'Cancel'}</span>
        </div>
      </div>
    </div>
  );
}
