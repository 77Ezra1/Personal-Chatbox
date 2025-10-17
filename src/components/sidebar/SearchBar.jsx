import { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

/**
 * 搜索栏组件
 * @param {Object} props
 * @param {string} props.value - 搜索值
 * @param {Function} props.onChange - 值变化回调
 * @param {Function} props.onSearch - 搜索回调
 * @param {boolean} props.isSearching - 是否正在搜索
 * @param {Function} props.onFilterClick - 点击过滤器按钮回调
 * @param {boolean} props.hasActiveFilters - 是否有激活的过滤器
 */
export function SearchBar({
  value,
  onChange,
  onSearch,
  isSearching = false,
  onFilterClick,
  hasActiveFilters = false,
  translate
}) {
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef(null);

  // 加载搜索历史
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history);
  }, []);

  // 保存搜索历史
  const saveToHistory = (query) => {
    if (!query.trim()) return;

    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const updated = [
      query,
      ...history.filter(q => q !== query)
    ].slice(0, 10); // 只保留最近10条

    localStorage.setItem('searchHistory', JSON.stringify(updated));
    setSearchHistory(updated);
  };

  // 处理搜索
  const handleSearch = (query) => {
    saveToHistory(query);
    onSearch(query);
    setShowHistory(false);
  };

  // 处理输入变化
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    // 如果输入了内容，显示历史
    if (newValue && !showHistory) {
      setShowHistory(true);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(value);
    } else if (e.key === 'Escape') {
      setShowHistory(false);
      inputRef.current?.blur();
    }
  };

  // 清空搜索
  const handleClear = () => {
    onChange('');
    onSearch('');
    inputRef.current?.focus();
  };

  // 清空搜索历史
  const clearHistory = () => {
    localStorage.removeItem('searchHistory');
    setSearchHistory([]);
  };

  // 删除单条历史记录
  const removeHistoryItem = (item, e) => {
    e.stopPropagation();
    const updated = searchHistory.filter(q => q !== item);
    localStorage.setItem('searchHistory', JSON.stringify(updated));
    setSearchHistory(updated);
  };

  // 快捷键：Cmd/Ctrl + K 聚焦搜索框
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        {/* 搜索输入框 - 优化为现代设计 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground
                           transition-colors duration-200" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={translate?.('sidebar.searchHistory', 'Search History...') + ' (⌘K)'}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => value && setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            className="pl-9 pr-9 h-10 rounded-lg border-border bg-card/50 backdrop-blur-sm
                     transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            disabled={isSearching}
          />
          {value && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md
                       hover:bg-accent hover:scale-105 transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 过滤器按钮 - 增强视觉效果 */}
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="icon"
          onClick={onFilterClick}
          className={`shrink-0 h-10 w-10 rounded-lg transition-all duration-200
                    ${hasActiveFilters ? 'shadow-md' : 'hover:bg-accent'}`}
          title={translate?.('advancedFilter.title', 'Advanced Filter')}
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary
                           ring-2 ring-background animate-pulse" />
          )}
        </Button>
      </div>

      {/* 搜索历史下拉 - 优化为现代卡片设计 */}
      {showHistory && searchHistory.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border
                      rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-sm
                      animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{translate?.('sidebar.searchHistory', 'Search History...')}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="h-7 text-xs hover:bg-destructive/10 hover:text-destructive
                       transition-all duration-200"
            >
              {translate?.('sidebar.clearHistory', 'Clear History')}
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {searchHistory.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/70
                         cursor-pointer group transition-all duration-200 mx-2 rounded-lg"
                onClick={() => {
                  onChange(item);
                  handleSearch(item);
                }}
              >
                <span className="text-sm truncate flex-1 font-medium">{item}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => removeHistoryItem(item, e)}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all duration-200
                           hover:bg-destructive/10 hover:text-destructive rounded-md"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

