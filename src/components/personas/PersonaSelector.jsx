import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Star, Users, Clock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PersonaCard } from './PersonaCard';
import { PersonaEditor } from './PersonaEditor';

/**
 * 角色选择器组件
 * @param {Object} props
 * @param {Function} props.onPersonaSelect - 选择角色回调
 * @param {string} props.selectedPersonaId - 选中的角色ID
 * @param {boolean} props.showCreateButton - 是否显示创建按钮
 * @param {Function} props.translate - 翻译函数
 */
export function PersonaSelector({
  onPersonaSelect,
  selectedPersonaId,
  showCreateButton = true,
  translate
}) {
  const [personas, setPersonas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [error, setError] = useState(null);

  // 加载角色列表
  const loadPersonas = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        search: searchTerm
      });

      const response = await fetch(`/api/personas?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPersonas(data.personas || []);
        setCategories(data.categories || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || translate('personas.loadFailed'));
      }
    } catch (error) {
      console.error('加载角色失败:', error);
      setError(translate('personas.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 处理角色选择
  const handlePersonaSelect = (persona) => {
    onPersonaSelect?.(persona);
  };

  // 处理角色创建
  const handlePersonaCreate = (newPersona) => {
    setPersonas(prev => [newPersona, ...prev]);
    setIsCreateDialogOpen(false);
  };

  // 处理角色更新
  const handlePersonaUpdate = (updatedPersona) => {
    setPersonas(prev => prev.map(p =>
      p.id === updatedPersona.id ? updatedPersona : p
    ));
  };

  // 处理角色删除
  const handlePersonaDelete = (personaId) => {
    setPersonas(prev => prev.filter(p => p.id !== personaId));
    if (selectedPersonaId === personaId) {
      onPersonaSelect?.(null);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadPersonas();
  }, [selectedCategory, searchTerm]);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPersonas();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 过滤角色
  const filteredPersonas = personas.filter(persona => {
    const matchesSearch = !searchTerm ||
      persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || persona.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // 按使用频率排序
  const sortedPersonas = filteredPersonas.sort((a, b) => {
    if (a.usageCount !== b.usageCount) {
      return b.usageCount - a.usageCount;
    }
    if (a.rating !== b.rating) {
      return b.rating - a.rating;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="space-y-4">
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>{translate('personas.aiPersonas')}</span>
        </h2>

        {showCreateButton && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                {translate('personas.createPersona')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{translate('personas.createNewPersona')}</DialogTitle>
              </DialogHeader>
              <PersonaEditor
                onSave={handlePersonaCreate}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 搜索和过滤 */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={translate('personas.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 角色列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">{translate('personas.loading')}</p>
          </div>
        </div>
      ) : sortedPersonas.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">
              {searchTerm ? translate('personas.noMatchingPersonas') : translate('personas.noPersonasYet')}
            </p>
            {!searchTerm && showCreateButton && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                {translate('personas.createFirstPersona')}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPersonas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              isSelected={selectedPersonaId === persona.id}
              onSelect={() => handlePersonaSelect(persona)}
              onUpdate={handlePersonaUpdate}
              onDelete={handlePersonaDelete}
            />
          ))}
        </div>
      )}

      {/* 统计信息 */}
      {personas.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
          <span>{translate('personas.totalPersonas').replace('{count}', personas.length)}</span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Star className="w-4 h-4" />
              <span>{translate('personas.averageRating').replace('{rating}', (personas.reduce((sum, p) => sum + p.rating, 0) / personas.length || 0).toFixed(1))}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{translate('personas.totalUsage').replace('{count}', personas.reduce((sum, p) => sum + p.usageCount, 0))}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
