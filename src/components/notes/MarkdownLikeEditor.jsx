/**
 * Markdown-like Editor using TipTap
 * Provides seamless Markdown shortcuts with instant formatting (Typora/Feishu style)
 * - # Heading 1 (space or enter to trigger)
 * - ## Heading 2-6 (h2-h6)
 * - - List (bullet list)
 * - 1. Numbered list
 * - > Quote
 * - ``` Code block
 */

import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { Extension, textblockTypeInputRule, wrappingInputRule } from '@tiptap/core'
import { SlashCommands } from './SlashCommands'
import 'tippy.js/dist/tippy.css'

// Custom extension for Markdown shortcuts with Enter key trigger
const HeadingMarkdownShortcut = Extension.create({
  name: 'headingMarkdownShortcut',

  addInputRules() {
    // Space trigger: Standard Markdown behavior "# title" + space -> H1
    const rules = [
      // h1 ~ h6 标题
      textblockTypeInputRule({
        find: /^(#{1,6})\s$/,
        type: this.editor.schema.nodes.heading,
        getAttributes: match => ({ level: match[1].length }),
      }),
      // 无序列表: - 或 * 或 + 加空格
      wrappingInputRule({
        find: /^\s*([-*+])\s$/,
        type: this.editor.schema.nodes.bulletList,
      }),
      // 有序列表: 1. 加空格
      wrappingInputRule({
        find: /^(\d+)\.\s$/,
        type: this.editor.schema.nodes.orderedList,
      }),
      // 引用: > 加空格
      textblockTypeInputRule({
        find: /^>\s$/,
        type: this.editor.schema.nodes.blockquote,
      }),
    ]
    return rules
  },

  addKeyboardShortcuts() {
    // Enter trigger: Line starts with ###content (no space required), press Enter to convert
    return {
      Enter: () => {
        const { state, chain } = this.editor
        const { $from } = state.selection
        const lineStart = $from.start()
        const lineText = state.doc.textBetween(lineStart, $from.end(), '\n', '\n')

        // Only process when cursor is at the start of a paragraph
        // Match: ####content (allows no space)
        const headingMatch = lineText.match(/^(#{1,6})([^\s#].*)$/)
        if (headingMatch) {
          const level = headingMatch[1].length
          const text = headingMatch[2].trim()

          // Replace current line with Heading node
          chain()
            .command(({ tr, dispatch }) => {
              const from = lineStart
              const to = $from.end() // Current paragraph to line end
              dispatch?.(
                tr
                  .delete(from, to)
                  .insertText(text, from)
              )
              return true
            })
            .setNode('heading', { level })
            .run()
          return true
        }

        // Quote: >content
        const quoteMatch = lineText.match(/^>(.*)$/)
        if (quoteMatch) {
          const text = quoteMatch[1].trim()
          chain()
            .command(({ tr, dispatch }) => {
              const from = lineStart
              const to = $from.end()
              dispatch?.(tr.delete(from, to).insertText(text, from))
              return true
            })
            .setNode('blockquote')
            .run()
          return true
        }

        // Bullet list: - content / * content / + content
        const ulMatch = lineText.match(/^(\-|\*|\+)(.*)$/)
        if (ulMatch) {
          const text = ulMatch[2].trim()
          chain()
            .command(({ tr, dispatch }) => {
              const from = lineStart
              const to = $from.end()
              dispatch?.(tr.delete(from, to).insertText(text, from))
              return true
            })
            .toggleBulletList()
            .run()
          return true
        }

        // Ordered list: 1. content
        const olMatch = lineText.match(/^(\d+)\.(.*)$/)
        if (olMatch) {
          const text = olMatch[2].trim()
          chain()
            .command(({ tr, dispatch }) => {
              const from = lineStart
              const to = $from.end()
              dispatch?.(tr.delete(from, to).insertText(text, from))
              return true
            })
            .toggleOrderedList()
            .run()
          return true
        }

        return false
      },
    }
  },
})

// Styles: Feishu/Notion-like layout (can be adjusted as needed)
const styles = `
.tdoc {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 20px 24px;
  line-height: 1.75;
  color: var(--note-editor-text, #111827);
  caret-color: var(--note-editor-text, #111827);
  font-size: 16px;
  min-height: 100%;
  outline: none;
  box-sizing: border-box;
}
/* 在超大屏幕上适当限制宽度并居中，提升阅读体验 */
@media (min-width: 1600px) {
  .tdoc {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px 32px;
  }
}
@media (min-width: 1920px) {
  .tdoc {
    max-width: 1600px;
    padding: 20px 48px;
  }
}
/* 小屏幕优化 */
@media (max-width: 768px) {
  .tdoc {
    padding: 16px;
  }
}
.tdoc h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 28px 0 12px;
  color: var(--note-editor-text, #111827);
  border: none !important;
  text-decoration: none !important;
  border-bottom: none !important;
}
.tdoc h2 {
  font-size: 26px;
  font-weight: 700;
  margin: 24px 0 10px;
  color: var(--note-editor-text, #111827);
  border: none !important;
  text-decoration: none !important;
  border-bottom: none !important;
}
.tdoc h3 {
  font-size: 22px;
  font-weight: 700;
  margin: 20px 0 8px;
  color: var(--note-editor-text, #111827);
  border: none !important;
  text-decoration: none !important;
  border-bottom: none !important;
}
.tdoc h4 {
  font-size: 18px;
  font-weight: 700;
  margin: 16px 0 8px;
  color: var(--note-editor-text, #111827);
  border: none !important;
  text-decoration: none !important;
}
.tdoc h5 {
  font-size: 16px;
  font-weight: 700;
  margin: 14px 0 6px;
  color: var(--note-editor-text, #111827);
  border: none !important;
  text-decoration: none !important;
}
.tdoc h6 {
  font-size: 14px;
  font-weight: 700;
  margin: 12px 0 6px;
  color: var(--note-editor-text, #111827);
  border: none !important;
  text-decoration: none !important;
}
.tdoc p  { margin: 10px 0; }
.tdoc blockquote {
  border-left: 3px solid var(--border, #e5e7eb);
  background: var(--secondary, #f9fafb);
  padding: 10px 14px;
  margin: 12px 0;
  color: var(--muted-foreground, #374151);
}
.tdoc ul, .tdoc ol {
  padding-left: 1.8em;
  margin: 8px 0;
  list-style-position: outside;
}
.tdoc ul {
  list-style-type: disc !important;
}
.tdoc ol {
  list-style-type: decimal !important;
}
.tdoc li {
  margin: 4px 0;
  display: list-item !important;
  color: var(--note-editor-text, #111827);
}
.tdoc ul ul {
  list-style-type: circle !important;
}
.tdoc ul ul ul {
  list-style-type: square !important;
}
.tdoc li::marker {
  color: var(--note-editor-text, #111827);
}
.tdoc code {
  background: var(--secondary, #f3f4f6);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
  color: #e11d48;
  font-size: 0.9em;
}
.tdoc pre {
  background: var(--code-block-bg, #0b1021);
  color: var(--code-block-text, #e5e7eb);
  padding: 14px 16px;
  border-radius: 8px;
  overflow: auto;
  font-size: 14px;
  margin: 16px 0;
}
.tdoc pre code {
  background: transparent;
  padding: 0;
  color: var(--code-block-text, #e5e7eb);
}
.tdoc hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 24px 0;
}
.tdoc a {
  color: #2563eb;
  text-decoration: none;
}
.tdoc a:hover {
  text-decoration: underline;
}
.tdoc strong {
  font-weight: 700;
  color: var(--note-editor-text, #111827);
}
.tdoc em {
  font-style: italic;
}
.tdoc .is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #9ca3af;
  pointer-events: none;
  height: 0;
}
.tdoc:focus {
  outline: none;
}
.ProseMirror {
  outline: none;
  caret-color: var(--note-editor-text, #111827);
}
.ProseMirror-focused {
  outline: none;
}
`

export default function MarkdownLikeEditor({
  initialHTML = '',
  placeholder = '使用 Markdown 快捷键输入：# 一级标题，## 二级标题，- 列表，> 引用，``` 代码块…',
  onUpdateHTML,
  onEditorReady,
}) {
  const editor = useEditor({
    extensions: [
      Color.configure({ types: ['textStyle'] }),
      TextStyle,
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      HeadingMarkdownShortcut,
      SlashCommands,
    ],
    content: initialHTML || '<p></p>',
    autofocus: 'end',
    onUpdate: ({ editor }) => {
      onUpdateHTML?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tdoc',
        'data-placeholder': placeholder,
      },
      handleDOMEvents: {
        // Paste plain text with Markdown processing: minimal handling
        paste: (view, event) => {
          if (!event.clipboardData) return false
          const text = event.clipboardData.getData('text/plain')
          if (!text) return false
          // Prevent default paste behavior
          event.preventDefault()
          // Use TipTap's transaction to insert text (modern approach)
          const { state } = view
          const { tr } = state
          tr.insertText(text)
          view.dispatch(tr)
          return true
        },
      },
    },
  })

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady])

  return (
    <>
      <style>{styles}</style>
      <EditorContent editor={editor} />
    </>
  )
}
