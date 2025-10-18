/**
 * Slash Commands List Component
 * Displays a menu of available commands when user types "/"
 */

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import './CommandsList.css';

const COMMANDS = [
  {
    title: 'Heading 1',
    icon: 'H1',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
    keywords: ['h1', 'heading', 'title', '一级标题'],
  },
  {
    title: 'Heading 2',
    icon: 'H2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
    keywords: ['h2', 'heading', '二级标题'],
  },
  {
    title: 'Heading 3',
    icon: 'H3',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
    keywords: ['h3', 'heading', '三级标题'],
  },
  {
    title: 'Bullet List',
    icon: '•',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
    keywords: ['ul', 'list', 'bullet', '列表', '无序'],
  },
  {
    title: 'Numbered List',
    icon: '1.',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
    keywords: ['ol', 'list', 'number', '编号', '有序'],
  },
  {
    title: 'Quote',
    icon: '❝',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setBlockquote().run();
    },
    keywords: ['quote', 'blockquote', '引用'],
  },
  {
    title: 'Code Block',
    icon: '{ }',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCodeBlock().run();
    },
    keywords: ['code', 'codeblock', '代码'],
  },
  {
    title: 'Divider',
    icon: '—',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
    keywords: ['hr', 'divider', 'line', '分割线'],
  },
];

export const CommandsList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState(COMMANDS);

  useEffect(() => {
    const query = props.query?.toLowerCase() || '';
    const filtered = COMMANDS.filter(cmd =>
      cmd.title.toLowerCase().includes(query) ||
      cmd.keywords.some(k => k.includes(query))
    );
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [props.query]);

  const selectItem = (index) => {
    const command = filteredCommands[index];
    if (command) {
      command.command(props);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + filteredCommands.length - 1) % filteredCommands.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % filteredCommands.length);
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="slash-commands-menu">
      {filteredCommands.length > 0 ? (
        filteredCommands.map((cmd, index) => (
          <button
            key={cmd.title}
            className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => selectItem(index)}
          >
            <span className="command-icon">{cmd.icon}</span>
            <span className="command-title">{cmd.title}</span>
          </button>
        ))
      ) : (
        <div className="command-item disabled">No results</div>
      )}
    </div>
  );
});

CommandsList.displayName = 'CommandsList';
