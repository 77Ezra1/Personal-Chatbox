/**
 * 密码保险库 API 客户端
 */

const API_BASE = '/api/password-vault';

/**
 * 检查是否设置了主密码
 */
export async function checkMasterPassword() {
  const response = await fetch(`${API_BASE}/master-password/check`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to check master password');
  }

  return response.json();
}

/**
 * 设置主密码
 */
export async function setupMasterPassword(masterPassword) {
  const response = await fetch(`${API_BASE}/master-password/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ masterPassword })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to setup master password');
  }

  return response.json();
}

/**
 * 验证主密码
 */
export async function verifyMasterPassword(masterPassword) {
  const response = await fetch(`${API_BASE}/master-password/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ masterPassword })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to verify master password');
  }

  return response.json();
}

/**
 * 修改主密码
 */
export async function changeMasterPassword(oldPassword, newPassword) {
  const response = await fetch(`${API_BASE}/master-password/change`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ oldPassword, newPassword })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to change master password');
  }

  return response.json();
}

/**
 * 获取所有密码条目（不包含实际密码）
 */
export async function getEntries(params = {}) {
  const queryString = new URLSearchParams(
    Object.entries(params).filter(([_, v]) => v !== undefined)
  ).toString();

  const url = queryString ? `${API_BASE}/entries?${queryString}` : `${API_BASE}/entries`;

  const response = await fetch(url, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch entries');
  }

  return response.json();
}

/**
 * 获取并解密单个密码条目
 */
export async function decryptEntry(entryId, masterPassword) {
  const response = await fetch(`${API_BASE}/entries/${entryId}/decrypt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ masterPassword })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to decrypt entry');
  }

  return response.json();
}

/**
 * 创建新的密码条目
 */
export async function createEntry(entryData) {
  const response = await fetch(`${API_BASE}/entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(entryData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create entry');
  }

  return response.json();
}

/**
 * 更新密码条目
 */
export async function updateEntry(entryId, entryData) {
  const response = await fetch(`${API_BASE}/entries/${entryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(entryData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update entry');
  }

  return response.json();
}

/**
 * 删除密码条目
 */
export async function deleteEntry(entryId) {
  const response = await fetch(`${API_BASE}/entries/${entryId}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete entry');
  }

  return response.json();
}

/**
 * 切换收藏状态
 */
export async function toggleFavorite(entryId, favorite) {
  const response = await fetch(`${API_BASE}/entries/${entryId}/favorite`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ favorite })
  });

  if (!response.ok) {
    throw new Error('Failed to toggle favorite');
  }

  return response.json();
}

/**
 * 生成随机密码
 */
export async function generatePassword(length = 16, options = {}) {
  const response = await fetch(`${API_BASE}/generate-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ length, options })
  });

  if (!response.ok) {
    throw new Error('Failed to generate password');
  }

  return response.json();
}

/**
 * 检查密码强度
 */
export async function checkPasswordStrength(password) {
  const response = await fetch(`${API_BASE}/check-strength`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ password })
  });

  if (!response.ok) {
    throw new Error('Failed to check password strength');
  }

  return response.json();
}

/**
 * 获取统计信息
 */
export async function getStatistics() {
  const response = await fetch(`${API_BASE}/stats`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch statistics');
  }

  return response.json();
}

/**
 * 导出密码
 */
export async function exportPasswords(masterPassword) {
  const response = await fetch(`${API_BASE}/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ masterPassword })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to export passwords');
  }

  return response.json();
}

/**
 * 导入密码
 */
export async function importPasswords(encryptedData, salt, masterPassword) {
  const response = await fetch(`${API_BASE}/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ encryptedData, salt, masterPassword })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to import passwords');
  }

  return response.json();
}
