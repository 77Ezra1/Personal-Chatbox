/**
 * 富文本编辑工具栏
 * 选中文本时显示，提供格式化和 AI 改写功能
 */

import { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Copy,
  Sparkles,
  ChevronDown,
  Type
} from 'lucide-react';
import { toast } from 'sonner';
import './RichTextToolbar.css';

export function RichTextToolbar({
  selectedText,
  position,
  onFormat,
  onRewrite,
  onClose
}) {
  const [showRewriteMenu, setShowRewriteMenu] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const toolbarRef = useRef(null);

  // 改写风格
  const rewriteStyles = [
    { label: '专业化', value: 'professional', icon: '💼' },
    { label: '口语化', value: 'casual', icon: '💬' },
    { label: '简洁版', value: 'concise', icon: '✂️' },
    { label: '详细版', value: 'detailed', icon: '📝' }
  ];

  // 标题选项
  const headingOptions = [
    { label: '正文', value: 'paragraph', markdown: '' },
    { label: '标题 1', value: 'h1', markdown: '# ' },
    { label: '标题 2', value: 'h2', markdown: '## ' },
    { label: '标题 3', value: 'h3', markdown: '### ' },
    { label: '标题 4', value: 'h4', markdown: '#### ' }
  ];

  // 格式化按钮
  const formatButtons = [
    { icon: <Bold size={16} />, action: 'bold', title: '加粗', markdown: '**' },
    { icon: <Italic size={16} />, action: 'italic', title: '斜体', markdown: '*' },
    { icon: <Underline size={16} />, action: 'underline', title: '下划线', markdown: '<u>', endMark: '</u>' },
    { icon: <Strikethrough size={16} />, action: 'strikethrough', title: '删除线', markdown: '~~' }
  ];

  // 处理格式化
  const handleFormat = (action, markdown, endMark) => {
    const end = endMark || markdown;
    onFormat(action, markdown, end);
  };

  // 处理标题
  const handleHeading = (option) => {
    onFormat('heading', option.markdown, '');
    setShowHeadingMenu(false);
  };

  // 处理 AI 改写
  const handleRewrite = async (style) => {
    setIsRewriting(true);
    setShowRewriteMenu(false);

    try {
      await onRewrite(selectedText, style);
    } finally {
      setIsRewriting(false);
    }
  };

  // 复制文本
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      toast.success('已复制到剪贴板');
      onClose();
    } catch (error) {
      toast.error('复制失败');
    }
  };

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

  if (!position) return null;

  return (
    <div
      ref={toolbarRef}
      className="rich-text-toolbar"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div className="toolbar-content">
        {/* AI 改写按钮 */}
        <div className="toolbar-group">
          <button
            className={`toolbar-btn ai-btn ${isRewriting ? 'loading' : ''}`}
            onClick={() => setShowRewriteMenu(!showRewriteMenu)}
            disabled={isRewriting}
            title="AI 改写"
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
                  key={option.value}
                  className={`dropdown-item ${option.value}`}
                  onClick={() => handleHeading(option)}
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
          {formatButtons.map(btn => (
            <button
              key={btn.action}
              className="toolbar-btn icon-btn"
              onClick={() => handleFormat(btn.action, btn.markdown, btn.endMark)}
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
