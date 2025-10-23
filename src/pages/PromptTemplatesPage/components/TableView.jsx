import React, { useMemo, useCallback, useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.min.css';
import 'ag-grid-community/styles/ag-theme-alpine.min.css';
import { ArrowUpToLine, ArrowDownToLine, Pencil, Clipboard, Trash2, ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';
import AddFieldModal from './AddFieldModal';
import ColumnHeaderMenu from './ColumnHeaderMenu';

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

const t = {
  id: 'ID',
  name: '\u540D\u79F0',
  content: '\u5185\u5BB9',
  createdAt: '\u521B\u5EFA\u65F6\u95F4',
  updatedAt: '\u66F4\u65B0\u65F6\u95F4',
  insertColLeft: '\u5728\u5DE6\u4FA7\u63D2\u5165\u5217',
  insertColRight: '\u5728\u53F3\u4FA7\u63D2\u5165\u5217',
  renameCol: '\u91CD\u547D\u540D\u5217',
  deleteCol: '\u5220\u9664\u5217',
  insertRowAbove: '\u5728\u4E0A\u65B9\u63D2\u5165\u884C',
  insertRowBelow: '\u5728\u4E0B\u65B9\u63D2\u5165\u884C',
  edit: '\u7F16\u8F91',
  copy: '\u590D\u5236',
  deleteRow: '\u5220\u9664\u884C',
  newTemplate: '\u65B0\u6A21\u677F',
  confirmDelete: (name) => `\u786E\u5B9A\u8981\u5220\u9664\u6A21\u677F\"${name}\"\u5417\uFF1F`,
  none: '\u6682\u65E0\u6A21\u677F'
};

const TableView = forwardRef((props, ref) => {
  const {
    workbook,
    templates,
    loading,
    onUpdate,
    onDelete,
    onCreate,
    onSelectionChange,
    onInsertField,
    onRenameField,
    onDeleteField,
    onEditTemplate
  } = props;

  const [gridApi, setGridApi] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, items, type }
  const [showInsertFieldModal, setShowInsertFieldModal] = useState(false);
  const [insertFieldContext, setInsertFieldContext] = useState({ referenceField: null, position: 'right' });
  const menuRef = useRef(null);

  useImperativeHandle(ref, () => ({
    clearSelection: () => gridApi?.deselectAll()
  }), [gridApi]);

  // Build columns
  const columnDefs = useMemo(() => {
    const isSystem = !!workbook?.is_system;
    const customFields = workbook?.field_schema?.fields || [];

    const base = [
      { headerName: t.id, field: 'id', width: 70, maxWidth: 80, sortable: true, headerComponent: () => (
        <ColumnHeaderMenu fieldName='id' fieldType='number' workbook={workbook} onInsertLeft={(f)=>handleInsertLeft(f)} onInsertRight={(f)=>handleInsertRight(f)} onRename={onRenameField} onDelete={onDeleteField} onHide={() => {}} isBuiltIn={true} />
      ) },
      { headerName: t.name, field: 'name', flex: 2, minWidth: 150, editable: !isSystem, headerComponent: () => (
        <ColumnHeaderMenu fieldName='name' fieldType='text' workbook={workbook} onInsertLeft={(f)=>handleInsertLeft(f)} onInsertRight={(f)=>handleInsertRight(f)} onRename={onRenameField} onDelete={onDeleteField} onHide={() => {}} isBuiltIn={true} />
      ) },
      {
        headerName: t.content,
        field: 'content',
        flex: 4,
        minWidth: 200,
        headerComponent: () => (
          <ColumnHeaderMenu fieldName='content' fieldType='longtext' workbook={workbook} onInsertLeft={(f)=>handleInsertLeft(f)} onInsertRight={(f)=>handleInsertRight(f)} onRename={onRenameField} onDelete={onDeleteField} onHide={() => {}} isBuiltIn={true} />
        ),
        cellRenderer: (params) => {
          const text = params.value || "";
          const preview = text.length > 100 ? `${text.slice(0, 100)}...` : text;
          return <span className="text-muted-foreground">{preview}</span>;
        }
      }
    ];

    const dynamic = customFields.map((field) => ({
      headerName: field.name,
      field: `fields_data.${field.name}` ,
      flex: 1,
      minWidth: 150,
      editable: !!field.editable && !isSystem,
      cellClass: () => (selectedColumn === field.name ? 'ag-cell-selected-column' : ''),
      headerClass: () => (selectedColumn === field.name ? 'ag-header-selected-column' : ''),
      headerComponent: !isSystem ? () => (
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
        const value = params.data?.fields_data?.[field.name];
        switch (field.type) {
          case 'tags':
            return Array.isArray(value) ? value.join(', ') : '';
          case 'boolean':
            return value === true ? '\u662F' : value === false ? '\u5426' : '';
          case 'datetime':
            return value ? new Date(value).toLocaleString('zh-CN') : '';
          case 'number':
            return value === 0 || (typeof value === 'number' && !Number.isNaN(value)) ? String(value) : '';
          default:
            return value ?? "";
        }
      }
    }));
    const fixed = [
      { headerName: t.createdAt, field: 'created_at', width: 180, headerComponent: () => (<ColumnHeaderMenu fieldName='created_at' fieldType='datetime' workbook={workbook} onInsertLeft={(f)=>handleInsertLeft(f)} onInsertRight={(f)=>handleInsertRight(f)} onRename={onRenameField} onDelete={onDeleteField} onHide={() => {}} isBuiltIn={true} />), valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleString('zh-CN') : '') },
      { headerName: t.updatedAt, field: 'updated_at', width: 180, headerComponent: () => (<ColumnHeaderMenu fieldName='updated_at' fieldType='datetime' workbook={workbook} onInsertLeft={(f)=>handleInsertLeft(f)} onInsertRight={(f)=>handleInsertRight(f)} onRename={onRenameField} onDelete={onDeleteField} onHide={() => {}} isBuiltIn={true} />), valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleString('zh-CN') : '') }
    ];

    return [...base, ...dynamic, ...fixed];
  }, [workbook, selectedColumn]);

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true, filter: false, suppressMenu: true }), []);

  // grid events
  const onGridReady = useCallback((params) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  const onSelectionChanged = useCallback(() => {
    if (!gridApi) return;
    onSelectionChange(gridApi.getSelectedRows());
  }, [gridApi, onSelectionChange]);

  // 单元格点击不再选中整列（与 Excel 一致）
  const onCellClicked = () => {
    if (selectedColumn) {
      setSelectedColumn(null);
      gridApi?.refreshCells({ force: true });
    }
  };

  // 表头点击才选中整列
  const onHeaderCellClicked = (params) => {
    if (!params?.column) return;
    const fieldName = params.column.getColDef()?.headerName;
    const customFields = workbook?.field_schema?.fields || [];
    const isCustom = customFields.some((f) => f.name === fieldName);
    if (isCustom) {
      setSelectedColumn((prev) => (prev === fieldName ? null : fieldName));
      gridApi?.refreshCells({ force: true });
    }
  };

  // Header context menu: column ops only
  const onHeaderContextMenu = useCallback((params) => {
    if (params?.event) {
      params.event.preventDefault();
      params.event.stopPropagation();
    }
    if (workbook?.is_system || !params?.column) return;
    const colDef = params.column.getColDef();
    const fieldName = colDef?.headerName;
    const customFields = workbook?.field_schema?.fields || [];
    if (!customFields.some((f) => f.name === fieldName)) return;

    const items = [
      { label: t.insertColLeft, icon: <ArrowLeftToLine className="h-4 w-4" />, action: () => handleInsertLeft(fieldName) },
      { label: t.insertColRight, icon: <ArrowRightToLine className="h-4 w-4" />, action: () => handleInsertRight(fieldName) },
      { separator: true },
      { label: t.renameCol, icon: <Pencil className="h-4 w-4" />, action: () => onRenameField(fieldName) },
      { label: t.deleteCol, icon: <Trash2 className="h-4 w-4" />, action: () => onDeleteField(fieldName), danger: true }
    ];
    setContextMenu({ x: params.event.clientX, y: params.event.clientY, items, type: 'column' });
  }, [workbook, onRenameField, onDeleteField]);

  // Cell context menu: row ops only
  const onCellContextMenu = useCallback((params) => {
    if (params?.event) {
      params.event.preventDefault();
      params.event.stopPropagation();
    }
    if (workbook?.is_system) return;
    if (!(params?.node && params.node.data)) return;
    const row = params.node.data;
    if (row._isPlaceholder) return;

    const items = [
      { label: t.insertRowAbove, icon: <ArrowUpToLine className="h-4 w-4" />, action: () => handleInsertAbove(row, params.rowIndex) },
      { label: t.insertRowBelow, icon: <ArrowDownToLine className="h-4 w-4" />, action: () => handleInsertBelow(row, params.rowIndex) },
      { separator: true },
      { label: t.edit, icon: <Pencil className="h-4 w-4" />, action: () => handleEdit(row) },
      { label: t.copy, icon: <Clipboard className="h-4 w-4" />, action: () => handleDuplicate(row) },
      { separator: true },
      { label: t.deleteRow, icon: <Trash2 className="h-4 w-4" />, action: () => handleDelete(row), danger: true }
    ];
    setContextMenu({ x: params.event.clientX, y: params.event.clientY, items, type: 'row' });
  }, [workbook]);

  // window resize
  useEffect(() => {
    const onResize = () => gridApi?.sizeColumnsToFit();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [gridApi]);

  // Close context menu on outside click / scroll / right-click elsewhere / Escape
  useEffect(() => {
    if (!contextMenu) return;
    const closeIfOutside = (e) => {
      const el = menuRef.current;
      if (!el || !el.contains(e.target)) {
        setContextMenu(null);
      }
    };
    const onKeyDown = (e) => { if (e.key === 'Escape') setContextMenu(null); };
    const onScrollOrResize = () => setContextMenu(null);

    document.addEventListener('mousedown', closeIfOutside, true);
    document.addEventListener('contextmenu', closeIfOutside, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', closeIfOutside, true);
      document.removeEventListener('contextmenu', closeIfOutside, true);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [contextMenu]);

  // Column ops
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

  // Row ops
  const handleEdit = (row) => onEditTemplate?.(row);
  const handleDelete = (row) => { if (confirm(t.confirmDelete(row.name))) onDelete(row.id); };
  const handleDuplicate = async (row) => {
    await onCreate({ workbook_id: workbook.id, name: `${row.name} (\u526F\u672C)`, content: row.content, fields_data: row.fields_data || {} });
  };
  const handleInsertAbove = async (row, rowIndex) => { await onCreate({ workbook_id: workbook.id, name: t.newTemplate, content: ' ', fields_data: {} }, { insertAt: rowIndex }); };
  const handleInsertBelow = async (row, rowIndex) => { await onCreate({ workbook_id: workbook.id, name: t.newTemplate, content: ' ', fields_data: {} }, { insertAt: rowIndex + 1 }); };

  // Display data (placeholder if empty and not system)
  const displayData = (templates?.length === 0 && !workbook?.is_system)
    ? [{ id: null, name: '', content: '', fields_data: {}, _isPlaceholder: true }]
    : templates;

  return (
    <div className="table-view-container" onContextMenu={(e) => e.preventDefault()}>
      <div className="ag-theme-alpine" style={{ width: '100%', height: '100%' }}>
        <AgGridReact
          rowData={displayData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection={{ mode: 'multiRow', checkboxes: true, headerCheckbox: !workbook?.is_system, enableClickSelection: false }}
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
          onCellClicked={onCellClicked}
          onHeaderCellClicked={onHeaderCellClicked}
          onCellContextMenu={onCellContextMenu}
          onHeaderContextMenu={onHeaderContextMenu}
          animateRows={true}
          pagination={true}
          paginationPageSize={50}
          loading={loading}
          overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t.none}</span>`}
        />
      </div>

      <AddFieldModal open={showInsertFieldModal} onOpenChange={setShowInsertFieldModal} onConfirm={handleConfirmInsertField} workbook={workbook} />

      {contextMenu && (
        <div
          className="custom-context-menu" ref={menuRef}
          style={{ position: 'fixed', left: `${contextMenu.x}px`, top: `${contextMenu.y}px`, zIndex: 9999, minWidth: '180px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.items.map((item, idx) => item.separator ? (
            <div key={idx} style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
          ) : (
            <div
              key={idx}
              className={`context-menu-item${item.danger ? ' text-destructive' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); item.action(); setContextMenu(null); }}
            >
              <span className="mr-2" style={{ display: 'inline-flex' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

TableView.displayName = 'TableView';

export default TableView;















