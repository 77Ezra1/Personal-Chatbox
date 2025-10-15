/**
 * 简单审计日志：记录工具调用、参数与结果摘要
 */

const fs = require('fs');
const path = require('path');

const logsDir = path.join(process.cwd(), 'logs');
const auditFile = path.join(logsDir, 'audit.log');

function ensureLogsDir() {
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  } catch (err) {
    // 忽略日志目录创建失败，避免影响主流程
  }
}

function summarize(value, maxLen = 800) {
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    return text.length > maxLen ? text.slice(0, maxLen) + '...<truncated>' : text;
  } catch {
    return '[Unserializable]';
  }
}

function writeAudit(entry) {
  ensureLogsDir();
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    ...entry
  }) + '\n';
  try {
    fs.appendFileSync(auditFile, line);
  } catch {
    // 忽略写入失败
  }
}

function auditToolCall({ toolName, parameters, result, error }) {
  writeAudit({
    type: 'tool_call',
    toolName,
    parameters: summarize(parameters),
    result: error ? undefined : summarize(result),
    error: error ? summarize(error?.message || error) : undefined
  });
}

function auditFileChange({ path: filePath, action, bytes, diffPreview }) {
  writeAudit({
    type: 'file_change',
    path: filePath,
    action,
    bytes,
    diffPreview: summarize(diffPreview, 400)
  });
}

module.exports = {
  auditToolCall,
  auditFileChange
};


