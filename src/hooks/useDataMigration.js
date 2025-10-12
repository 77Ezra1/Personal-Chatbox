import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 数据迁移Hook
 * 负责将localStorage数据迁移到数据库
 */
export function useDataMigration() {
  const { user, token, isAuthenticated } = useAuth();
  const [migrationStatus, setMigrationStatus] = useState({
    isChecking: true,
    needsMigration: false,
    isFirstUser: false,
    isMigrating: false,
    error: null,
    completed: false
  });

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setMigrationStatus(prev => ({ ...prev, isChecking: false }));
      return;
    }

    checkMigrationStatus();
  }, [isAuthenticated, token]);

  const checkMigrationStatus = async () => {
    try {
      // 检查是否是第一个用户
      const response = await fetch('http://localhost:3001/api/user-data/is-first-user', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('检查用户状态失败');
      }

      const { isFirstUser } = await response.json();

      // 检查localStorage是否有数据
      const hasLocalData = localStorage.getItem('conversations') !== null;

      setMigrationStatus({
        isChecking: false,
        needsMigration: isFirstUser && hasLocalData,
        isFirstUser,
        isMigrating: false,
        error: null,
        completed: false
      });

      // 如果是第一个用户且有本地数据,自动迁移
      if (isFirstUser && hasLocalData) {
        await migrateData();
      }
    } catch (error) {
      console.error('[Data Migration] Error checking status:', error);
      setMigrationStatus({
        isChecking: false,
        needsMigration: false,
        isFirstUser: false,
        isMigrating: false,
        error: error.message,
        completed: false
      });
    }
  };

  const migrateData = async () => {
    setMigrationStatus(prev => ({ ...prev, isMigrating: true, error: null }));

    try {
      // 从localStorage读取数据
      const conversationsData = localStorage.getItem('conversations');
      const modelConfigData = localStorage.getItem('modelConfig');
      const systemPromptData = localStorage.getItem('systemPrompt');

      const conversations = conversationsData ? JSON.parse(conversationsData) : {};
      const modelConfig = modelConfigData ? JSON.parse(modelConfigData) : null;
      const systemPrompt = systemPromptData ? JSON.parse(systemPromptData) : null;

      // 迁移对话数据
      if (Object.keys(conversations).length > 0) {
        const convResponse = await fetch('http://localhost:3001/api/user-data/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({ conversations })
        });

        if (!convResponse.ok) {
          throw new Error('迁移对话数据失败');
        }
      }

      // 迁移配置数据
      if (modelConfig || systemPrompt) {
        const configResponse = await fetch('http://localhost:3001/api/user-data/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({
            modelConfig,
            systemPrompt
          })
        });

        if (!configResponse.ok) {
          throw new Error('迁移配置数据失败');
        }
      }

      // 迁移成功,清除localStorage
      localStorage.removeItem('conversations');
      localStorage.removeItem('modelConfig');
      localStorage.removeItem('systemPrompt');

      setMigrationStatus(prev => ({
        ...prev,
        isMigrating: false,
        completed: true,
        needsMigration: false
      }));

      console.log('[Data Migration] Migration completed successfully');
    } catch (error) {
      console.error('[Data Migration] Error migrating data:', error);
      setMigrationStatus(prev => ({
        ...prev,
        isMigrating: false,
        error: error.message
      }));
    }
  };

  return {
    migrationStatus,
    migrateData
  };
}

