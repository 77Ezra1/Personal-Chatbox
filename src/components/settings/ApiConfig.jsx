import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Settings, Key, TestTube } from 'lucide-react';

const ApiConfig = () => {
  const [config, setConfig] = useState({
    openai: { enabled: false, hasApiKey: false, model: 'gpt-3.5-turbo' },
    deepseek: { enabled: false, hasApiKey: false, model: 'deepseek-chat' },
    settings: { theme: 'light', language: 'zh', autoSave: true }
  });

  const [apiKeys, setApiKeys] = useState({
    openai: '',
    deepseek: ''
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState({ openai: false, deepseek: false });
  const [message, setMessage] = useState({ type: '', text: '' });

  // 加载当前配置
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config/current');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      setMessage({ type: 'error', text: '加载配置失败' });
    }
  };

  const handleApiKeyChange = (provider, value) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };

  const testApiKey = async (provider) => {
    const apiKey = apiKeys[provider];
    if (!apiKey) {
      setMessage({ type: 'error', text: '请输入 API 密钥' });
      return;
    }

    setTesting(prev => ({ ...prev, [provider]: true }));
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`/api/test-connection/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: `${result.message} (模型: ${result.model})`
        });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Test API error:', error);
      setMessage({ type: 'error', text: '测试失败，请检查网络连接' });
    } finally {
      setTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  const saveApiKey = async (provider) => {
    const apiKey = apiKeys[provider];
    if (!apiKey) {
      setMessage({ type: 'error', text: '请输入 API 密钥' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/config/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setApiKeys(prev => ({ ...prev, [provider]: '' }));
        loadConfig(); // 重新加载配置
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败，请检查网络连接' });
    } finally {
      setLoading(false);
    }
  };

  const resetConfig = async () => {
    if (!confirm('确定要重置所有配置吗？这将清除所有 API 密钥。')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/config/reset', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: '配置已重置' });
        setApiKeys({ openai: '', deepseek: '' });
        loadConfig();
      } else {
        setMessage({ type: 'error', text: '重置失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '重置失败，请检查网络连接' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">API 配置</h1>
      </div>

      {message.text && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="openai" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="openai" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>OpenAI</span>
            {config.openai.enabled && <Badge variant="success">已配置</Badge>}
          </TabsTrigger>
          <TabsTrigger value="deepseek" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>DeepSeek</span>
            {config.deepseek.enabled && <Badge variant="success">已配置</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="openai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>OpenAI API 配置</span>
                {config.openai.enabled ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-key">API 密钥</Label>
                <div className="flex space-x-2">
                  <Input
                    id="openai-key"
                    type="password"
                    placeholder="sk-..."
                    value={apiKeys.openai}
                    onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => testApiKey('openai')}
                    disabled={testing.openai || !apiKeys.openai}
                  >
                    {testing.openai ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                    测试
                  </Button>
                  <Button
                    onClick={() => saveApiKey('openai')}
                    disabled={loading || !apiKeys.openai}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '保存'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>当前状态</Label>
                <div className="flex items-center space-x-2">
                  <Badge variant={config.openai.enabled ? 'success' : 'secondary'}>
                    {config.openai.enabled ? '已配置' : '未配置'}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    模型: {config.openai.model}
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>• 获取 API 密钥: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Platform</a></p>
                <p>• 支持 GPT-3.5、GPT-4、GPT-4V 等模型</p>
                <p>• 用于聊天、图片分析、语音识别等功能</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deepseek">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>DeepSeek API 配置</span>
                {config.deepseek.enabled ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deepseek-key">API 密钥</Label>
                <div className="flex space-x-2">
                  <Input
                    id="deepseek-key"
                    type="password"
                    placeholder="sk-..."
                    value={apiKeys.deepseek}
                    onChange={(e) => handleApiKeyChange('deepseek', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => testApiKey('deepseek')}
                    disabled={testing.deepseek || !apiKeys.deepseek}
                  >
                    {testing.deepseek ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                    测试
                  </Button>
                  <Button
                    onClick={() => saveApiKey('deepseek')}
                    disabled={loading || !apiKeys.deepseek}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '保存'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>当前状态</Label>
                <div className="flex items-center space-x-2">
                  <Badge variant={config.deepseek.enabled ? 'success' : 'secondary'}>
                    {config.deepseek.enabled ? '已配置' : '未配置'}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    模型: {config.deepseek.model}
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>• 获取 API 密钥: <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">DeepSeek Platform</a></p>
                <p>• 支持 DeepSeek Chat 模型</p>
                <p>• 提供免费额度，适合测试使用</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>系统设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>自动保存</Label>
              <p className="text-sm text-gray-600">自动保存对话和设置</p>
            </div>
            <Switch checked={config.settings.autoSave} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>主题</Label>
              <p className="text-sm text-gray-600">界面主题设置</p>
            </div>
            <Badge variant="outline">{config.settings.theme === 'light' ? '浅色' : '深色'}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>语言</Label>
              <p className="text-sm text-gray-600">界面语言设置</p>
            </div>
            <Badge variant="outline">{config.settings.language === 'zh' ? '中文' : 'English'}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={resetConfig} disabled={loading}>
          重置配置
        </Button>
        <Button onClick={loadConfig} disabled={loading}>
          刷新状态
        </Button>
      </div>
    </div>
  );
};

export default ApiConfig;
