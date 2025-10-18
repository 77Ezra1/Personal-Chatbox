/**
 * AI 工具栏组件
 * 提供笔记相关的 AI 功能：摘要、大纲、改写、任务提取等
 */

import { useState } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import './AIToolbar.css';

export function AIToolbar({ noteContent, onInsert, onReplace, editor }) {
  const [loading, setLoading] = useState(false);
  const [showRewriteMenu, setShowRewriteMenu] = useState(false);
  const [activeFunction, setActiveFunction] = useState(null);

  /**
   * 生成摘要
   */
  const handleSummary = async () => {
    if (!noteContent || noteContent.trim().length < 50) {
      toast.error('笔记内容太短，无法生成摘要（至少50字符）');
      return;
    }

    setLoading(true);
    setActiveFunction('summary');
    try {
      const { data } = await apiClient.post('/ai/notes/summary', {
        content: noteContent,
      });

      if (data.success && data.summary) {
        onInsert(`\n\n## 📝 摘要\n\n${data.summary}\n\n`);
        toast.success('摘要生成成功');
      } else {
        throw new Error('生成失败');
      }
    } catch (error) {
      console.error('[AI] Summary error:', error);
      toast.error(error.response?.data?.error || '生成摘要失败');
    } finally {
      setLoading(false);
      setActiveFunction(null);
    }
  };

  /**
   * 生成大纲
   */
  const handleOutline = async () => {
    if (!noteContent || noteContent.trim().length < 100) {
      toast.error('笔记内容太短，无法生成大纲（至少100字符）');
      return;
    }

    setLoading(true);
    setActiveFunction('outline');
    try {
      const { data } = await apiClient.post('/ai/notes/outline', {
        content: noteContent,
      });

      if (data.success && data.outline) {
        onInsert(`\n\n## 📋 大纲\n\n${data.outline}\n\n`);
        toast.success('大纲生成成功');
      } else {
        throw new Error('生成失败');
      }
    } catch (error) {
      console.error('[AI] Outline error:', error);
      toast.error(error.response?.data?.error || '生成大纲失败');
    } finally {
      setLoading(false);
      setActiveFunction(null);
    }
  };

  /**
   * 改写文本
   */
  const handleRewrite = async (style) => {
    // 获取选中的文本
    const { from, to } = editor?.state.selection || {};
    const selectedText = editor?.state.doc.textBetween(from, to, ' ');

    if (!selectedText || selectedText.trim().length < 10) {
      toast.error('请先选择要改写的文本（至少10字符）');
      return;
    }

    setLoading(true);
    setActiveFunction(`rewrite-${style}`);
    setShowRewriteMenu(false);

    try {
      const { data } = await apiClient.post('/ai/notes/rewrite', {
        text: selectedText,
        style,
      });

      if (data.success && data.text) {
        // 替换选中的文本
        editor
          ?.chain()
          .focus()
          .deleteSelection()
          .insertContent(data.text)
          .run();

        toast.success(`文本改写成功（${style} 风格）`);
      } else {
        throw new Error('改写失败');
      }
    } catch (error) {
      console.error('[AI] Rewrite error:', error);
      toast.error(error.response?.data?.error || '文本改写失败');
    } finally {
      setLoading(false);
      setActiveFunction(null);
    }
  };

  /**
   * 提取任务
   */
  const handleExtractTasks = async () => {
    if (!noteContent || noteContent.trim().length < 20) {
      toast.error('笔记内容太短，无法提取任务');
      return;
    }

    setLoading(true);
    setActiveFunction('tasks');
    try {
      const { data } = await apiClient.post('/ai/notes/tasks', {
        content: noteContent,
      });

      if (data.success && data.tasks && data.tasks.length > 0) {
        const taskList = data.tasks
          .map((t) => {
            const priority = t.priority ? ` [${t.priority.toUpperCase()}]` : '';
            const deadline = t.deadline ? ` (${t.deadline})` : '';
            return `- [ ] ${t.task}${priority}${deadline}`;
          })
          .join('\n');

        onInsert(`\n\n## ✅ 待办任务\n\n${taskList}\n\n`);
        toast.success(`成功提取 ${data.tasks.length} 个任务`);
      } else {
        toast.info('未找到待办任务');
      }
    } catch (error) {
      console.error('[AI] Tasks error:', error);
      toast.error(error.response?.data?.error || '提取任务失败');
    } finally {
      setLoading(false);
      setActiveFunction(null);
    }
  };

  /**
   * 智能标签建议
   */
  const handleSuggestTags = async () => {
    if (!noteContent && !editor?.state.doc.textContent) {
      toast.error('笔记内容为空');
      return;
    }

    setLoading(true);
    setActiveFunction('tags');
    try {
      const title = editor?.state.doc.firstChild?.textContent || '';
      const content = noteContent || editor?.state.doc.textContent || '';

      const { data } = await apiClient.post('/ai/notes/suggest-tags', {
        title,
        content,
      });

      if (data.success && data.tags && data.tags.length > 0) {
        // 这里可以触发一个回调来更新标签
        const tagsText = data.tags.join(', ');
        toast.success(`建议标签: ${tagsText}`, { duration: 5000 });

        // 如果有回调函数，可以自动添加标签
        // onAddTags?.(data.tags);
      } else {
        toast.info('未能生成标签建议');
      }
    } catch (error) {
      console.error('[AI] Tags error:', error);
      toast.error(error.response?.data?.error || '生成标签失败');
    } finally {
      setLoading(false);
      setActiveFunction(null);
    }
  };

  /**
   * 扩展内容
   */
  const handleExpand = async () => {
    if (!noteContent || noteContent.trim().length < 20) {
      toast.error('笔记内容太短，无法扩展（至少20字符）');
      return;
    }

    setLoading(true);
    setActiveFunction('expand');
    try {
      const { data } = await apiClient.post('/ai/notes/expand', {
        content: noteContent,
      });

      if (data.success && data.expansion) {
        onInsert(`\n\n${data.expansion}\n\n`);
        toast.success('内容扩展成功');
      } else {
        throw new Error('扩展失败');
      }
    } catch (error) {
      console.error('[AI] Expand error:', error);
      toast.error(error.response?.data?.error || '内容扩展失败');
    } finally {
      setLoading(false);
      setActiveFunction(null);
    }
  };

  const rewriteStyles = [
    { key: 'professional', label: '专业', icon: '💼' },
    { key: 'casual', label: '随意', icon: '😊' },
    { key: 'concise', label: '简洁', icon: '✂️' },
    { key: 'detailed', label: '详细', icon: '📝' },
  ];

  return (
    <div className="ai-toolbar">
      <div className="ai-toolbar-label">
        <span className="ai-icon">🤖</span>
        <span className="ai-label">AI 助手</span>
      </div>

      <div className="ai-toolbar-buttons">
        <button
          className={`ai-btn ${activeFunction === 'summary' ? 'active' : ''}`}
          onClick={handleSummary}
          disabled={loading}
          title="生成笔记摘要"
        >
          📝 摘要
        </button>

        <button
          className={`ai-btn ${activeFunction === 'outline' ? 'active' : ''}`}
          onClick={handleOutline}
          disabled={loading}
          title="生成大纲"
        >
          📋 大纲
        </button>

        <div className="ai-btn-group">
          <button
            className={`ai-btn ${activeFunction?.startsWith('rewrite') ? 'active' : ''}`}
            onClick={() => setShowRewriteMenu(!showRewriteMenu)}
            disabled={loading}
            title="改写选中文本"
          >
            ✏️ 改写
          </button>

          {showRewriteMenu && (
            <div className="ai-dropdown-menu">
              {rewriteStyles.map((style) => (
                <button
                  key={style.key}
                  className="ai-dropdown-item"
                  onClick={() => handleRewrite(style.key)}
                  disabled={loading}
                >
                  <span className="style-icon">{style.icon}</span>
                  <span className="style-label">{style.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className={`ai-btn ${activeFunction === 'tasks' ? 'active' : ''}`}
          onClick={handleExtractTasks}
          disabled={loading}
          title="提取待办任务"
        >
          ✅ 任务
        </button>

        <button
          className={`ai-btn ${activeFunction === 'tags' ? 'active' : ''}`}
          onClick={handleSuggestTags}
          disabled={loading}
          title="智能标签建议"
        >
          🏷️ 标签
        </button>

        <button
          className={`ai-btn ${activeFunction === 'expand' ? 'active' : ''}`}
          onClick={handleExpand}
          disabled={loading}
          title="扩展内容"
        >
          ➕ 扩展
        </button>
      </div>

      {loading && (
        <div className="ai-loading-indicator">
          <div className="ai-spinner"></div>
          <span className="ai-loading-text">AI 处理中...</span>
        </div>
      )}
    </div>
  );
}
