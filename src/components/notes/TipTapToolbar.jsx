/**
 * TipTap 富文本工具栏
 * 与 TipTap 编辑器无缝集成，支持格式化和 AI 改写
 * 使用原生选区监听，无需 BubbleMenu 依赖
 */

import { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Copy,
  Sparkles,
  ChevronDown,
  Type,
  List,
  ListOrdered,
  Quote,
  Code
} from 'lucide-react';
import { toast } from 'sonner';
import './RichTextToolbar.css';

export function TipTapToolbar({ editor }) {
  const [showRewriteMenu, setShowRewriteMenu] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef(null);

  if (!editor) return null;

  // 监听选区变化
  useEffect(() => {
    const handleSelectionChange = () => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;

      if (hasSelection) {
        // 获取选区位置
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);

        const x = (start.left + end.right) / 2;
        const y = start.top;

        setToolbarPosition({ x, y });
        setShowToolbar(true);
      } else {
        setShowToolbar(false);
        setShowRewriteMenu(false);
        setShowHeadingMenu(false);
      }
    };

    // 监听编辑器选区变化
    editor.on('selectionUpdate', handleSelectionChange);
    editor.on('update', handleSelectionChange);

    return () => {
      editor.off('selectionUpdate', handleSelectionChange);
      editor.off('update', handleSelectionChange);
    };
  }, [editor]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setShowRewriteMenu(false);
        setShowHeadingMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 改写风格
  const rewriteStyles = [
    { label: '专业化', value: 'professional', icon: '💼' },
    { label: '口语化', value: 'casual', icon: '💬' },
    { label: '简洁版', value: 'concise', icon: '✂️' },
    { label: '详细版', value: 'detailed', icon: '📝' }
  ];

  // 标题选项
  const headingOptions = [
    { label: '正文', level: 0, action: () => editor.chain().focus().setParagraph().run() },
    { label: '标题 1', level: 1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: '标题 2', level: 2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: '标题 3', level: 3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: '标题 4', level: 4, action: () => editor.chain().focus().toggleHeading({ level: 4 }).run() }
  ];

  // 格式化按钮
  const formatButtons = [
    {
      icon: <Bold size={16} />,
      title: '加粗',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold')
    },
    {
      icon: <Italic size={16} />,
      title: '斜体',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic')
    },
    {
      icon: <Strikethrough size={16} />,
      title: '删除线',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive('strike')
    },
    {
      icon: <Code size={16} />,
      title: '代码',
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive('code')
    }
  ];

  // 列表按钮
  const listButtons = [
    {
      icon: <List size={16} />,
      title: '无序列表',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList')
    },
    {
      icon: <ListOrdered size={16} />,
      title: '有序列表',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList')
    },
    {
      icon: <Quote size={16} />,
      title: '引用',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive('blockquote')
    }
  ];

  // 处理 AI 改写
  const handleRewrite = async (style) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    if (!selectedText.trim()) {
      toast.error('请先选择要改写的文本');
      return;
    }

    // 检查文本长度（后端要求至少10个字符）
    if (selectedText.trim().length < 10) {
      toast.error('选中的文本太短，至少需要 10 个字符');
      return;
    }

    setIsRewriting(true);
    setShowRewriteMenu(false);

    try {
      toast.loading('AI 改写中...', { id: 'rewrite' });

      const response = await fetch('/api/ai/notes/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          text: selectedText,
          style
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '改写失败');
      }

      const data = await response.json();
      const rewrittenText = data.text; // 后端返回的是 text 字段

      // 替换选中的文本
      editor.chain().focus().deleteSelection().insertContent(rewrittenText).run();

      toast.success('改写完成', { id: 'rewrite' });
    } catch (error) {
      console.error('Rewrite error:', error);
      toast.error(error.message || '改写失败，请重试', { id: 'rewrite' });
    } finally {
      setIsRewriting(false);
    }
  };

  // 复制文本
  const handleCopy = async () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    try {
      await navigator.clipboard.writeText(selectedText);
      toast.success('已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败');
    }
  };

  if (!showToolbar) return null;

  return (
    <div
      ref={toolbarRef}
      className="rich-text-toolbar"
      style={{
        left: `${toolbarPosition.x}px`,
        top: `${toolbarPosition.y}px`
      }}
    >
      <div className="toolbar-content">
        {/* AI 改写按钮 */}
        <div className="toolbar-group">
          <button
            className={`toolbar-btn ai-btn ${isRewriting ? 'loading' : ''}`}
            onClick={() => setShowRewriteMenu(!showRewriteMenu)}
            disabled={isRewriting}
            title="AI 改写（需选中至少10个字符）"
          >
            <Sparkles size={16} />
            <span>AI 改写</span>
            <ChevronDown size={14} />
          </button>

          {/* AI 改写下拉菜单 */}
          {showRewriteMenu && (
            <div className="toolbar-dropdown rewrite-menu">
              {rewriteStyles.map(style => (
                <button
                  key={style.value}
                  className="dropdown-item"
                  onClick={() => handleRewrite(style.value)}
                >
                  <span className="item-icon">{style.icon}</span>
                  <span>{style.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-divider" />

        {/* 标题选择 */}
        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={() => setShowHeadingMenu(!showHeadingMenu)}
            title="文本样式"
          >
            <Type size={16} />
            <ChevronDown size={14} />
          </button>

          {/* 标题下拉菜单 */}
          {showHeadingMenu && (
            <div className="toolbar-dropdown heading-menu">
              {headingOptions.map(option => (
                <button
                  key={option.level}
                  className={`dropdown-item h${option.level || 'p'}`}
                  onClick={() => {
                    option.action();
                    setShowHeadingMenu(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-divider" />

        {/* 格式化按钮 */}
        <div className="toolbar-group format-buttons">
          {formatButtons.map((btn, index) => (
            <button
              key={index}
              className={`toolbar-btn icon-btn ${btn.isActive ? 'active' : ''}`}
              onClick={btn.action}
              title={btn.title}
            >
              {btn.icon}
            </button>
          ))}
        </div>

        <div className="toolbar-divider" />

        {/* 列表按钮 */}
        <div className="toolbar-group format-buttons">
          {listButtons.map((btn, index) => (
            <button
              key={index}
              className={`toolbar-btn icon-btn ${btn.isActive ? 'active' : ''}`}
              onClick={btn.action}
              title={btn.title}
            >
              {btn.icon}
            </button>
          ))}
        </div>

        <div className="toolbar-divider" />

        {/* 复制按钮 */}
        <button
          className="toolbar-btn icon-btn"
          onClick={handleCopy}
          title="复制"
        >
          <Copy size={16} />
        </button>
      </div>

      {/* 加载提示 */}
      {isRewriting && (
        <div className="toolbar-loading">
          <div className="loading-spinner" />
          <span>AI 改写中...</span>
        </div>
      )}
    </div>
  );
}
