/**
 * 文档编辑器组件
 */

import { useState, useEffect } from 'react';
import { AIAssistant } from './AIAssistant';
import './DocumentEditor.css';

const ICON_OPTIONS = ['📄', '📝', '📋', '📌', '📎', '📁', '📂', '📚', '📖', '📕', '📗', '📘', '📙', '🔖', '🏷️', '💼', '🗂️', '📊', '📈', '📉', '🔗', '🌐', '💡', '⚡', '🎯', '🚀', '⭐', '💎'];

export function DocumentEditor({ document, categories, onSave, onCancel, translate }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    category: 'uncategorized',
    tags: [],
    icon: '📄',
    is_favorite: false,
    is_archived: false
  });

  const [tagInput, setTagInput] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title || '',
        description: document.description || '',
        url: document.url || '',
        category: document.category || 'uncategorized',
        tags: document.tags || [],
        icon: document.icon || '📄',
        is_favorite: document.is_favorite === 1,
        is_archived: document.is_archived === 1
      });
    }
  }, [document]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.url.trim()) {
      alert(translate('documents.fillRequired') || 'Please fill in all required fields');
      return;
    }

    onSave(formData);
  };

  // 处理AI建议
  const handleAISuggestion = (type, value) => {
    setFormData(prev => ({ ...prev, [type]: value }));
  };

  return (
    <div className="document-editor">
      <div className="document-editor-header">
        <h2>{document ? translate('documents.editDocument') || 'Edit Document' : translate('documents.newDocument') || 'New Document'}</h2>
      </div>

      <div className="document-editor-layout">
        <form onSubmit={handleSubmit} className="document-editor-form">
        {/* 图标选择 */}
        <div className="form-group">
          <label>{translate('documents.icon') || 'Icon'}</label>
          <div className="icon-picker-container">
            <button
              type="button"
              className="icon-picker-button"
              onClick={() => setShowIconPicker(!showIconPicker)}
            >
              {formData.icon}
            </button>
            {showIconPicker && (
              <div className="icon-picker-dropdown">
                {ICON_OPTIONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                    onClick={() => {
                      handleChange('icon', icon);
                      setShowIconPicker(false);
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 标题 */}
        <div className="form-group">
          <label htmlFor="title">{translate('documents.title') || 'Title'} *</label>
          <input
            id="title"
            type="text"
            className="form-input"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder={translate('documents.titlePlaceholder') || 'Enter document title'}
            required
          />
        </div>

        {/* URL */}
        <div className="form-group">
          <label htmlFor="url">{translate('documents.url') || 'URL'} *</label>
          <input
            id="url"
            type="url"
            className="form-input"
            value={formData.url}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://example.com/docs"
            required
          />
        </div>

        {/* 描述 */}
        <div className="form-group">
          <label htmlFor="description">{translate('documents.description') || 'Description'}</label>
          <textarea
            id="description"
            className="form-textarea"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder={translate('documents.descriptionPlaceholder') || 'Enter document description'}
            rows={4}
          />
        </div>

        {/* 分类 */}
        <div className="form-group">
          <label htmlFor="category">{translate('documents.category') || 'Category'}</label>
          <select
            id="category"
            className="form-select"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            <option value="uncategorized">{translate('documents.uncategorized') || 'Uncategorized'}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* 标签 */}
        <div className="form-group">
          <label htmlFor="tags">{translate('documents.tags') || 'Tags'}</label>
          <div className="tag-input-container">
            <input
              id="tags"
              type="text"
              className="form-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagInputKeyPress}
              placeholder={translate('documents.addTag') || 'Add tag and press Enter'}
            />
            <button type="button" className="btn-add-tag" onClick={handleAddTag}>
              +
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="tags-list">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag-item">
                  {tag}
                  <button
                    type="button"
                    className="tag-remove"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 选项 */}
        <div className="form-group form-group-checkboxes">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.is_favorite}
              onChange={(e) => handleChange('is_favorite', e.target.checked)}
            />
            ⭐ {translate('documents.markAsFavorite') || 'Mark as favorite'}
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.is_archived}
              onChange={(e) => handleChange('is_archived', e.target.checked)}
            />
            📦 {translate('documents.archive') || 'Archive'}
          </label>
        </div>

        {/* 按钮 */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {translate('common.cancel') || 'Cancel'}
          </button>
          <button type="submit" className="btn-primary">
            {translate('common.save') || 'Save'}
          </button>
        </div>
      </form>

      {/* AI助手侧边栏 */}
      <div className="document-editor-ai">
        <AIAssistant
          formData={formData}
          onSuggestion={handleAISuggestion}
          translate={translate}
        />
      </div>
      </div>
    </div>
  );
}
