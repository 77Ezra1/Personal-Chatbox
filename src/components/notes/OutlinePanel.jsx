/**
 * 大纲面板
 * 自动提取笔记中的标题，生成可点击的大纲
 */

import { useEffect, useState, useMemo } from 'react';
import './OutlinePanel.css';

export function OutlinePanel({ editor, content }) {
  const [activeHeading, setActiveHeading] = useState(null);

  // 从 HTML 内容中提取标题
  const headings = useMemo(() => {
    if (!content) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

    return Array.from(headingElements).map((el, index) => ({
      id: `heading-${index}`,
      level: parseInt(el.tagName.substring(1)),
      text: el.textContent.trim() || '(空标题)',
      element: el
    }));
  }, [content]);

  // 点击大纲项，滚动到对应位置
  const handleHeadingClick = (heading) => {
    if (!editor) return;

    setActiveHeading(heading.id);

    // 使用 TipTap 的 focus 和 scrollIntoView
    // 这里我们通过查找文本内容来定位
    try {
      const { state } = editor;
      const { doc } = state;

      // 遍历文档查找对应的标题节点
      let targetPos = null;
      doc.descendants((node, pos) => {
        if (node.type.name.startsWith('heading') &&
            node.textContent.trim() === heading.text) {
          targetPos = pos;
          return false; // 停止遍历
        }
      });

      if (targetPos !== null) {
        // 将光标移动到该位置
        editor.commands.focus();
        editor.commands.setTextSelection(targetPos);

        // 滚动到视图中
        const domNode = editor.view.nodeDOM(targetPos);
        if (domNode && domNode.scrollIntoView) {
          domNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } catch (error) {
      console.error('Failed to scroll to heading:', error);
    }
  };

  // 如果没有标题，显示提示
  if (headings.length === 0) {
    return (
      <div className="outline-panel">
        <div className="outline-empty">
          <div className="empty-icon">📑</div>
          <div className="empty-text">暂无大纲</div>
          <div className="empty-hint">使用 # 创建标题来生成大纲</div>
        </div>
      </div>
    );
  }

  return (
    <div className="outline-panel">
      <div className="outline-header">
        <span className="outline-icon">📑</span>
        <span className="outline-title">大纲</span>
        <span className="outline-count">{headings.length}</span>
      </div>

      <div className="outline-list">
        {headings.map((heading) => (
          <div
            key={heading.id}
            className={`outline-item outline-level-${heading.level} ${
              activeHeading === heading.id ? 'active' : ''
            }`}
            onClick={() => handleHeadingClick(heading)}
            title={heading.text}
          >
            <span className="outline-bullet">•</span>
            <span className="outline-text">{heading.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
