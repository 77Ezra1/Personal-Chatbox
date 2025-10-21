import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Hook for managing template favorites
 * 模板收藏功能Hook
 */
export function useFavorites() {
  const [loading, setLoading] = useState(false);

  /**
   * Toggle favorite status
   * @param {number} templateId - Template ID
   * @param {number} workbookId - Workbook ID
   * @param {boolean} currentStatus - Current favorite status
   * @returns {Promise<boolean>} New favorite status
   */
  const toggleFavorite = async (templateId, workbookId, currentStatus) => {
    setLoading(true);
    try {
      const response = await fetch('/api/prompt-favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          template_id: templateId,
          workbook_id: workbookId
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to toggle favorite');
      }

      toast.success(data.is_favorite ? '已添加到收藏' : '已取消收藏');
      return data.is_favorite;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('收藏操作失败：' + error.message);
      return currentStatus; // Return original status on error
    } finally {
      setLoading(false);
    }
  };

  return {
    toggleFavorite,
    loading
  };
}
