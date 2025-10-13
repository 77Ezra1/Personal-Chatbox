/**
 * 同步DeepSeek配置到后端
 */

const API_BASE_URL = '';

/**
 * 同步DeepSeek配置到后端config.json
 * @param {string} apiKey - DeepSeek API Key
 * @param {string} model - 模型名称
 * @returns {Promise<boolean>} 是否成功
 */
export async function syncDeepSeekConfigToBackend(apiKey, model = 'deepseek-chat') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/config/service/deepseek`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enabled: true,
        apiKey: apiKey,
        model: model
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[syncDeepSeekConfig] Failed to sync:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('[syncDeepSeekConfig] Synced successfully:', data);
    return true;
  } catch (error) {
    console.error('[syncDeepSeekConfig] Error:', error);
    return false;
  }
}

