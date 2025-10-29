#!/usr/bin/env node
/**
 * Quick streaming diagnostics script.
 *
 * Usage:
 *   CHAT_AUTH_TOKEN=<token> pnpm node scripts/test-streaming.mjs
 *
 * Optional env vars:
 *   CHAT_API_BASE   - API origin (default http://localhost:3001)
 *   CHAT_MODEL      - Target model id (default deepseek-chat)
 *   CHAT_MESSAGE    - Prompt to send (default "Say hello in streaming mode.")
 *
 * The script will print every SSE chunk, helping you confirm whether the
 * backend responds with streaming data and whether the stream terminates
 * correctly.
 */
import fetch from 'node-fetch';

const API_BASE = process.env.CHAT_API_BASE ?? 'http://localhost:3001';
const MODEL = process.env.CHAT_MODEL ?? 'deepseek-chat';
const PROMPT =
  process.env.CHAT_MESSAGE ?? 'Say hello in streaming mode.';
const AUTH_TOKEN = process.env.CHAT_AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error(
    '[stream-test] Missing CHAT_AUTH_TOKEN. Copy your bearer token (or session token) and set it before running.\n' +
      'Example:\n  CHAT_AUTH_TOKEN=xxxx pnpm node scripts/test-streaming.mjs'
  );
  process.exit(1);
}

const payload = {
  model: MODEL,
  stream: true,
  messages: [
    {
      role: 'user',
      content: PROMPT
    }
  ]
};

console.log('[stream-test] POST', `${API_BASE}/api/chat`);
console.log('[stream-test] Model:', MODEL);

const response = await fetch(`${API_BASE}/api/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AUTH_TOKEN}`
  },
  body: JSON.stringify(payload)
});

if (!response.ok) {
  const text = await response.text();
  console.error(
    '[stream-test] HTTP error',
    response.status,
    response.statusText,
    text
  );
  process.exit(1);
}

if (!response.body) {
  console.error('[stream-test] No response body; streaming unsupported?');
  process.exit(1);
}

console.log('[stream-test] Streaming response started...');

const reader = response.body.getReader();
const decoder = new TextDecoder('utf-8');
let buffer = '';
let chunkCount = 0;

const flushSSE = (data) => {
  const lines = data.split('\n');
  for (const line of lines) {
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') {
      console.log('[stream-test] Stream finished marker received');
      continue;
    }
    chunkCount += 1;
    try {
      const parsed = JSON.parse(payload);
      console.log(`[stream-test] Chunk #${chunkCount}:`, parsed);
    } catch (err) {
      console.warn('[stream-test] Failed to parse chunk:', payload);
    }
  }
};

while (true) {
  const { value, done } = await reader.read();
  if (done) {
    if (buffer.trim()) {
      flushSSE(buffer);
    }
    break;
  }
  buffer += decoder.decode(value, { stream: true });
  let sepIndex;
  while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
    const event = buffer.slice(0, sepIndex);
    buffer = buffer.slice(sepIndex + 2);
    flushSSE(event);
  }
}

console.log('[stream-test] Stream closed after', chunkCount, 'chunks.');
