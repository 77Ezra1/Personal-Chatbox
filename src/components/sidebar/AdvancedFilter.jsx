import { useState } from 'react';
import { Calendar, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 高级过滤器组件
 * @param {Object} props
 * @param {boolean} props.open - 是否打开
 * @param {Function} props.onOpenChange - 打开状态变化回调
 * @param {Object} props.filters - 当前过滤器值
 * @param {Function} props.onFiltersChange - 过滤器变化回调
 * @param {Function} props.onApply - 应用过滤器回调
 * @param {Function} props.onReset - 重置过滤器回调
 */
export function AdvancedFilter({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onApply,
  onReset,
  translate
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  // 更新本地过滤器
  const updateFilter = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 应用过滤器
  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
    onOpenChange(false);
  };

  // 重置过滤器
  const handleReset = () => {
    const resetFilters = {
      dateFrom: null,
      dateTo: null,
      sort: 'date',
      order: 'desc'
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onReset();
  };

  // 检查是否有活动的过滤器
  const hasActiveFilters = () => {
    return localFilters.dateFrom || localFilters.dateTo;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            {translate?.('advancedFilter.title', 'Advanced Filter')}
          </SheetTitle>
          <SheetDescription>
            {translate?.('advancedFilter.description', 'Use advanced filters to precisely search conversations')}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* 日期范围 */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">{translate?.('advancedFilter.dateRange', 'Date Range')}</Label>

            <div className="grid grid-cols-2 gap-4">
              {/* 开始日期 */}
              <div className="space-y-2">
                <Label htmlFor="date-from">{translate?.('advancedFilter.from', 'From')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date-from"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {localFilters.dateFrom ? (
                        format(new Date(localFilters.dateFrom), 'PPP', { locale: zhCN })
                      ) : (
                        <span>{translate?.('advancedFilter.selectDate', 'Select date')}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={localFilters.dateFrom ? new Date(localFilters.dateFrom) : undefined}
                      onSelect={(date) => updateFilter('dateFrom', date ? date.toISOString().split('T')[0] : null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* 结束日期 */}
              <div className="space-y-2">
                <Label htmlFor="date-to">{translate?.('advancedFilter.to', 'To')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date-to"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {localFilters.dateTo ? (
                        format(new Date(localFilters.dateTo), 'PPP', { locale: zhCN })
                      ) : (
                        <span>{translate?.('advancedFilter.selectDate', 'Select date')}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={localFilters.dateTo ? new Date(localFilters.dateTo) : undefined}
                      onSelect={(date) => updateFilter('dateTo', date ? date.toISOString().split('T')[0] : null)}
                      initialFocus
                      disabled={(date) => {
                        if (!localFilters.dateFrom) return false;
                        return date < new Date(localFilters.dateFrom);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 快捷日期选择 */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  updateFilter('dateFrom', today.toISOString().split('T')[0]);
                  updateFilter('dateTo', today.toISOString().split('T')[0]);
                }}
              >
                {translate?.('advancedFilter.today', 'Today')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today);
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  updateFilter('dateFrom', weekAgo.toISOString().split('T')[0]);
                  updateFilter('dateTo', today.toISOString().split('T')[0]);
                }}
              >
                {translate?.('advancedFilter.last7Days', 'Last 7 Days')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const monthAgo = new Date(today);
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  updateFilter('dateFrom', monthAgo.toISOString().split('T')[0]);
                  updateFilter('dateTo', today.toISOString().split('T')[0]);
                }}
              >
                {translate?.('advancedFilter.last30Days', 'Last 30 Days')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateFilter('dateFrom', null);
                  updateFilter('dateTo', null);
                }}
              >
                {translate?.('advancedFilter.clearDate', 'Clear Date')}
              </Button>
            </div>
          </div>

          {/* 排序选项 */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">{translate?.('advancedFilter.sortOptions', 'Sort Options')}</Label>

            <div className="grid grid-cols-2 gap-4">
              {/* 排序方式 */}
              <div className="space-y-2">
                <Label htmlFor="sort">{translate?.('advancedFilter.sortBy', 'Sort By')}</Label>
                <Select
                  value={localFilters.sort}
                  onValueChange={(value) => updateFilter('sort', value)}
                >
                  <SelectTrigger id="sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">{translate?.('advancedFilter.byDate', 'By Date')}</SelectItem>
                    <SelectItem value="relevance">{translate?.('advancedFilter.byRelevance', 'By Relevance')}</SelectItem>
                    <SelectItem value="messages">{translate?.('advancedFilter.byMessages', 'By Messages')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 排序方向 */}
              <div className="space-y-2">
                <Label htmlFor="order">{translate?.('advancedFilter.sortDirection', 'Sort Direction')}</Label>
                <Select
                  value={localFilters.order}
                  onValueChange={(value) => updateFilter('order', value)}
                >
                  <SelectTrigger id="order">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">{translate?.('advancedFilter.descending', 'Descending')}</SelectItem>
                    <SelectItem value="asc">{translate?.('advancedFilter.ascending', 'Ascending')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 活动过滤器提示 */}
          {hasActiveFilters() && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-primary">
                {localFilters.dateFrom && localFilters.dateTo && (
                  <>{translate?.('advancedFilter.dateRangeSet', 'Date range filter set')}</>
                )}
                {localFilters.dateFrom && !localFilters.dateTo && (
                  <>{translate?.('advancedFilter.startDateSet', 'Start date filter set')}</>
                )}
                {!localFilters.dateFrom && localFilters.dateTo && (
                  <>{translate?.('advancedFilter.endDateSet', 'End date filter set')}</>
                )}
              </p>
            </div>
          )}
        </div>

        <SheetFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {translate?.('advancedFilter.reset', 'Reset')}
          </Button>
          <Button onClick={handleApply}>
            {translate?.('advancedFilter.apply', 'Apply Filter')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

