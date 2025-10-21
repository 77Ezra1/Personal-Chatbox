import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook for managing workbooks (工作簿管理)
 */
export function useWorkbooks() {
  const [workbooks, setWorkbooks] = useState([]);
  const [currentWorkbook, setCurrentWorkbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all workbooks
  const loadWorkbooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/prompt-workbooks', {
        withCredentials: true
      });

      if (response.data.success) {
        const wbs = response.data.data || [];
        setWorkbooks(wbs);

        // Auto-select system workbook if no current selection
        if (!currentWorkbook && wbs.length > 0) {
          const systemWorkbook = wbs.find(wb => wb.is_system);
          setCurrentWorkbook(systemWorkbook || wbs[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load workbooks:', err);
      setError(err.message || 'Failed to load workbooks');
    } finally {
      setLoading(false);
    }
  }, [currentWorkbook]);

  // Create new workbook
  const createWorkbook = useCallback(async (data) => {
    try {
      const response = await axios.post('/api/prompt-workbooks', data, {
        withCredentials: true
      });

      if (response.data.success) {
        const newWorkbook = response.data.data;
        setWorkbooks(prev => [...prev, newWorkbook]);
        setCurrentWorkbook(newWorkbook);
        return newWorkbook;
      }
    } catch (err) {
      console.error('Failed to create workbook:', err);
      throw err;
    }
  }, []);

  // Update workbook
  const updateWorkbook = useCallback(async (id, data) => {
    try {
      const response = await axios.put(`/api/prompt-workbooks/${id}`, data, {
        withCredentials: true
      });

      if (response.data.success) {
        const updated = response.data.data;
        setWorkbooks(prev =>
          prev.map(wb => (wb.id === id ? updated : wb))
        );

        if (currentWorkbook?.id === id) {
          setCurrentWorkbook(updated);
        }

        return updated;
      }
    } catch (err) {
      console.error('Failed to update workbook:', err);
      throw err;
    }
  }, [currentWorkbook]);

  // Delete workbook
  const deleteWorkbook = useCallback(async (id) => {
    try {
      await axios.delete(`/api/prompt-workbooks/${id}`, {
        withCredentials: true
      });

      setWorkbooks(prev => prev.filter(wb => wb.id !== id));

      if (currentWorkbook?.id === id) {
        const remaining = workbooks.filter(wb => wb.id !== id);
        setCurrentWorkbook(remaining[0] || null);
      }
    } catch (err) {
      console.error('Failed to delete workbook:', err);
      throw err;
    }
  }, [currentWorkbook, workbooks]);

  // Duplicate workbook
  const duplicateWorkbook = useCallback(async (id) => {
    try {
      const response = await axios.post(`/api/prompt-workbooks/${id}/duplicate`, {}, {
        withCredentials: true
      });

      if (response.data.success) {
        const duplicated = response.data.data;
        setWorkbooks(prev => [...prev, duplicated]);
        setCurrentWorkbook(duplicated);
        return duplicated;
      }
    } catch (err) {
      console.error('Failed to duplicate workbook:', err);
      throw err;
    }
  }, []);

  // Switch workbook
  const switchWorkbook = useCallback((workbook) => {
    setCurrentWorkbook(workbook);
  }, []);

  // Load on mount
  useEffect(() => {
    loadWorkbooks();
  }, [loadWorkbooks]);

  return {
    workbooks,
    currentWorkbook,
    loading,
    error,
    loadWorkbooks,
    createWorkbook,
    updateWorkbook,
    deleteWorkbook,
    duplicateWorkbook,
    switchWorkbook
  };
}
