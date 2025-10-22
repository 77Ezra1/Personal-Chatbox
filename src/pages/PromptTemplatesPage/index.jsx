import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useWorkbooks } from './hooks/useWorkbooks';
import { useTemplates } from './hooks/useTemplates';
import { useFavorites } from './hooks/useFavorites';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import WorkbookSwitcher from './components/WorkbookSwitcher';
import Toolbar from './components/Toolbar';
import TableView from './components/TableView';
import CardView from './components/CardView';
import ListView from './components/ListView';
import KanbanView from './components/KanbanView';
import AddFieldModal from './components/AddFieldModal';
import TemplateEditDialog from './components/TemplateEditDialog';
import ForkTemplatesDialog from './components/ForkTemplatesDialog';
import { Loader2 } from 'lucide-react';
import './PromptTemplatesPage.css';

/**
 * Prompt Templates Page - 多维表格式Prompt模板管理
 * 支持多工作簿、动态字段、4种视图
 */
export default function PromptTemplatesPage() {
  const {
    workbooks,
    currentWorkbook,
    loading: workbooksLoading,
    error: workbooksError,
    createWorkbook,
    updateWorkbook,
    deleteWorkbook,
    duplicateWorkbook,
    switchWorkbook
  } = useWorkbooks();

  const {
    templates,
    loading: templatesLoading,
    error: templatesError,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    batchDelete,
    forkTemplates,
    moveOrCopyTemplates
  } = useTemplates(currentWorkbook?.id);

  const { toggleFavorite } = useFavorites();

  const [viewType, setViewType] = useState('table'); // table | card | list | kanban
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    tags: [],
    favorite: false
  });
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateMode, setTemplateMode] = useState('create');
  const [showForkDialog, setShowForkDialog] = useState(false);

  // Search input ref for keyboard shortcuts
  const searchInputRef = useRef(null);

  // Table view ref for clearing selection
  const tableViewRef = useRef(null);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      handler: () => {
        // Focus search input
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
      description: '聚焦搜索框'
    },
    {
      key: 'n',
      ctrl: true,
      handler: () => {
        // Create new template (only if not in system workbook)
        if (currentWorkbook && !currentWorkbook.is_system) {
          handleOpenTemplateDialog();
        } else {
          toast.info('系统工作簿不支持创建模板');
        }
      },
      description: '新建模板'
    },
    {
      key: 'f',
      ctrl: true,
      handler: () => {
        // Toggle favorite filter
        handleFilterChange({ ...filters, favorite: !filters.favorite });
        toast.info(filters.favorite ? '显示所有模板' : '仅显示收藏');
      },
      description: '切换收藏筛选'
    },
    {
      key: 'escape',
      handler: () => {
        // Close dialogs
        if (showTemplateDialog) setShowTemplateDialog(false);
        if (showAddFieldModal) setShowAddFieldModal(false);
        if (showForkDialog) setShowForkDialog(false);
      },
      allowInInput: true,
      description: '关闭弹窗'
    }
  ]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadTemplates(newFilters);
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (templateId, workbookId, currentStatus) => {
    const newStatus = await toggleFavorite(templateId, workbookId, currentStatus);
    // Reload templates to update is_favorite status
    loadTemplates(filters);
    return newStatus;
  };

  // Handle add field
  const handleAddField = async (newField) => {
    try {
      const currentSchema = currentWorkbook.field_schema?.fields || [];

      const updatedSchema = [...currentSchema, newField];

      await updateWorkbook(currentWorkbook.id, {
        field_schema: JSON.stringify({ fields: updatedSchema })
      });

      setShowAddFieldModal(false);
      toast.success('字段添加成功');
    } catch (error) {
      console.error('Failed to add field:', error);
      toast.error('添加字段失败：' + error.message);
    }
  };

  // Handle insert field (at specific position)
  const handleInsertField = async (referenceField, position, newField) => {
    try {
      const currentSchema = currentWorkbook.field_schema?.fields || [];

      const index = currentSchema.findIndex(f => f.name === referenceField);
      const insertIndex = position === 'left' ? index : index + 1;

      const updatedSchema = [...currentSchema];
      updatedSchema.splice(insertIndex, 0, newField);

      await updateWorkbook(currentWorkbook.id, {
        field_schema: JSON.stringify({ fields: updatedSchema })
      });
      toast.success('字段插入成功');
    } catch (error) {
      console.error('Failed to insert field:', error);
      toast.error('插入字段失败：' + error.message);
    }
  };

  // Handle rename field
  const handleRenameField = async (oldName, newName) => {
    try {
      const currentSchema = currentWorkbook.field_schema?.fields || [];

      // Check if new name already exists
      if (currentSchema.some(f => f.name === newName && f.name !== oldName)) {
        toast.error('字段名称已存在');
        return;
      }

      const updatedSchema = currentSchema.map(f =>
        f.name === oldName ? { ...f, name: newName } : f
      );

      await updateWorkbook(currentWorkbook.id, {
        field_schema: JSON.stringify({ fields: updatedSchema })
      });

      // Reload templates to reflect the change
      loadTemplates();
      toast.success('字段重命名成功');
    } catch (error) {
      console.error('Failed to rename field:', error);
      toast.error('重命名字段失败：' + error.message);
    }
  };

  // Handle delete field
  const handleDeleteField = async (fieldName) => {
    try {
      const currentSchema = currentWorkbook.field_schema?.fields || [];

      const updatedSchema = currentSchema.filter(f => f.name !== fieldName);

      await updateWorkbook(currentWorkbook.id, {
        field_schema: JSON.stringify({ fields: updatedSchema })
      });

      // Reload templates
      loadTemplates();
      toast.success('字段删除成功');
    } catch (error) {
      console.error('Failed to delete field:', error);
      toast.error('删除字段失败：' + error.message);
    }
  };

  // Handle create/edit template
  const handleOpenTemplateDialog = (template = null) => {
    setEditingTemplate(template);
    setTemplateMode(template ? 'edit' : 'create');
    setShowTemplateDialog(true);
  };

  const handleConfirmTemplate = async (formData) => {
    try {
      if (templateMode === 'create') {
        await createTemplate({
          ...formData,
          workbook_id: currentWorkbook.id
        });
        toast.success('模板创建成功');
      } else {
        await updateTemplate(editingTemplate.id, formData);
        toast.success('模板更新成功');
      }
      setShowTemplateDialog(false);
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('保存模板失败：' + error.message);
    }
  };

  // Handle fork templates
  const handleOpenForkDialog = () => {
    if (selectedTemplates.length === 0) {
      toast.error('请先选择要复制的模板（1-3个）');
      return;
    }
    if (selectedTemplates.length > 3) {
      toast.error('最多只能同时复制 3 个模板');
      return;
    }
    if (!currentWorkbook?.is_system) {
      toast.error('只能从系统工作簿复制模板');
      return;
    }
    setShowForkDialog(true);
  };

  const handleConfirmFork = async (forkData) => {
    try {
      const { targetWorkbookId, templateIds, fieldMapping, newFieldsToAdd } = forkData;

      // 如果需要添加新字段，先更新目标工作簿的 field_schema
      if (newFieldsToAdd.length > 0) {
        const targetWorkbook = workbooks.find(wb => wb.id === targetWorkbookId);
        const currentSchema = targetWorkbook.field_schema?.fields || [];

        const updatedSchema = [...currentSchema, ...newFieldsToAdd];

        await updateWorkbook(targetWorkbookId, {
          field_schema: JSON.stringify({ fields: updatedSchema })
        });
      }

      // 调用 fork API
      await forkTemplates(templateIds, targetWorkbookId, fieldMapping);

      setShowForkDialog(false);
      setSelectedTemplates([]);

      toast.success(`成功复制 ${templateIds.length} 个模板！`);
    } catch (error) {
      console.error('Failed to fork templates:', error);
      toast.error('复制模板失败：' + error.message);
    }
  };

  // Loading state
  if (workbooksLoading) {
    return (
      <div className="prompt-templates-page loading">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-2">Loading workbooks...</p>
      </div>
    );
  }

  // Error state
  if (workbooksError) {
    return (
      <div className="prompt-templates-page error">
        <div className="error-message">
          <p className="text-destructive font-medium">Failed to load workbooks</p>
          <p className="text-sm text-muted-foreground">{workbooksError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prompt-templates-page">
      {/* Header with workbook switcher */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Prompt 模板库</h1>
          <p className="page-subtitle">管理和组织您的 Prompt 模板</p>
        </div>

        <WorkbookSwitcher
          workbooks={workbooks}
          currentWorkbook={currentWorkbook}
          onSwitch={switchWorkbook}
          onCreate={createWorkbook}
          onUpdate={updateWorkbook}
          onDelete={deleteWorkbook}
          onDuplicate={duplicateWorkbook}
        />
      </div>

      {/* Toolbar */}
      {currentWorkbook && (
        <Toolbar
          workbook={currentWorkbook}
          viewType={viewType}
          onViewTypeChange={setViewType}
          filters={filters}
          onFilterChange={handleFilterChange}
          selectedCount={selectedTemplates.length}
          onBatchDelete={() => batchDelete(selectedTemplates.map(t => t.id))}
          onCreate={() => handleOpenTemplateDialog()}
          onAddField={() => setShowAddFieldModal(true)}
          onForkTemplates={handleOpenForkDialog}
          onClearSelection={() => {
            // Clear selection in table view
            if (tableViewRef.current?.clearSelection) {
              tableViewRef.current.clearSelection();
            }
            // Also clear the state
            setSelectedTemplates([]);
          }}
        />
      )}

      {/* Main content area */}
      <div className="content-area">
        {!currentWorkbook ? (
          <div className="empty-state">
            <p className="text-muted-foreground">请选择或创建一个工作簿</p>
          </div>
        ) : (
          <>
            {viewType === 'table' && (
              <TableView
                ref={tableViewRef}
                workbook={currentWorkbook}
                templates={templates}
                loading={templatesLoading}
                onUpdate={updateTemplate}
                onDelete={deleteTemplate}
                onCreate={createTemplate}
                onSelectionChange={setSelectedTemplates}
                onFork={forkTemplates}
                onMove={moveOrCopyTemplates}
                onAddField={handleAddField}
                onInsertField={handleInsertField}
                onRenameField={handleRenameField}
                onDeleteField={handleDeleteField}
                onEditTemplate={handleOpenTemplateDialog}
              />
            )}

            {viewType === 'card' && (
              <CardView
                workbook={currentWorkbook}
                templates={templates}
                loading={templatesLoading}
                onUpdate={updateTemplate}
                onDelete={deleteTemplate}
                onSelectionChange={setSelectedTemplates}
                onEditTemplate={handleOpenTemplateDialog}
                onToggleFavorite={handleToggleFavorite}
                selectedTemplates={selectedTemplates}
              />
            )}

            {viewType === 'list' && (
              <ListView
                workbook={currentWorkbook}
                templates={templates}
                loading={templatesLoading}
                onUpdate={updateTemplate}
                onDelete={deleteTemplate}
                onSelectionChange={setSelectedTemplates}
                onEditTemplate={handleOpenTemplateDialog}
                onToggleFavorite={handleToggleFavorite}
                selectedTemplates={selectedTemplates}
              />
            )}

            {viewType === 'kanban' && (
              <KanbanView
                workbook={currentWorkbook}
                templates={templates}
                loading={templatesLoading}
                onUpdate={updateTemplate}
                onDelete={deleteTemplate}
                onEditTemplate={handleOpenTemplateDialog}
                onToggleFavorite={handleToggleFavorite}
                selectedTemplates={selectedTemplates}
              />
            )}
          </>
        )}
      </div>

      {/* Add Field Modal */}
      {currentWorkbook && (
        <AddFieldModal
          open={showAddFieldModal}
          onOpenChange={setShowAddFieldModal}
          onConfirm={handleAddField}
          workbook={currentWorkbook}
        />
      )}

      {/* Template Edit Dialog */}
      {currentWorkbook && (
        <TemplateEditDialog
          open={showTemplateDialog}
          onOpenChange={setShowTemplateDialog}
          onConfirm={handleConfirmTemplate}
          template={editingTemplate}
          workbook={currentWorkbook}
          mode={templateMode}
        />
      )}

      {/* Fork Templates Dialog */}
      {currentWorkbook && (
        <ForkTemplatesDialog
          open={showForkDialog}
          onOpenChange={setShowForkDialog}
          onConfirm={handleConfirmFork}
          selectedTemplates={selectedTemplates}
          sourceWorkbook={currentWorkbook}
          targetWorkbooks={workbooks}
        />
      )}
    </div>
  );
}
