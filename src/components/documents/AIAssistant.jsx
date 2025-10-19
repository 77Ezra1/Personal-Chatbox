/**
 * AI助手组件 - 智能辅助文档编辑
 */

import { useState, useEffect } from 'react';
import './AIAssistant.css';

export function AIAssistant({ formData, onSuggestion, translate }) {
  const [urlMetadata, setUrlMetadata] = useState(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [suggestedCategory, setSuggestedCategory] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  // 从URL提取元数据
  const fetchUrlMetadata = async (url) => {
    if (!url || !url.startsWith('http')) return;

    setLoadingMetadata(true);
    try {
      // 直接从URL提取元数据，不进行网络请求
      // 避免 CORS 问题
      const metadata = {
        title: extractTitleFromUrl(url),
        description: `Document from ${new URL(url).hostname}`,
        icon: getIconForUrl(url),
      };

      // 模拟异步延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      setUrlMetadata(metadata);
    } catch (error) {
      console.error('Failed to extract URL metadata:', error);
      // 提供基础建议
      setUrlMetadata({
        title: '',
        description: '',
        icon: '📄',
      });
    } finally {
      setLoadingMetadata(false);
    }
  };

  // 从URL提取标题
  const extractTitleFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        return parts[parts.length - 1]
          .replace(/[-_]/g, ' ')
          .replace(/\.(html|htm|pdf|doc|docx)$/i, '')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      return urlObj.hostname.replace('www.', '');
    } catch {
      return '';
    }
  };

  // 根据URL获取建议图标
  const getIconForUrl = (url) => {
    const hostname = new URL(url).hostname.toLowerCase();
    const iconMap = {
      'github.com': '💻',
      'stackoverflow.com': '📚',
      'medium.com': '📝',
      'youtube.com': '🎥',
      'twitter.com': '🐦',
      'linkedin.com': '💼',
      'notion.so': '📔',
      'docs.google.com': '📄',
      'drive.google.com': '📁',
      'dropbox.com': '📦',
      'figma.com': '🎨',
      'trello.com': '📋',
    };

    for (const [domain, icon] of Object.entries(iconMap)) {
      if (hostname.includes(domain)) return icon;
    }
    return '📄';
  };

  // 生成智能标签建议
  const generateTagSuggestions = (url, title, description) => {
    const tags = new Set();

    // 基于URL的标签
    if (url) {
      const hostname = new URL(url).hostname.toLowerCase();
      if (hostname.includes('github')) tags.add('development');
      if (hostname.includes('docs')) tags.add('documentation');
      if (hostname.includes('api')) tags.add('api');
      if (hostname.includes('blog')) tags.add('article');
      if (hostname.includes('youtube') || hostname.includes('video')) tags.add('video');
      if (hostname.includes('learn') || hostname.includes('tutorial')) tags.add('tutorial');
    }

    // 基于标题和描述的关键词
    const text = `${title} ${description}`.toLowerCase();
    const keywords = {
      'react': 'react',
      'vue': 'vue',
      'angular': 'angular',
      'node': 'nodejs',
      'python': 'python',
      'java': 'java',
      'javascript': 'javascript',
      'typescript': 'typescript',
      'api': 'api',
      'database': 'database',
      'design': 'design',
      'ui': 'ui',
      'ux': 'ux',
      'css': 'css',
      'html': 'html',
      'tutorial': 'tutorial',
      'guide': 'guide',
      'documentation': 'docs',
      'reference': 'reference',
    };

    for (const [keyword, tag] of Object.entries(keywords)) {
      if (text.includes(keyword)) tags.add(tag);
    }

    return Array.from(tags).slice(0, 5);
  };

  // 生成分类建议
  const generateCategorySuggestion = (url, title, description) => {
    const text = `${url} ${title} ${description}`.toLowerCase();

    if (text.includes('github') || text.includes('code') || text.includes('repo')) {
      return { name: 'Development', icon: '💻' };
    }
    if (text.includes('doc') || text.includes('guide') || text.includes('manual')) {
      return { name: 'Documentation', icon: '📚' };
    }
    if (text.includes('design') || text.includes('figma') || text.includes('ui')) {
      return { name: 'Design', icon: '🎨' };
    }
    if (text.includes('article') || text.includes('blog') || text.includes('post')) {
      return { name: 'Article', icon: '📝' };
    }
    if (text.includes('video') || text.includes('youtube') || text.includes('tutorial')) {
      return { name: 'Learning', icon: '🎓' };
    }
    if (text.includes('api') || text.includes('reference')) {
      return { name: 'Reference', icon: '🔗' };
    }

    return null;
  };

  // 监听URL变化
  useEffect(() => {
    if (formData.url) {
      fetchUrlMetadata(formData.url);
    } else {
      setUrlMetadata(null);
    }
  }, [formData.url]);

  // 监听表单数据变化，生成建议
  useEffect(() => {
    const { url, title, description } = formData;

    if (url) {
      const tags = generateTagSuggestions(url, title, description);
      setSuggestedTags(tags);

      const category = generateCategorySuggestion(url, title, description);
      setSuggestedCategory(category);

      // 生成分析
      setAnalysis({
        hasTitle: !!title,
        hasDescription: !!description,
        urlValid: url.startsWith('http'),
        completeness: calculateCompleteness({ url, title, description }),
      });
    }
  }, [formData.url, formData.title, formData.description]);

  // 计算完整度
  const calculateCompleteness = ({ url, title, description }) => {
    let score = 0;
    if (url && url.startsWith('http')) score += 25;
    if (title && title.length > 3) score += 25;
    if (description && description.length > 10) score += 25;
    if (formData.category && formData.category !== 'uncategorized') score += 15;
    if (formData.tags && formData.tags.length > 0) score += 10;
    return Math.min(100, score);
  };

  // 应用建议
  const applySuggestion = (type, value) => {
    onSuggestion(type, value);
  };

  return (
    <div className="ai-assistant">
      <div className="ai-assistant-header">
        <div className="ai-assistant-icon">🤖</div>
        <h3>{translate('documents.aiAssistant') || 'AI Assistant'}</h3>
      </div>

      {/* URL元数据提取 */}
      {formData.url && (
        <div className="ai-section">
          <div className="ai-section-title">
            <span>🔍 {translate('documents.urlAnalysis') || 'URL Analysis'}</span>
          </div>

          {loadingMetadata ? (
            <div className="ai-loading">
              <div className="ai-spinner"></div>
              <span>Analyzing URL...</span>
            </div>
          ) : urlMetadata ? (
            <div className="ai-suggestions">
              {urlMetadata.title && !formData.title && (
                <div className="ai-suggestion-item">
                  <div className="ai-suggestion-label">Suggested Title:</div>
                  <div className="ai-suggestion-value">{urlMetadata.title}</div>
                  <button
                    className="ai-apply-btn"
                    onClick={() => applySuggestion('title', urlMetadata.title)}
                  >
                    Apply
                  </button>
                </div>
              )}

              {urlMetadata.description && !formData.description && (
                <div className="ai-suggestion-item">
                  <div className="ai-suggestion-label">Suggested Description:</div>
                  <div className="ai-suggestion-value">{urlMetadata.description}</div>
                  <button
                    className="ai-apply-btn"
                    onClick={() => applySuggestion('description', urlMetadata.description)}
                  >
                    Apply
                  </button>
                </div>
              )}

              {urlMetadata.icon && formData.icon === '📄' && (
                <div className="ai-suggestion-item">
                  <div className="ai-suggestion-label">Suggested Icon:</div>
                  <div className="ai-suggestion-value ai-icon-large">{urlMetadata.icon}</div>
                  <button
                    className="ai-apply-btn"
                    onClick={() => applySuggestion('icon', urlMetadata.icon)}
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* 智能标签建议 */}
      {suggestedTags.length > 0 && (
        <div className="ai-section">
          <div className="ai-section-title">
            <span>🏷️ {translate('documents.suggestedTags') || 'Suggested Tags'}</span>
          </div>
          <div className="ai-tag-suggestions">
            {suggestedTags.map((tag, index) => (
              <button
                key={index}
                className={`ai-tag-suggestion ${formData.tags?.includes(tag) ? 'ai-tag-applied' : ''}`}
                onClick={() => {
                  if (!formData.tags?.includes(tag)) {
                    applySuggestion('tags', [...(formData.tags || []), tag]);
                  }
                }}
                disabled={formData.tags?.includes(tag)}
              >
                {tag}
                {formData.tags?.includes(tag) ? ' ✓' : ' +'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 分类建议 */}
      {suggestedCategory && formData.category === 'uncategorized' && (
        <div className="ai-section">
          <div className="ai-section-title">
            <span>📁 {translate('documents.suggestedCategory') || 'Suggested Category'}</span>
          </div>
          <div className="ai-category-suggestion">
            <div className="ai-category-info">
              <span className="ai-category-icon">{suggestedCategory.icon}</span>
              <span className="ai-category-name">{suggestedCategory.name}</span>
            </div>
            <button
              className="ai-apply-btn"
              onClick={() => applySuggestion('category', suggestedCategory.name)}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* 完整度分析 */}
      {analysis && (
        <div className="ai-section">
          <div className="ai-section-title">
            <span>📊 {translate('documents.completeness') || 'Completeness'}</span>
          </div>
          <div className="ai-completeness">
            <div className="ai-progress-bar">
              <div
                className="ai-progress-fill"
                style={{ width: `${analysis.completeness}%` }}
              ></div>
            </div>
            <div className="ai-progress-label">{analysis.completeness}%</div>
          </div>
          <div className="ai-checklist">
            <div className={`ai-check-item ${analysis.urlValid ? 'ai-check-done' : ''}`}>
              {analysis.urlValid ? '✓' : '○'} Valid URL
            </div>
            <div className={`ai-check-item ${analysis.hasTitle ? 'ai-check-done' : ''}`}>
              {analysis.hasTitle ? '✓' : '○'} Title added
            </div>
            <div className={`ai-check-item ${analysis.hasDescription ? 'ai-check-done' : ''}`}>
              {analysis.hasDescription ? '✓' : '○'} Description added
            </div>
          </div>
        </div>
      )}

      {/* 提示 */}
      <div className="ai-tips">
        <div className="ai-tip-icon">💡</div>
        <div className="ai-tip-content">
          <strong>Tip:</strong> Enter a URL to get smart suggestions for title, tags, and category!
        </div>
      </div>
    </div>
  );
}
