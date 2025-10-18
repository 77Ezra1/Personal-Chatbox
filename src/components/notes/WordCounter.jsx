/**
 * Word Counter Component
 * Displays word count, character count, and estimated reading time
 */

import { useMemo } from 'react';
import './WordCounter.css';

export function WordCounter({ content }) {
  const stats = useMemo(() => {
    if (!content) {
      return {
        characters: 0,
        charactersNoSpaces: 0,
        words: 0,
        chineseChars: 0,
        readingTime: 0,
      };
    }

    // 移除 HTML 标签
    const text = content.replace(/<[^>]*>/g, '');

    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;

    // 英文单词计数
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;

    // 中文字符计数
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;

    // 阅读时间估算（中文 300字/分钟，英文 200词/分钟）
    const readingTime = Math.ceil(
      (chineseChars / 300) + ((words - chineseChars) / 200)
    );

    return {
      characters,
      charactersNoSpaces,
      words,
      chineseChars,
      readingTime: readingTime || 1, // 至少1分钟
    };
  }, [content]);

  return (
    <div className="word-counter">
      <span className="stat-item" title="Words">
        📝 {stats.words} {stats.words === 1 ? 'word' : 'words'}
      </span>
      <span className="separator">•</span>
      <span className="stat-item" title="Characters">
        🔤 {stats.characters} {stats.characters === 1 ? 'char' : 'chars'}
      </span>
      <span className="separator">•</span>
      <span className="stat-item" title="Estimated reading time">
        ⏱️ ~{stats.readingTime} min read
      </span>
    </div>
  );
}
