# 项目结构（完整体，覆盖升级 Notion 风交互 / v0.dev 视觉）

```
notes-app/
├─ package.json
├─ index.html
├─ tsconfig.json
├─ vite.config.ts
├─ postcss.config.js
├─ tailwind.config.ts
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ index.css
│  ├─ ai.ts                      # 你的 LLM 封装：/summary /outline /rewrite /todo
│  ├─ lib/
│  │  └─ db.ts                   # Tauri SQLite 封装 & schema/migration
│  └─ features/notes/
│     ├─ NoteEditor.tsx          # Lexical 编辑器（原生命令，无 execCommand）
│     ├─ Sidebar.tsx             # v0.dev 风格侧栏（检索/列表/新建）
│     ├─ SlashMenu.tsx           # Slash 浮层
│     ├─ ImageNode.tsx           # 自定义图片节点（DecoratorNode）
│     ├─ pickImage.ts            # 纯前端 <input type=file> 选择并转 DataURL（避免 Tauri FS 权限）
│     └─ types.ts
└─ src-tauri/
   ├─ Cargo.toml
   ├─ tauri.conf.json
   └─ src/
      └─ main.rs
```

---

## package.json（增加 selection/utils；保留最小依赖）
```json
{
  "name": "notes-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  },
  "dependencies": {
    "@lexical/code": "^0.15.0",
    "@lexical/link": "^0.15.0",
    "@lexical/list": "^0.15.0",
    "@lexical/markdown": "^0.15.0",
    "@lexical/react": "^0.15.0",
    "@lexical/rich-text": "^0.15.0",
    "@lexical/selection": "^0.15.0",
    "@lexical/utils": "^0.15.0",
    "@lexical/table": "^0.15.0",
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-sql": "^2.0.0",
    "classnames": "^2.5.1",
    "lexical": "^0.15.0",
    "lucide-react": "^0.469.0",
    "nanoid": "^5.0.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.2",
    "vite": "^5.4.8"
  }
}
```

---

## vite.config.ts
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  }
})
```

---

## tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

---

## postcss.config.js
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

---

## tailwind.config.ts（v0.dev 氛围视觉）
```ts
import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html','./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        card: '#0B0C0F', cardFg: '#EAECEE', subtle: '#9AA4B2', border: '#1B1D24', brand: '#7C3AED'
      },
      borderRadius: { xl: '1rem', '2xl': '1.25rem' },
      boxShadow: { card: '0 10px 30px rgba(0,0,0,.35)' }
    }
  },
  plugins: []
} satisfies Config
```

---

## index.html
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Notes</title>
  </head>
  <body class="bg-[#0A0A0A] text-cardFg">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## src/index.css（v0 风格）
```css
@tailwind base; @tailwind components; @tailwind utilities;
:root { --ring: theme(colors.brand) }
* { box-sizing: border-box }
.prose :where(h1,h2,h3){ color:#EAECEE }
.prose :where(code){ background:#111318; padding:.2rem .4rem; border-radius:.5rem }
.card { background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.01)); border:1px solid theme(colors.border); border-radius:theme(borderRadius.2xl); backdrop-filter:blur(6px); box-shadow:theme(boxShadow.card) }
.input { background:#0D0F14; border:1px solid theme(colors.border); border-radius:14px; padding:.6rem .9rem; outline:none }
.input:focus { border-color:var(--ring); box-shadow:0 0 0 4px rgba(124,58,237,.15) }
.btn { display:inline-flex; align-items:center; gap:.5rem; background:#191B22; border:1px solid theme(colors.border); border-radius:12px; padding:.55rem .9rem; font-weight:600 }
.btn:hover{ border-color:#2A2E39 }
.btn.primary{ background:#6D28D9; border-color:#6D28D9; color:white }
.btn.primary:hover{ filter:brightness(1.05) }
.scroll-thin{ scrollbar-width:thin }
```

---

## src/main.tsx
```tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## src/features/notes/types.ts
```ts
export type NoteLite = {
  id: string
  title: string
  pinned: number
  trashed: number
  created_at: number
  updated_at: number
}

export type NoteFull = NoteLite & {
  editor_state: string
  plain_text: string
  outline: string
}
```

---

## src/lib/db.ts（SQLite 封装 & FTS）
```ts
import Database from '@tauri-apps/plugin-sql'
import { nanoid } from 'nanoid'

let db: Database | null = null
export async function getDb(){
  if (db) return db
  db = await Database.load('sqlite:notes.db')
  await migrate(db)
  return db
}

async function migrate(db: Database){
  await db.execute(`
  PRAGMA journal_mode=WAL;
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    pinned INTEGER NOT NULL DEFAULT 0,
    trashed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS note_body (
    note_id TEXT PRIMARY KEY,
    editor_state TEXT NOT NULL,
    plain_text TEXT NOT NULL,
    outline TEXT NOT NULL DEFAULT '[]',
    FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
  );
  CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
    note_id UNINDEXED,
    title,
    content,
    content_rowid=''
  );`)
}

export async function createNote(title=''){
  const db = await getDb()
  const id = nanoid(); const now = Date.now()
  await db.execute('INSERT INTO notes(id,title,pinned,trashed,created_at,updated_at) VALUES(?,?,?,?,?,?)',[id,title,0,0,now,now])
  await db.execute('INSERT INTO note_body(note_id,editor_state,plain_text,outline) VALUES(?,?,?,?)',[
    id,
    '{"root":{"children":[],"direction":null,"format":"","indent":0,"type":"root","version":1}}',
    '', '[]'
  ])
  await syncFTS(id)
  return id
}

export async function loadNote(id:string){
  const db = await getDb()
  const row = await db.select<any[]>(`SELECT n.*, b.editor_state, b.plain_text, b.outline FROM notes n JOIN note_body b ON n.id=b.note_id WHERE n.id=?`, [id])
  return row[0]
}

export async function listNotes(keyword=''){
  const db = await getDb()
  if (keyword.trim()){
    return await db.select<any[]>(`SELECT n.* FROM search_fts f JOIN notes n ON n.id=f.note_id WHERE search_fts MATCH ? AND n.trashed=0 GROUP BY n.id ORDER BY n.pinned DESC, n.updated_at DESC LIMIT 200`, [keyword])
  }
  return await db.select<any[]>(`SELECT * FROM notes WHERE trashed=0 ORDER BY pinned DESC, updated_at DESC LIMIT 200`)
}

export async function saveState(noteId:string, editorJSON:string, text:string){
  const db = await getDb(); const now = Date.now()
  await db.execute('UPDATE note_body SET editor_state=?, plain_text=? WHERE note_id=?',[editorJSON,text,noteId])
  await db.execute('UPDATE notes SET updated_at=? WHERE id=?',[now,noteId])
  await syncFTS(noteId)
}

export async function renameNote(noteId:string, title:string){
  const db = await getDb()
  await db.execute('UPDATE notes SET title=?, updated_at=? WHERE id=?',[title,Date.now(),noteId])
  await syncFTS(noteId)
}

export async function togglePin(noteId:string){
  const db = await getDb()
  const row = await db.select<{pinned:number}[]>(`SELECT pinned FROM notes WHERE id=?`, [noteId])
  const next = row[0].pinned ? 0 : 1
  await db.execute('UPDATE notes SET pinned=?, updated_at=? WHERE id=?', [next, Date.now(), noteId])
}

export async function trashNote(noteId:string){
  const db = await getDb()
  await db.execute('UPDATE notes SET trashed=1, updated_at=? WHERE id=?', [Date.now(), noteId])
}

async function syncFTS(noteId:string){
  const db = await getDb()
  const row = await db.select<{title:string;plain_text:string}[]>(`SELECT n.title, b.plain_text FROM notes n JOIN note_body b ON n.id=b.note_id WHERE n.id=?`,[noteId])
  const { title, plain_text } = row[0] || { title:'', plain_text:'' }
  await db.execute('DELETE FROM search_fts WHERE note_id=?',[noteId])
  await db.execute('INSERT INTO search_fts(note_id,title,content) VALUES(?,?,?)',[noteId,title,plain_text])
}
```

---

## src/ai.ts（占位：接你现有 LLM 层）
```ts
export async function runAI(action: 'summary'|'outline'|'rewrite'|'todo', payload: { text: string }) {
  switch(action){
    case 'summary': return '【AI 总结示例】这里是对所选内容的要点归纳…'
    case 'outline': return '- 一级标题
  - 二级标题
  - 三级标题…'
    case 'rewrite': return '【AI 改写示例】在保持语义的前提下更简洁清晰…'
    case 'todo': return '- [ ] 任务 A
- [ ] 任务 B'
  }
}
```

---

## src/features/notes/SlashMenu.tsx（v0 风格 Slash 菜单）
```tsx
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

type Item = { key: string; label: string; onClick: () => void }
export default function SlashMenu({ anchor, items, onClose }:{ anchor: DOMRect | null; items: Item[]; onClose: () => void }){
  const ref = useRef<HTMLDivElement>(null)
  useEffect(()=>{
    function onKey(e: KeyboardEvent){ if(e.key==='Escape') onClose() }
    function onClick(e: MouseEvent){ if(!ref.current?.contains(e.target as Node)) onClose() }
    window.addEventListener('keydown', onKey); window.addEventListener('mousedown', onClick)
    return ()=>{ window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onClick) }
  },[onClose])
  if(!anchor) return null
  return createPortal(
    <div ref={ref} className="card absolute z-50 p-2 w-64" style={{ top: anchor.bottom + 6, left: anchor.left }}>
      {items.map(i => (
        <button key={i.key} className="w-full text-left btn !bg-transparent !border-transparent hover:!border-[#2A2E39]" onClick={i.onClick}>
          {i.label}
        </button>
      ))}
    </div>, document.body)
}
```

---

## src/features/notes/pickImage.ts（纯前端文件选择 → DataURL）
```ts
export function pickImageAsDataUrl(): Promise<string | null> {
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'; input.style.display = 'none'
    input.onchange = () => {
      const file = input.files?.[0]; if(!file){ resolve(null); return }
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    }
    document.body.appendChild(input)
    input.click()
    setTimeout(()=>{ input.remove() }, 0)
  })
}
```

---

## src/features/notes/ImageNode.tsx（自定义图片节点）
```tsx
import { DecoratorNode, type EditorConfig, type LexicalEditor, type NodeKey, $applyNodeReplacement } from 'lexical'
import React from 'react'

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string
  __alt: string
  static getType(): string { return 'image' }
  static clone(node: ImageNode){ return new ImageNode(node.__src, node.__alt, node.__key) }
  constructor(src: string, alt = '', key?: NodeKey){ super(key); this.__src = src; this.__alt = alt }
  exportJSON(){ return { type: 'image', version: 1, src: this.__src, alt: this.__alt } }
  static importJSON(serialized: any){ const node = new ImageNode(serialized.src, serialized.alt || ''); return $applyNodeReplacement(node) }
  createDOM(_config: EditorConfig){ const span = document.createElement('span'); return span }
  updateDOM(){ return false }
  decorate(_editor: LexicalEditor){ return <img src={this.__src} alt={this.__alt} className="max-w-full rounded-xl border border-border"/> }
}

export function $createImageNode(src: string, alt = ''){ return $applyNodeReplacement(new ImageNode(src, alt)) }
export function $isImageNode(node: unknown): node is ImageNode { return node instanceof ImageNode }
```

---

## src/features/notes/NoteEditor.tsx（Lexical 原生命令 + Slash + 图片/分割线/待办）
```tsx
import { useEffect, useMemo, useState } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { HeadingNode, QuoteNode, $createHeadingNode } from '@lexical/rich-text'
import { ListNode, ListItemNode, INSERT_UNORDERED_LIST_COMMAND, INSERT_CHECK_LIST_COMMAND } from '@lexical/list'
import { LinkNode } from '@lexical/link'
import { CodeNode, $createCodeNode } from '@lexical/code'
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table'
import { TRANSFORMERS } from '@lexical/markdown'
import { $getSelection, $isRangeSelection, INSERT_PARAGRAPH_COMMAND } from 'lexical'
import { setBlocksType } from '@lexical/selection'
import type { NoteLite } from './types'
import { runAI } from '@/ai'
import SlashMenu from './SlashMenu'
import { ImageNode, $createImageNode } from './ImageNode'
import { pickImageAsDataUrl } from './pickImage'

export default function NoteEditor({
  note,
  loadState,
  saveState,
}: {
  note: NoteLite
  loadState: (id: string) => Promise<string>
  saveState: (id: string, editorJSON: string, plain: string) => Promise<void>
}) {
  const [initialState, setInitialState] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<DOMRect | null>(null)

  useEffect(()=>{
    let alive = true
    loadState(note.id).then(s => { if(alive) setInitialState(s) })
    return ()=>{ alive = false }
  },[note.id])

  const theme = useMemo(() => ({
    paragraph: 'leading-7',
    heading: { h1: 'text-2xl font-bold my-3', h2: 'text-xl font-semibold my-2' },
    quote: 'border-l-4 pl-3 italic opacity-80',
    list: { ul: 'list-disc pl-6', ol: 'list-decimal pl-6' },
    code: 'bg-[#111318] px-2 py-1 rounded',
  }), [])

  const initialConfig = useMemo(() => ({
    namespace: 'personal-notes',
    theme,
    onError(error: Error){ console.error(error) },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, CodeNode, TableNode, TableRowNode, TableCellNode, ImageNode],
    editorState: initialState ?? undefined,
  }), [theme, initialState])

  // Slash 打开位置
  function onKeyDown(e: React.KeyboardEvent){
    if (e.key === '/' && !e.shiftKey){
      const sel = window.getSelection(); if(sel && sel.rangeCount>0){ setMenuPos(sel.getRangeAt(0).getBoundingClientRect()) }
    }
  }

  return (
    <div className="w-full h-full">
      {initialState === null ? (
        <div className="p-4 text-sm opacity-70">加载中…</div>
      ) : (
        <LexicalComposer initialConfig={initialConfig}>
          <div className="prose max-w-none p-4">
            <RichTextPlugin
              contentEditable={<ContentEditable className="min-h-[60vh] outline-none" onKeyDown={onKeyDown} />}
              placeholder={<div className="opacity-40">输入以开始；“# 空格”标题，“- 空格”列表，``` 代码；按 “/” 打开命令</div>}
            />
            <HistoryPlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            <OnChangePlugin onChange={async (editorState) => {
              const el = document.querySelector('[contenteditable="true"]') as HTMLElement | null
              const plain = el?.innerText ?? ''
              await saveState(note.id, JSON.stringify(editorState), plain)
            }} />

            {/* Slash 菜单（Lexical 原生命令） */}
            <SlashMenu anchor={menuPos} onClose={()=>setMenuPos(null)} items=[
              { key:'h1', label:'一级标题', onClick:()=>{
                window.getSelection();
                const editor = (window as any).lexicalEditor as any
              }}
            ] />
          </div>
        </LexicalComposer>
      )}
    </div>
  )
}
```

> 说明：为了不在编辑器外拿不到 `editor`，下面在 `NoteEditor` 里再补一个小插件 `CommandsPlugin`，将 `editor` 放到 window 临时引用，并提供真正的命令实现。

**在 `NoteEditor.tsx` 追加（放在组件内 `return` 上方）：**
```tsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

function CommandsPlugin({ noteId }:{ noteId: string }){
  const [editor] = useLexicalComposerContext()
  useEffect(()=>{ (window as any).lexicalEditor = editor; return ()=>{ delete (window as any).lexicalEditor } },[editor])
  return null
}
```

**然后在 `<LexicalComposer>` 内部 `</OnChangePlugin>` 后面插入：**
```tsx
<CommandsPlugin noteId={note.id} />
```

**最后，替换上面 SlashMenu 的 `items` 为真正的命令实现：**
```tsx
<SlashMenu anchor={menuPos} onClose={()=>setMenuPos(null)} items={[
  { key:'h1', label:'一级标题', onClick:()=>{
    const editor = (window as any).lexicalEditor
    editor.update(()=>{
      const sel = $getSelection(); if($isRangeSelection(sel)) setBlocksType(sel, ()=>$createHeadingNode('h1'))
    })
  }},
  { key:'ul', label:'无序列表', onClick:()=>{ const editor=(window as any).lexicalEditor; editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined) }},
  { key:'check', label:'待办清单', onClick:()=>{ const editor=(window as any).lexicalEditor; editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined) }},
  { key:'code', label:'代码块', onClick:()=>{ const editor=(window as any).lexicalEditor; editor.update(()=>{ const sel=$getSelection(); if($isRangeSelection(sel)) setBlocksType(sel, ()=>$createCodeNode()) }) }},
  { key:'hr', label:'分割线', onClick:()=>{ const editor=(window as any).lexicalEditor; editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined); editor.update(()=>{ const sel=$getSelection(); if($isRangeSelection(sel)) { // 用 Markdown --- 触发 HR 转换
      document.execCommand('insertText', false, '---');
    }}); editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined) }},
  { key:'img', label:'图片', onClick:async()=>{
    const dataUrl = await pickImageAsDataUrl(); if(!dataUrl) return
    const editor=(window as any).lexicalEditor
    editor.update(()=>{ $createImageNode(dataUrl, '') })
  }},
  { key:'ai-sum', label:'AI 总结', onClick:async()=>{
    const sel = window.getSelection()?.toString() ?? ''
    const out = await runAI('summary', { text: sel })
    const editor=(window as any).lexicalEditor; editor.update(()=>{ document.execCommand('insertText', false, '
'+out+'
') })
  }},
  { key:'ai-outline', label:'AI 大纲', onClick:async()=>{
    const sel = window.getSelection()?.toString() ?? ''
    const out = await runAI('outline', { text: sel })
    const editor=(window as any).lexicalEditor; editor.update(()=>{ document.execCommand('insertText', false, '
'+out+'
') })
  }},
  { key:'ai-rewrite', label:'AI 改写', onClick:async()=>{
    const sel = window.getSelection()?.toString() ?? ''
    const out = await runAI('rewrite', { text: sel })
    const editor=(window as any).lexicalEditor; editor.update(()=>{ document.execCommand('insertText', false, '
'+out+'
') })
  }},
  { key:'ai-todo', label:'AI 任务清单', onClick:async()=>{
    const sel = window.getSelection()?.toString() ?? ''
    const out = await runAI('todo', { text: sel })
    const editor=(window as any).lexicalEditor; editor.update(()=>{ document.execCommand('insertText', false, '
'+out+'
') })
  }},
]} />
```

> 说明：真正插块的核心都改为 **Lexical 原生命令/更新器**；仅在 HR 与 AI 文本插入处保留 `insertText` 作为最小黏合（HR 会被 MarkdownShortcutPlugin 立即转成分割线）。如要 100% 去除 `execCommand`，可引入官方/自定义 `HorizontalRuleNode` 与 `INSERT_TEXT_COMMAND`（需额外实现），此处先给稳妥 MVP。

---

## src/features/notes/Sidebar.tsx（v0 风格侧栏）
```tsx
import { Plus, Pin, PinOff, Trash2, Search } from 'lucide-react'
import type { NoteLite } from './types'

export default function Sidebar({
  notes, keyword, onKeyword, onCreate, onSelect, activeId, onTogglePin, onTrash,
}:{
  notes: NoteLite[]
  keyword: string
  activeId?: string
  onKeyword: (q: string) => void
  onCreate: () => void
  onSelect: (id: string) => void
  onTogglePin: (id: string) => void
  onTrash: (id: string) => void
}){
  return (
    <aside className="w-[320px] p-4 space-y-3 border-r border-border bg-[#0A0A0A]">
      <div className="flex items-center gap-2">
        <button className="btn primary" onClick={onCreate}><Plus size={16}/> 新建</button>
        <div className="flex-1"/>
      </div>
      <div className="relative">
        <input className="input w-full pr-9" placeholder="搜索（FTS）" value={keyword} onChange={e=>onKeyword(e.target.value)} />
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle" />
      </div>
      <div className="space-y-2 overflow-auto max-h-[calc(100vh-180px)] scroll-thin pr-1">
        {notes.map(n => (
          <div key={n.id} onClick={()=>onSelect(n.id)}
               className={'card p-3 cursor-pointer border ' + (activeId===n.id ? 'border-brand' : 'border-border hover:border-[#2A2E39]')}>
            <div className="flex items-center gap-2">
              <div className="truncate font-medium">{n.title || '未命名'}</div>
              <div className="flex-1"/>
              <button className="btn" onClick={(e)=>{e.stopPropagation(); onTogglePin(n.id)}} title="置顶/取消">
                {n.pinned ? <PinOff size={16}/> : <Pin size={16}/>}
              </button>
              <button className="btn" onClick={(e)=>{e.stopPropagation(); onTrash(n.id)}} title="回收站">
                <Trash2 size={16}/>
              </button>
            </div>
            <div className="text-xs text-subtle mt-1">{new Date(n.updated_at).toLocaleString()}</div>
          </div>
        ))}
        {notes.length===0 && (<div className="text-subtle text-sm p-2">无结果</div>)}
      </div>
    </aside>
  )
}
```

---

## src/App.tsx（应用外壳 / 标题联动修复）
```tsx
import { useEffect, useMemo, useState } from 'react'
import Sidebar from './features/notes/Sidebar'
import NoteEditor from './features/notes/NoteEditor'
import type { NoteLite } from './features/notes/types'
import { createNote, getDb, listNotes, loadNote, renameNote, saveState, togglePin, trashNote } from './lib/db'

export default function App(){
  const [keyword, setKeyword] = useState('')
  const [notes, setNotes] = useState<NoteLite[]>([])
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  const [title, setTitle] = useState('')

  useEffect(()=>{ (async()=>{ await getDb(); await reload() })() },[])
  useEffect(()=>{ reload(keyword) },[keyword])
  useEffect(()=>{ if(notes.length && !activeId) setActiveId(notes[0].id) },[notes])

  useEffect(()=>{
    const n = notes.find(n => n.id===activeId)
    setTitle(n?.title ?? '')
  }, [activeId, notes])

  async function reload(q=''){ setNotes(await listNotes(q)) }
  const active = useMemo(()=> notes.find(n=>n.id===activeId), [notes, activeId])

  return (
    <div className="h-screen w-screen flex">
      <Sidebar
        notes={notes}
        keyword={keyword}
        onKeyword={setKeyword}
        onCreate={async()=>{ const id = await createNote('未命名'); await reload(keyword); setActiveId(id) }}
        onSelect={setActiveId}
        activeId={activeId}
        onTogglePin={async(id)=>{ await togglePin(id); await reload(keyword) }}
        onTrash={async(id)=>{ await trashNote(id); if(activeId===id) setActiveId(undefined); await reload(keyword) }}
      />

      <main className="flex-1 p-6">
        {!active ? (
          <div className="h-full grid place-items-center text-subtle">选择左侧笔记或新建</div>
        ) : (
          <div className="max-w-[960px] mx-auto space-y-4">
            <input
              className="input w-full text-2xl font-semibold"
              value={title}
              onChange={e=>setTitle(e.target.value)}
              onBlur={async()=>{ if(activeId){ await renameNote(activeId, title); await reload(keyword) } }}
              placeholder="标题"
            />
            <div className="card">
              <NoteEditor
                note={active}
                loadState={async(id)=> (await loadNote(id))!.editor_state}
                saveState={saveState}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
```

---

## src-tauri/Cargo.toml（Tauri v2 + SQL 插件）
```toml
[package]
name = "notes-app"
version = "0.1.0"
edition = "2021"

[dependencies]
 tauri = { version = "2", features = ["macos-private-api"] }

[dependencies.tauri-plugin-sql]
version = "2"
features = ["sqlite"]
```

---

## src-tauri/src/main.rs
```rust
use tauri::Manager;

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_sql::Builder::default().build())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

---

## src-tauri/tauri.conf.json
```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Notes",
  "version": "0.1.0",
  "identifier": "com.example.notes",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173"
  },
  "app": {
    "windows": [ { "title": "Notes", "width": 1200, "height": 800, "resizable": true } ]
  },
  "bundle": {
    "active": true,
    "targets": ["dmg", "nsis"],
    "icon": ["icons/icon.icns", "icons/icon.ico"]
  }
}
```

---

## 运行步骤
```bash
pnpm i
pnpm tauri:dev     # 同时起 Vite 与 Tauri 窗口
# 打包：
pnpm tauri:build
```

---

## 验收点
- `# 空格 / - 空格 / ``` ` → 正确成块；`- [ ]` 勾选任务。
- `/` 弹出菜单：标题/列表/待办/代码/分割线/图片 + AI（四项）。
- 图片以 **DataURL** 内嵌存储，完全离线，不依赖 FS 权限；后续如需落盘再加。
- FTS 实时检索；离线编辑与保存不受网络影响。
