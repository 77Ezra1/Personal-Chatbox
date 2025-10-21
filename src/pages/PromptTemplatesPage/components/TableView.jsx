import { useMemo, useCallback, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Copy, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ColumnHeaderMenu from './ColumnHeaderMenu';
import AddFieldModal from './AddFieldModal';

/**
 * Table View Component with AG Grid
 * 简化版 - MVP功能，后续扩展动态字段
 */
export default function TableView({
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
  onEditTemplate
}) {
  const [gridApi, setGridApi] = useState(null);
  const [showInsertFieldModal, setShowInsertFieldModal] = useState(false);
  const [insertFieldContext, setInsertFieldContext] = useState({ referenceField: null, position: 'right' });

  // Column definitions with dynamic fields from field_schema
  const columnDefs = useMemo(() => {
    const isSystem = workbook.is_system;
    const customFields = workbook?.field_schema?.fields || [];

    // Base columns (always present)
    const baseColumns = [
      {
        headerName: '',
        checkboxSelection: true,
        headerCheckboxSelection: !isSystem,
        width: 50,
        pinned: 'left'
      },
      {
        headerName: 'ID',
        field: 'id',
        width: 80,
        filter: 'agNumberColumnFilter'
      },
      {
        headerName: '名称',
        field: 'name',
        flex: 1,
        minWidth: 200,
        editable: !isSystem,
        filter: 'agTextColumnFilter'
      },
      {
        headerName: '内容',
        field: 'content',
        flex: 2,
        minWidth: 300,
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
        width: 180,
        editable: field.editable && !isSystem,
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

      // Add filter based on type
      switch (field.type) {
        case 'number':
          columnDef.filter = 'agNumberColumnFilter';
          break;
        case 'datetime':
          columnDef.filter = 'agDateColumnFilter';
          break;
        case 'boolean':
          columnDef.filter = 'agSetColumnFilter';
          break;
        default:
          columnDef.filter = 'agTextColumnFilter';
      }

      return columnDef;
    });

    // Fixed columns at the end
    const fixedColumns = [
      {
        headerName: '创建时间',
        field: 'created_at',
        width: 180,
        valueFormatter: (params) => {
          if (!params.value) return '';
          return new Date(params.value).toLocaleString('zh-CN');
        }
      },
      {
        headerName: '操作',
        width: 150,
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
    sortable: true,
    resizable: true,
    filter: true
  }), []);

  // Handle grid ready
  const onGridReady = useCallback((params) => {
    setGridApi(params.api);
  }, []);

  // Handle selection change
  const onSelectionChanged = useCallback(() => {
    if (!gridApi) return;
    const selectedRows = gridApi.getSelectedRows();
    onSelectionChange(selectedRows);
  }, [gridApi, onSelectionChange]);

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

  return (
    <>
      <div className="ag-theme-alpine" style={{ width: '100%', height: '100%' }}>
        <AgGridReact
          rowData={templates}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
          animateRows={true}
          pagination={true}
          paginationPageSize={50}
          loading={loading}
        />
      </div>

      {/* Insert Field Modal */}
      <AddFieldModal
        open={showInsertFieldModal}
        onOpenChange={setShowInsertFieldModal}
        onConfirm={handleConfirmInsertField}
        workbook={workbook}
      />
    </>
  );
}
