/**
 * Data Migration Component
 * 数据迁移组件 - 在应用启动时自动执行数据迁移
 */

import { useEffect, useState } from 'react'
import { needsMigration, migrateData } from '@/lib/db/migration'
import { toast } from 'sonner'

export function DataMigration({ children, language = 'zh', translate }) {
  const [migrationStatus, setMigrationStatus] = useState('checking') // checking | migrating | done | error
  const [migrationResult, setMigrationResult] = useState(null)

  useEffect(() => {
    const performMigration = async () => {
      try {
        // 检查是否需要迁移
        if (!needsMigration()) {
          console.log('[Migration] No migration needed')
          setMigrationStatus('done')
          return
        }

        console.log('[Migration] Starting migration...')
        setMigrationStatus('migrating')

        // 执行迁移
        const result = await migrateData()
        setMigrationResult(result)

        if (result.success) {
          console.log('[Migration] Migration completed successfully')
          setMigrationStatus('done')
          
          // 显示成功提示
          const message = language === 'zh' 
            ? `数据迁移完成！已迁移 ${result.migrated.models} 个模型，${result.migrated.conversations} 条对话记录。`
            : `Migration completed! Migrated ${result.migrated.models} models and ${result.migrated.conversations} conversations.`
          
          toast.success(message)
        } else {
          console.error('[Migration] Migration failed:', result.errors)
          setMigrationStatus('error')
          
          const message = translate?.('dataMigration.migrationFailed', 'Data migration failed. Please refresh the page and try again.')
          toast.error(message)
        }
      } catch (error) {
        console.error('[Migration] Migration error:', error)
        setMigrationStatus('error')
        
        const message = translate?.('dataMigration.migrationError', 'Data migration error. Please refresh the page and try again.')
        toast.error(message)
      }
    }

    performMigration()
  }, [language, translate])

  // 在迁移过程中显示加载状态
  if (migrationStatus === 'checking' || migrationStatus === 'migrating') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          {translate?.('dataMigration.migrating', 'Migrating data...')}
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // 迁移完成或出错，渲染子组件
  return children
}

