import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook for managing templates (模板管理)
 */
export function useTemplates(workbookId) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load templates for current workbook
  const loadTemplates = useCallback(async (filters = {}) => {
    if (!workbookId) {
      setTemplates([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = {
        workbook_id: workbookId,
        ...filters
      };

      const response = await axios.get('/api/prompt-templates', {
        params,
        withCredentials: true
      });

      if (response.data.success) {
        setTemplates(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [workbookId]);

  // Create template
  const createTemplate = useCallback(async (data, options = {}) => {
    try {
      const response = await axios.post('/api/prompt-templates', {
        workbook_id: workbookId,
        ...data
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        const newTemplate = response.data.data;
        setTemplates(prev => [...prev, newTemplate]);
        return newTemplate;
      }
    } catch (err) {
      console.error('Failed to create template:', err);
      throw err;
    }
  }, [workbookId]);

  // Update template
  const updateTemplate = useCallback(async (id, data) => {
    try {
      const response = await axios.put(`/api/prompt-templates/${id}`, data, {
        withCredentials: true
      });

      if (response.data.success) {
        const updated = response.data.data;
        setTemplates(prev =>
          prev.map(t => (t.id === id ? updated : t))
        );
        return updated;
      }
    } catch (err) {
      console.error('Failed to update template:', err);
      throw err;
    }
  }, []);

  // Delete template
  const deleteTemplate = useCallback(async (id) => {
    try {
      await axios.delete(`/api/prompt-templates/${id}`, {
        withCredentials: true
      });

      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete template:', err);
      throw err;
    }
  }, []);

  // Batch delete
  const batchDelete = useCallback(async (ids) => {
    try {
      await axios.post('/api/prompt-templates/batch-delete', { ids }, {
        withCredentials: true
      });

      setTemplates(prev => prev.filter(t => !ids.includes(t.id)));
    } catch (err) {
      console.error('Failed to batch delete:', err);
      throw err;
    }
  }, []);

  // Fork templates from system workbook
  const forkTemplates = useCallback(async (templateIds, targetWorkbookId) => {
    try {
      const response = await axios.post('/api/prompt-templates/fork', {
        template_ids: templateIds,
        target_workbook_id: targetWorkbookId
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        return response.data.data;
      }
    } catch (err) {
      console.error('Failed to fork templates:', err);
      throw err;
    }
  }, []);

  // Move/Copy templates
  const moveOrCopyTemplates = useCallback(async (templateIds, targetWorkbookId, operation = 'move') => {
    try {
      const response = await axios.post('/api/prompt-templates/move', {
        template_ids: templateIds,
        target_workbook_id: targetWorkbookId,
        operation
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        if (operation === 'move') {
          // Remove moved templates from current list
          setTemplates(prev => prev.filter(t => !templateIds.includes(t.id)));
        }
        return response.data.data;
      }
    } catch (err) {
      console.error(`Failed to ${operation} templates:`, err);
      throw err;
    }
  }, []);

  // Load templates when workbook changes
  useEffect(() => {
    if (workbookId) {
      loadTemplates();
    }
  }, [workbookId, loadTemplates]);

  return {
    templates,
    loading,
    error,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    batchDelete,
    forkTemplates,
    moveOrCopyTemplates
  };
}

