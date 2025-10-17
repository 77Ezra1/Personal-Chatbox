import { useState, useEffect } from 'react';
import { Save, X, Upload, Star, Users, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

/**
 * 角色编辑器组件
 * @param {Object} props
 * @param {Object} props.persona - 角色数据（编辑时传入）
 * @param {Function} props.onSave - 保存回调
 * @param {Function} props.onCancel - 取消回调
 */
export function PersonaEditor({
  persona = null,
  onSave,
  onCancel
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatarUrl: '',
    systemPrompt: '',
    personality: {
      tone: 'friendly',
      formality: 'professional',
      humor: 'moderate',
      empathy: 'high'
    },
    expertise: [],
    conversationStyle: {
      responseLength: 'medium',
      detailLevel: 'balanced',
      examples: true,
      questions: false
    },
    category: 'custom',
    tags: [],
    isPublic: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newTag, setNewTag] = useState('');

  // 初始化表单数据
  useEffect(() => {
    if (persona) {
      setFormData({
        name: persona.name || '',
        description: persona.description || '',
        avatarUrl: persona.avatarUrl || '',
        systemPrompt: persona.systemPrompt || '',
        personality: persona.personality || {
          tone: 'friendly',
          formality: 'professional',
          humor: 'moderate',
          empathy: 'high'
        },
        expertise: persona.expertise || [],
        conversationStyle: persona.conversationStyle || {
          responseLength: 'medium',
          detailLevel: 'balanced',
          examples: true,
          questions: false
        },
        category: persona.category || 'custom',
        tags: persona.tags || [],
        isPublic: persona.isPublic || false
      });
    }
  }, [persona]);

  // 处理表单字段更新
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理嵌套字段更新
  const handleNestedFieldChange = (parentField, childField, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };

  // 处理标签添加
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  // 处理标签删除
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // 处理专业领域添加
  const handleAddExpertise = (expertise) => {
    if (!formData.expertise.includes(expertise)) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, expertise]
      }));
    }
  };

  // 处理专业领域删除
  const handleRemoveExpertise = (expertiseToRemove) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter(expertise => expertise !== expertiseToRemove)
    }));
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.systemPrompt.trim()) {
      setError('角色名称和系统提示不能为空');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = persona ? `/api/personas/${persona.id}` : '/api/personas';
      const method = persona ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        onSave?.(data.persona || formData);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '保存失败');
      }
    } catch (error) {
      console.error('保存角色失败:', error);
      setError('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 专业领域选项
  const expertiseOptions = [
    'general', 'programming', 'writing', 'education', 'health', 'business',
    'science', 'art', 'music', 'sports', 'cooking', 'travel', 'psychology',
    'law', 'finance', 'technology', 'design', 'marketing', 'consulting'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 基本信息 */}
      <Card className="p-4">
        <h3 className="font-medium mb-4 flex items-center space-x-2">
          <Users className="w-4 h-4" />
          <span>基本信息</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">角色名称 *</label>
            <Input
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="输入角色名称"
              className="mt-1"
              maxLength={50}
            />
          </div>

          <div>
            <label className="text-sm font-medium">角色描述</label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="输入角色描述"
              className="mt-1"
              rows={2}
              maxLength={200}
            />
          </div>

          <div>
            <label className="text-sm font-medium">头像链接</label>
            <Input
              value={formData.avatarUrl}
              onChange={(e) => handleFieldChange('avatarUrl', e.target.value)}
              placeholder="输入头像图片链接"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">角色分类</label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleFieldChange('category', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assistant">🤖 助手</SelectItem>
                <SelectItem value="professional">👔 专业</SelectItem>
                <SelectItem value="creative">🎨 创意</SelectItem>
                <SelectItem value="entertainment">🎭 娱乐</SelectItem>
                <SelectItem value="custom">⚙️ 自定义</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* 系统提示 */}
      <Card className="p-4">
        <h3 className="font-medium mb-4 flex items-center space-x-2">
          <MessageSquare className="w-4 h-4" />
          <span>系统提示 *</span>
        </h3>

        <Textarea
          value={formData.systemPrompt}
          onChange={(e) => handleFieldChange('systemPrompt', e.target.value)}
          placeholder="输入角色的系统提示，描述角色的身份、性格和回答风格..."
          className="mt-1"
          rows={4}
          maxLength={2000}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.systemPrompt.length}/2000 字符
        </p>
      </Card>

      {/* 性格特征 */}
      <Card className="p-4">
        <h3 className="font-medium mb-4">性格特征</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">语调</label>
            <Select
              value={formData.personality.tone}
              onValueChange={(value) => handleNestedFieldChange('personality', 'tone', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friendly">友好</SelectItem>
                <SelectItem value="professional">专业</SelectItem>
                <SelectItem value="casual">随意</SelectItem>
                <SelectItem value="formal">正式</SelectItem>
                <SelectItem value="warm">温暖</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">正式程度</label>
            <Select
              value={formData.personality.formality}
              onValueChange={(value) => handleNestedFieldChange('personality', 'formality', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="very-formal">非常正式</SelectItem>
                <SelectItem value="professional">专业</SelectItem>
                <SelectItem value="balanced">平衡</SelectItem>
                <SelectItem value="casual">随意</SelectItem>
                <SelectItem value="very-casual">非常随意</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">幽默感</label>
            <Select
              value={formData.personality.humor}
              onValueChange={(value) => handleNestedFieldChange('personality', 'humor', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无</SelectItem>
                <SelectItem value="light">轻微</SelectItem>
                <SelectItem value="moderate">适中</SelectItem>
                <SelectItem value="high">丰富</SelectItem>
                <SelectItem value="very-high">非常丰富</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">同理心</label>
            <Select
              value={formData.personality.empathy}
              onValueChange={(value) => handleNestedFieldChange('personality', 'empathy', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">低</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="very-high">非常高</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* 专业领域 */}
      <Card className="p-4">
        <h3 className="font-medium mb-4">专业领域</h3>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {formData.expertise.map((expertise) => (
              <Badge key={expertise} variant="secondary" className="flex items-center space-x-1">
                <span>{expertise}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveExpertise(expertise)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          <Select onValueChange={handleAddExpertise}>
            <SelectTrigger>
              <SelectValue placeholder="添加专业领域" />
            </SelectTrigger>
            <SelectContent>
              {expertiseOptions.map((expertise) => (
                <SelectItem key={expertise} value={expertise}>
                  {expertise}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 对话风格 */}
      <Card className="p-4">
        <h3 className="font-medium mb-4">对话风格</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">回答长度</label>
              <Select
                value={formData.conversationStyle.responseLength}
                onValueChange={(value) => handleNestedFieldChange('conversationStyle', 'responseLength', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">简短</SelectItem>
                  <SelectItem value="medium">中等</SelectItem>
                  <SelectItem value="long">详细</SelectItem>
                  <SelectItem value="variable">可变</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">详细程度</label>
              <Select
                value={formData.conversationStyle.detailLevel}
                onValueChange={(value) => handleNestedFieldChange('conversationStyle', 'detailLevel', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">基础</SelectItem>
                  <SelectItem value="balanced">平衡</SelectItem>
                  <SelectItem value="detailed">详细</SelectItem>
                  <SelectItem value="comprehensive">全面</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">提供示例</label>
              <Switch
                checked={formData.conversationStyle.examples}
                onCheckedChange={(checked) => handleNestedFieldChange('conversationStyle', 'examples', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">主动提问</label>
              <Switch
                checked={formData.conversationStyle.questions}
                onCheckedChange={(checked) => handleNestedFieldChange('conversationStyle', 'questions', checked)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 标签 */}
      <Card className="p-4">
        <h3 className="font-medium mb-4">标签</h3>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="flex items-center space-x-1">
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex space-x-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="输入标签"
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type="button" onClick={handleAddTag} size="sm">
              添加
            </Button>
          </div>
        </div>
      </Card>

      {/* 公开设置 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">公开角色</label>
            <p className="text-xs text-gray-500">其他用户可以查看和使用此角色</p>
          </div>
          <Switch
            checked={formData.isPublic}
            onCheckedChange={(checked) => handleFieldChange('isPublic', checked)}
          />
        </div>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 mr-1" />
          取消
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.name.trim() || !formData.systemPrompt.trim()}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
          ) : (
            <Save className="w-4 h-4 mr-1" />
          )}
          {persona ? '更新' : '创建'}
        </Button>
      </div>
    </form>
  );
}
