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
  hasActiveFilters = false
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
        {/* 搜索输入框 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="搜索对话... (⌘K)"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => value && setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            className="pl-9 pr-9"
            disabled={isSearching}
          />
          {value && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 过滤器按钮 */}
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="icon"
          onClick={onFilterClick}
          className="shrink-0"
          title="高级过滤"
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </div>

      {/* 搜索历史下拉 */}
      {showHistory && searchHistory.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>搜索历史</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="h-6 text-xs"
            >
              清空
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {searchHistory.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer group"
                onClick={() => {
                  onChange(item);
                  handleSearch(item);
                }}
              >
                <span className="text-sm truncate flex-1">{item}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => removeHistoryItem(item, e)}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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

