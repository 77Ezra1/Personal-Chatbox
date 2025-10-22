import { useMemo, useCallback, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.min.css';
import 'ag-grid-community/styles/ag-theme-alpine.min.css';
import { Copy, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ColumnHeaderMenu from './ColumnHeaderMenu';
import AddFieldModal from './AddFieldModal';
import RowContextMenu from './RowContextMenu';

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * Table View Component with AG Grid
 * 简化版 - MVP功能，后续扩展动态字段
 */
const TableView = forwardRef((props, ref) => {
  const {
    workbook,
    templates,
    loading,
    onUpdate,
    onDelete,
    onCreate,
    onSelectionChange,
    onAddField,
    onInsertField,
    onRenameField,
    onDeleteField,
    onEditTemplate,
    onClearSelection
  } = props;
  const [gridApi, setGridApi] = useState(null);
  const [showInsertFieldModal, setShowInsertFieldModal] = useState(false);
  const [insertFieldContext, setInsertFieldContext] = useState({ referenceField: null, position: 'right' });
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, items, type: 'row'|'column' }

  // Expose clearSelection method to parent via ref
  useImperativeHandle(ref, () => ({
    clearSelection: () => {
      if (gridApi) {
        gridApi.deselectAll();
      }
    }
  }), [gridApi]);

  // Column definitions with dynamic fields from field_schema
  const columnDefs = useMemo(() => {
    const isSystem = workbook.is_system;
    const customFields = workbook?.field_schema?.fields || [];

    // Base columns (always present)
    const baseColumns = [
      {
        headerName: 'ID',
        field: 'id',
        width: 60,
        maxWidth: 80,
        sortable: true,
        sort: 'asc'
      },
      {
        headerName: '名称',
        field: 'name',
        flex: 2,
        minWidth: 150,
        editable: !isSystem
      },
      {
        headerName: '内容',
        field: 'content',
        flex: 4,
        minWidth: 200,
        cellRenderer: (params) => {
          const preview = params.value?.substring(0, 100) + (params.value?.length > 100 ? '...' : '');
          return <span className="text-muted-foreground">{preview}</span>;
        }
      }
    ];

    // Dynamic custom field columns
    const customColumns = customFields.map((field) => {
      const columnDef = {
        headerName: field.name,
        field: `fields_data.${field.name}`,
        flex: 1,
        minWidth: 150,
        editable: field.editable && !isSystem,
        // 添加列选中样式
        cellClass: (params) => {
          return selectedColumn === field.name ? 'ag-cell-selected-column' : '';
        },
        headerClass: (params) => {
          return selectedColumn === field.name ? 'ag-header-selected-column' : '';
        },
        // Custom header component with menu
        headerComponent: !isSystem ? (props) => (
          <ColumnHeaderMenu
            fieldName={field.name}
            fieldType={field.type}
            workbook={workbook}
            onInsertLeft={(fname) => handleInsertLeft(fname)}
            onInsertRight={(fname) => handleInsertRight(fname)}
            onRename={onRenameField}
            onDelete={onDeleteField}
            onHide={() => {}}
          />
        ) : undefined,
        valueGetter: (params) => {
          const value = params.data.fields_data?.[field.name];

          // Format based on field type
          switch (field.type) {
            case 'tags':
              return Array.isArray(value) ? value.join(', ') : '';
            case 'boolean':
              return value === true ? '是' : value === false ? '否' : '';
            case 'datetime':
              return value ? new Date(value).toLocaleString('zh-CN') : '';
            case 'number':
              return value !== undefined && value !== null ? String(value) : '';
            default:
              return value || '';
          }
        }
      };

      return columnDef;
    });

    // Fixed columns at the end
    const fixedColumns = [
      {
        headerName: '创建时间',
        field: 'created_at',
        width: 180,
        minWidth: 160,
        valueFormatter: (params) => {
          if (!params.value) return '';
          return new Date(params.value).toLocaleString('zh-CN');
        }
      },
      {
        headerName: '更新时间',
        field: 'updated_at',
        width: 180,
        minWidth: 160,
        valueFormatter: (params) => {
          if (!params.value) return '';
          return new Date(params.value).toLocaleString('zh-CN');
        }
      },
      {
        headerName: '操作',
        width: 120,
        minWidth: 100,
        pinned: 'right',
        cellRenderer: (params) => (
          <div className="flex gap-1 h-full items-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCopy(params.data)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            {!isSystem && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(params.data)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(params.data)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )
      }
    ];

    return [...baseColumns, ...customColumns, ...fixedColumns];
  }, [workbook]);

  // Grid options
  const defaultColDef = useMemo(() => ({
    sortable: false,
    resizable: true,
    filter: false
  }), []);

  // Handle grid ready
  const onGridReady = useCallback((params) => {
    setGridApi(params.api);
    // Auto-size all columns to fit the grid width
    params.api.sizeColumnsToFit();
  }, []);

  // Handle selection change
  const onSelectionChanged = useCallback(() => {
    if (!gridApi) return;
    const selectedRows = gridApi.getSelectedRows();
    onSelectionChange(selectedRows);
  }, [gridApi, onSelectionChange]);

  // Handle column click to select column
  const onCellClicked = useCallback((params) => {
    // 点击单元格时选中整列
    if (params.column) {
      const colDef = params.column.getColDef();
      const fieldName = colDef.headerName;

      // 检查是否是自定义字段列
      const customFields = workbook?.field_schema?.fields || [];
      const isCustomField = customFields.some(f => f.name === fieldName);

      if (isCustomField) {
        setSelectedColumn(selectedColumn === fieldName ? null : fieldName);
        // 强制刷新列样式
        if (gridApi) {
          gridApi.refreshCells({ force: true });
        }
      }
    }
  }, [workbook, selectedColumn, gridApi]);

  // Handle cell right click - 自定义右键菜单
  const onCellContextMenu = useCallback((params) => {
    console.log('Cell context menu params:', params);

    // 阻止浏览器默认右键菜单
    if (params.event) {
      params.event.preventDefault();
      params.event.stopPropagation();
    }

    const isSystem = workbook.is_system;

    // 获取列信息
    const colDef = params.column?.getColDef();
    const fieldName = colDef?.headerName;

    // 检查是否是自定义字段列
    const customFields = workbook?.field_schema?.fields || [];
    const isCustomField = customFields.some(f => f.name === fieldName);

    // 如果右键点击的是自定义字段列，显示列菜单
    if (isCustomField && !isSystem) {
      console.log('Showing custom column context menu for:', fieldName);

      const menuItems = [
        {
          label: '在左侧插入列',
          icon: '←',
          action: () => handleInsertLeft(fieldName)
        },
        {
          label: '在右侧插入列',
          icon: '→',
          action: () => handleInsertRight(fieldName)
        },
        { separator: true },
        {
          label: '重命名列',
          icon: '✏️',
          action: () => onRenameField(fieldName)
        },
        {
          label: '删除列',
          icon: '🗑️',
          action: () => onDeleteField(fieldName),
          danger: true
        }
      ];

      setContextMenu({
        x: params.event.clientX,
        y: params.event.clientY,
        items: menuItems,
        type: 'column'
      });
      return;
    }

    // 检查是否有行数据（行右键菜单）
    if (params.node && params.node.data) {
      const rowData = params.node.data;

      // 跳过占位符行和系统工作簿
      if (rowData._isPlaceholder || isSystem) {
        return;
      }

      console.log('Showing custom row context menu for:', rowData);

      // 显示行右键菜单
      const menuItems = [
        {
          label: '在上方插入行',
          icon: '↑',
          action: () => handleInsertAbove(rowData)
        },
        {
          label: '在下方插入行',
          icon: '↓',
          action: () => handleInsertBelow(rowData)
        },
        { separator: true },
        {
          label: '编辑',
          icon: '✏️',
          action: () => handleEdit(rowData)
        },
        {
          label: '复制',
          icon: '📋',
          action: () => handleDuplicate(rowData)
        },
        { separator: true },
        {
          label: '删除行',
          icon: '🗑️',
          action: () => handleDelete(rowData),
          danger: true
        }
      ];

      setContextMenu({
        x: params.event.clientX,
        y: params.event.clientY,
        items: menuItems,
        type: 'row'
      });
    }
  }, [workbook, onRenameField, onDeleteField]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gridApi) {
        gridApi.sizeColumnsToFit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gridApi]);

  // Column action handlers
  const handleInsertLeft = (referenceField) => {
    setInsertFieldContext({ referenceField, position: 'left' });
    setShowInsertFieldModal(true);
  };

  const handleInsertRight = (referenceField) => {
    setInsertFieldContext({ referenceField, position: 'right' });
    setShowInsertFieldModal(true);
  };

  const handleConfirmInsertField = (newField) => {
    onInsertField(insertFieldContext.referenceField, insertFieldContext.position, newField);
    setShowInsertFieldModal(false);
  };

  // Action handlers
  const handleCopy = (template) => {
    navigator.clipboard.writeText(template.content);
    // TODO: Show toast notification
  };

  const handleEdit = (template) => {
    if (onEditTemplate) {
      onEditTemplate(template);
    } else {
      // Fallback to old prompt method
      const newName = prompt('编辑名称：', template.name);
      if (newName && newName !== template.name) {
        onUpdate(template.id, { name: newName });
      }
    }
  };


  const handleDelete = (template) => {
    if (confirm(`确定要删除模板"${template.name}"吗？`)) {
      onDelete(template.id);
    }
  };

  // Row action handlers
  const handleInsertAbove = async (rowData) => {
    if (!rowData || rowData._isPlaceholder) return;

    // Create a new template above the current row
    const newTemplate = {
      workbook_id: workbook.id,
      name: '新模板',
      content: '',
      fields_data: {}
    };

    await onCreate(newTemplate);
  };

  const handleInsertBelow = async (rowData) => {
    if (!rowData || rowData._isPlaceholder) return;

    // Create a new template below the current row
    const newTemplate = {
      workbook_id: workbook.id,
      name: '新模板',
      content: '',
      fields_data: {}
    };

    await onCreate(newTemplate);
  };

  const handleDuplicate = async (rowData) => {
    if (!rowData || rowData._isPlaceholder) return;

    // Duplicate the current row
    const duplicateTemplate = {
      workbook_id: workbook.id,
      name: `${rowData.name} (副本)`,
      content: rowData.content,
      fields_data: rowData.fields_data || {}
    };

    await onCreate(duplicateTemplate);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // 如果没有数据且不是系统工作簿，显示一个空行提示
  const displayData = templates.length === 0 && !workbook.is_system
    ? [{
        id: null,
        name: '',
        content: '',
        fields_data: {},
        _isPlaceholder: true
      }]
    : templates;

  return (
    <div
      className="table-view-container"
      onContextMenu={(e) => {
        // 阻止表格区域的默认右键菜单
        e.preventDefault();
      }}
    >
      <div className="ag-theme-alpine" style={{ width: '100%', height: '100%' }}>
        <AgGridReact
          rowData={displayData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection={{
            mode: 'multiRow',
            checkboxes: true,
            headerCheckbox: !workbook.is_system,
            enableClickSelection: false
          }}
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
          onCellClicked={onCellClicked}
          onCellContextMenu={onCellContextMenu}
          animateRows={true}
          pagination={true}
          paginationPageSize={50}
          loading={loading}
          overlayNoRowsTemplate={
            workbook.is_system
              ? '<span class="ag-overlay-no-rows-center">暂无模板</span>'
              : '<span class="ag-overlay-no-rows-center">点击"新建模板"或直接在表格中输入数据</span>'
          }
        />
      </div>

      {/* Insert Field Modal */}
      <AddFieldModal
        open={showInsertFieldModal}
        onOpenChange={setShowInsertFieldModal}
        onConfirm={handleConfirmInsertField}
        workbook={workbook}
      />

      {/* Custom Context Menu */}
      {contextMenu && (
        <div
          className="custom-context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 9999,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            padding: '4px',
            minWidth: '180px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.items.map((item, index) => {
            if (item.separator) {
              return (
                <div
                  key={index}
                  style={{
                    height: '1px',
                    background: 'var(--border)',
                    margin: '4px 0'
                  }}
                />
              );
            }

            return (
              <div
                key={index}
                className="context-menu-item"
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: item.danger ? 'var(--destructive)' : 'var(--foreground)',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                onClick={() => {
                  item.action();
                  setContextMenu(null);
                }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

TableView.displayName = 'TableView';

export default TableView;
