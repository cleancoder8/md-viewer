# md-viewer Desktop App — Design

**Date:** 2026-03-08

## Goal

A cross-platform desktop markdown viewer built with Electron that supports opening individual files and browsing folders, with live reload, syntax highlighting, a table of contents, dark/light mode, and search.

---

## Architecture

### Main Process (Node.js/Electron)
- Manages app lifecycle, file system access, native menus, and IPC
- Watches files for changes via `chokidar` (live reload)
- Handles native open file/folder dialogs

### Renderer Process (HTML/CSS/JS — no framework)
- Single-page UI with sidebar + content panel layout
- Renders markdown via `markdown-it` with plugins
- Communicates with main process via Electron IPC (`ipcRenderer` / `ipcMain`)

---

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│  [Open File] [Open Folder]          [🌙 Dark/Light] │  ← toolbar
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  File Tree   │   Markdown Content                   │
│  (sidebar)   │                                      │
│              │   # Heading                          │
│  📄 README   │                                      │
│  📄 NOTES    │   Some paragraph text...             │
│  📁 docs/    │                                      │
│    📄 api    │   ```python                          │
│              │   def hello(): ...                   │
│              │   ```                                │
│              │                                      │
│              ├──────────────────────────────────────┤
│              │  Table of Contents                   │
│              │  • Heading 1                         │
│              │    • Subheading                      │
└──────────────┴──────────────────────────────────────┘
│  [Search: ________________]                         │  ← bottom bar
└─────────────────────────────────────────────────────┘
```

- Sidebar is hidden when no folder is open (single file mode)
- TOC panel sits below the content area, collapsible
- Search bar at the bottom; searches current file or all files in folder mode

---

## Features & Data Flow

### File Opening
- "Open File" → native dialog → main reads file → IPC → renderer renders markdown
- "Open Folder" → native dialog → main walks directory for `.md` files → IPC → sidebar populates

### Live Reload
- `chokidar` watches currently open file(s)
- On file change → main re-reads → IPC → renderer re-renders (preserving scroll position)

### Markdown Rendering
- **Library:** `markdown-it`
- **Plugins:**
  - `markdown-it-anchor` — adds IDs to headings for TOC anchor links
  - `highlight.js` — syntax highlighting for code blocks
- TOC is extracted from rendered headings after each render pass

### Search
- **Single file mode:** highlight/filter matching text in rendered content
- **Folder mode:** search across all `.md` files, click result to open that file

### Dark/Light Mode
- CSS custom properties for theming
- Toggle swaps `data-theme` attribute on `<body>`
- Preference persisted to `localStorage`

---

## Tech Stack

| Concern | Choice |
|---|---|
| Desktop runtime | Electron |
| Markdown rendering | markdown-it |
| Heading anchors | markdown-it-anchor |
| Syntax highlighting | highlight.js |
| File watching | chokidar |
| Frontend framework | None (vanilla JS) |
| Styling | CSS custom properties |
