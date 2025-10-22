import { useMemo } from 'react';
import { debounce } from 'lodash';
import { Search, Table, Grid3X3, List, Kanban, Plus, Columns, Copy, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';

/**
 * Toolbar Component (工具栏)
 * 简化版 - MVP功能
 */
export default function Toolbar({
  workbook,
  viewType,
  onViewTypeChange,
  filters,
  onFilterChange,
  selectedCount,
  onBatchDelete,
  onCreate,
  onAddField,
  onForkTemplates,
  onClearSelection
}) {
  // Debounced search handler (300ms delay)
  const debouncedFilterChange = useMemo(
    () => debounce((searchValue, currentFilters) => {
      onFilterChange({ ...currentFilters, search: searchValue });
    }, 300),
    [onFilterChange]
  );

  const handleSearchChange = (e) => {
    debouncedFilterChange(e.target.value, filters);
  };

  const handleCreate = () => {
    const name = prompt('请输入模板名称：');
    if (!name || !name.trim()) return;

    const content = prompt('请输入Prompt内容：');
    if (!content || !content.trim()) return;

    onCreate({
      name: name.trim(),
      content: content.trim(),
      fields_data: {
        tags: [],
        description: ''
      }
    });
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        {/* Search */}
        <div className="search-box">
          <Search className="search-icon h-4 w-4" />
          <Input
            type="text"
            placeholder="搜索模板..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>

        {/* Favorite filter */}
        <Button
          variant={filters.favorite ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange({ ...filters, favorite: !filters.favorite })}
          title={filters.favorite ? '显示全部' : '仅显示收藏'}
        >
          <Star className={`h-4 w-4 mr-2 ${filters.favorite ? 'fill-current' : ''}`} />
          {filters.favorite ? '收藏' : '收藏'}
        </Button>

        {/* Selected count and actions */}
        {selectedCount > 0 && (
          <div className="selected-info">
            <span className="text-sm text-muted-foreground">
              已选中 {selectedCount} 项
            </span>

            {/* Fork button - only for system workbook */}
            {workbook.is_system && onForkTemplates && (
              <Button
                variant="outline"
                size="sm"
                onClick={onForkTemplates}
              >
                <Copy className="h-4 w-4 mr-2" />
                复制到我的工作簿
              </Button>
            )}

            {/* Clear selection button */}
            {onClearSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                title="取消选择"
              >
                <X className="h-4 w-4 mr-2" />
                取消选择
              </Button>
            )}

            {/* Batch delete - not for system workbook */}
            {!workbook.is_system && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onBatchDelete}
              >
                批量删除
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="toolbar-right">
        {/* Keyboard shortcuts help */}
        <KeyboardShortcutsHelp />

        {/* View switcher */}
        <div className="view-switcher">
          <Button
            variant={viewType === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewTypeChange('table')}
          >
            <Table className="h-4 w-4" />
          </Button>
          <Button
            variant={viewType === 'card' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewTypeChange('card')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewType === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewTypeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewType === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewTypeChange('kanban')}
          >
            <Kanban className="h-4 w-4" />
          </Button>
        </div>

        {/* Add Field button - only for non-system workbooks */}
        {!workbook.is_system && onAddField && (
          <Button variant="outline" onClick={onAddField}>
            <Columns className="h-4 w-4 mr-2" />
            添加字段
          </Button>
        )}

        {/* Create button */}
        {!workbook.is_system && (
          <Button variant="outline" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            新建模板
          </Button>
        )}
      </div>
    </div>
  );
}
