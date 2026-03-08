# md-viewer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a cross-platform Electron desktop app that renders markdown files with a file tree sidebar, live reload, syntax highlighting, TOC, dark/light mode, and search.

**Architecture:** Electron main process handles file system access, native dialogs, and file watching (chokidar); renderer process (vanilla JS) handles UI and markdown rendering (markdown-it). IPC bridges the two. Pure JS functions for rendering, TOC extraction, file tree building, and search are unit-tested with Jest; Electron-specific behavior is verified manually.

**Tech Stack:** Electron, markdown-it, markdown-it-anchor, highlight.js, chokidar, Jest

---

## Project Structure

```
md-viewer/
├── package.json
├── src/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Context bridge (IPC exposure)
│   └── renderer/
│       ├── index.html
│       ├── renderer.js      # UI wiring
│       ├── style.css
│       ├── markdown.js      # Pure: md string → HTML (testable)
│       ├── toc.js           # Pure: HTML → TOC array (testable)
│       ├── filetree.js      # Pure: path array → tree object (testable)
│       └── search.js        # Pure: query + content → matches (testable)
├── tests/
│   ├── markdown.test.js
│   ├── toc.test.js
│   ├── filetree.test.js
│   └── search.test.js
└── docs/plans/
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `src/main.js` (stub)
- Create: `src/preload.js` (stub)
- Create: `src/renderer/index.html` (stub)
- Create: `src/renderer/renderer.js` (stub)
- Create: `src/renderer/style.css` (stub)

**Step 1: Initialize npm project**

```bash
cd /Users/ayushdhar/projects/md-viewer
npm init -y
```

**Step 2: Install dependencies**

```bash
npm install electron markdown-it markdown-it-anchor highlight.js chokidar
npm install --save-dev jest
```

**Step 3: Update package.json**

Edit `package.json` to add:

```json
{
  "main": "src/main.js",
  "scripts": {
    "start": "electron .",
    "test": "jest"
  },
  "jest": {
    "testEnvironment": "node",
    "testMatch": ["**/tests/**/*.test.js"]
  }
}
```

**Step 4: Create stub files**

Create `src/main.js`:
```js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer/index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
```

Create `src/preload.js`:
```js
const { contextBridge } = require('electron');
// IPC bindings added in later tasks
contextBridge.exposeInMainWorld('api', {});
```

Create `src/renderer/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>md-viewer</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <p>md-viewer</p>
  <script src="renderer.js"></script>
</body>
</html>
```

Create `src/renderer/renderer.js`:
```js
// wired up in later tasks
```

Create `src/renderer/style.css`:
```css
/* styles added in later tasks */
body { margin: 0; font-family: sans-serif; }
```

**Step 5: Verify app launches**

```bash
npm start
```
Expected: Electron window opens showing "md-viewer"

**Step 6: Commit**

```bash
git add package.json package-lock.json src/
git commit -m "feat: scaffold Electron project with dependencies"
```

---

### Task 2: UI Layout (HTML + CSS)

**Files:**
- Modify: `src/renderer/index.html`
- Modify: `src/renderer/style.css`

**Step 1: Replace index.html with full layout**

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <title>md-viewer</title>
  <link rel="stylesheet" href="../../node_modules/highlight.js/styles/github.css" id="hljs-theme" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="toolbar">
    <button id="btn-open-file">Open File</button>
    <button id="btn-open-folder">Open Folder</button>
    <button id="btn-theme">Dark Mode</button>
  </div>
  <div id="app">
    <aside id="sidebar" class="hidden">
      <div id="file-tree"></div>
    </aside>
    <main id="content-area">
      <div id="content"></div>
      <div id="toc-panel">
        <div id="toc-header">Table of Contents</div>
        <div id="toc"></div>
      </div>
    </main>
  </div>
  <div id="search-bar">
    <input id="search-input" type="text" placeholder="Search..." />
    <div id="search-results"></div>
  </div>
  <script src="renderer.js"></script>
</body>
</html>
```

**Step 2: Write CSS**

```css
:root {
  --bg: #ffffff;
  --text: #222222;
  --sidebar-bg: #f5f5f5;
  --border: #dddddd;
  --toolbar-bg: #fafafa;
  --toc-bg: #f9f9f9;
  --search-bg: #f0f0f0;
  --link: #0066cc;
}

[data-theme="dark"] {
  --bg: #1e1e1e;
  --text: #d4d4d4;
  --sidebar-bg: #252526;
  --border: #3c3c3c;
  --toolbar-bg: #2d2d2d;
  --toc-bg: #252526;
  --search-bg: #2d2d2d;
  --link: #4fc1ff;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg);
  color: var(--text);
}

#toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--toolbar-bg);
  border-bottom: 1px solid var(--border);
}

#toolbar button {
  padding: 4px 12px;
  cursor: pointer;
}

#btn-theme { margin-left: auto; }

#app {
  display: flex;
  flex: 1;
  overflow: hidden;
}

#sidebar {
  width: 220px;
  min-width: 150px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  padding: 8px;
}

#sidebar.hidden { display: none; }

#content-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

#content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  line-height: 1.7;
}

#content a { color: var(--link); }

#toc-panel {
  border-top: 1px solid var(--border);
  background: var(--toc-bg);
  max-height: 200px;
  overflow-y: auto;
  padding: 8px 12px;
}

#toc-header {
  font-weight: bold;
  margin-bottom: 6px;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

#toc a {
  display: block;
  color: var(--link);
  text-decoration: none;
  font-size: 0.85rem;
  padding: 2px 0;
}

#toc a:hover { text-decoration: underline; }

#toc .toc-h3 { padding-left: 16px; }
#toc .toc-h4 { padding-left: 32px; }

#search-bar {
  background: var(--search-bg);
  border-top: 1px solid var(--border);
  padding: 8px 12px;
}

#search-input {
  width: 100%;
  padding: 4px 8px;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
}

#search-results {
  font-size: 0.82rem;
  margin-top: 4px;
  max-height: 120px;
  overflow-y: auto;
}

#file-tree ul { list-style: none; padding-left: 12px; }
#file-tree li { cursor: pointer; padding: 2px 4px; font-size: 0.88rem; }
#file-tree li:hover { background: var(--border); }
#file-tree li.active { font-weight: bold; }

/* Syntax highlighting overrides for dark mode */
[data-theme="dark"] #hljs-theme { display: none; }
```

**Step 3: Verify layout looks correct**

```bash
npm start
```
Expected: Window shows toolbar, empty sidebar (hidden), content area, TOC panel, search bar. No JS errors in DevTools (Cmd+Option+I).

**Step 4: Commit**

```bash
git add src/renderer/index.html src/renderer/style.css
git commit -m "feat: add UI layout HTML and CSS"
```

---

### Task 3: Markdown Rendering Module (TDD)

**Files:**
- Create: `src/renderer/markdown.js`
- Create: `tests/markdown.test.js`

**Step 1: Write the failing tests**

Create `tests/markdown.test.js`:
```js
const { renderMarkdown } = require('../src/renderer/markdown');

test('renders heading', () => {
  const html = renderMarkdown('# Hello');
  expect(html).toContain('<h1');
  expect(html).toContain('Hello');
});

test('renders bold text', () => {
  const html = renderMarkdown('**bold**');
  expect(html).toContain('<strong>bold</strong>');
});

test('renders code block with language class', () => {
  const html = renderMarkdown('```js\nconst x = 1;\n```');
  expect(html).toContain('class="language-js"');
});

test('renders link', () => {
  const html = renderMarkdown('[text](https://example.com)');
  expect(html).toContain('<a href="https://example.com"');
  expect(html).toContain('text</a>');
});

test('heading has id attribute for anchor links', () => {
  const html = renderMarkdown('## My Section');
  expect(html).toMatch(/id="[^"]+"/);
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- tests/markdown.test.js
```
Expected: FAIL — "Cannot find module '../src/renderer/markdown'"

**Step 3: Implement markdown.js**

Create `src/renderer/markdown.js`:
```js
const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const hljs = require('highlight.js');

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre><code class="language-${lang} hljs">${
          hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
        }</code></pre>`;
      } catch (_) {}
    }
    return `<pre><code class="hljs">${md.utils.escapeHtml(code)}</code></pre>`;
  },
});

md.use(markdownItAnchor, { slugify: (s) => s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') });

function renderMarkdown(text) {
  return md.render(text);
}

module.exports = { renderMarkdown };
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- tests/markdown.test.js
```
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/renderer/markdown.js tests/markdown.test.js
git commit -m "feat: add markdown-it rendering module with tests"
```

---

### Task 4: TOC Extraction Module (TDD)

**Files:**
- Create: `src/renderer/toc.js`
- Create: `tests/toc.test.js`

**Step 1: Write the failing tests**

Create `tests/toc.test.js`:
```js
const { extractTOC } = require('../src/renderer/toc');

test('extracts h1 and h2 headings', () => {
  const html = '<h1 id="intro">Intro</h1><p>text</p><h2 id="sub">Sub</h2>';
  const toc = extractTOC(html);
  expect(toc).toEqual([
    { level: 1, id: 'intro', text: 'Intro' },
    { level: 2, id: 'sub', text: 'Sub' },
  ]);
});

test('returns empty array when no headings', () => {
  const html = '<p>no headings here</p>';
  expect(extractTOC(html)).toEqual([]);
});

test('skips headings without id', () => {
  const html = '<h2>No ID</h2><h2 id="with-id">With ID</h2>';
  const toc = extractTOC(html);
  expect(toc).toEqual([{ level: 2, id: 'with-id', text: 'With ID' }]);
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- tests/toc.test.js
```
Expected: FAIL — "Cannot find module"

**Step 3: Implement toc.js**

Create `src/renderer/toc.js`:
```js
function extractTOC(html) {
  const matches = [...html.matchAll(/<h([1-4])[^>]*id="([^"]+)"[^>]*>(.*?)<\/h\1>/gi)];
  return matches.map((m) => ({
    level: parseInt(m[1], 10),
    id: m[2],
    text: m[3].replace(/<[^>]+>/g, ''),
  }));
}

module.exports = { extractTOC };
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- tests/toc.test.js
```
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/renderer/toc.js tests/toc.test.js
git commit -m "feat: add TOC extraction module with tests"
```

---

### Task 5: File Tree Module (TDD)

**Files:**
- Create: `src/renderer/filetree.js`
- Create: `tests/filetree.test.js`

**Step 1: Write the failing tests**

Create `tests/filetree.test.js`:
```js
const { buildFileTree, renderFileTree } = require('../src/renderer/filetree');

test('builds flat list of md files', () => {
  const paths = ['/root/a.md', '/root/b.md'];
  const tree = buildFileTree(paths, '/root');
  expect(tree).toEqual([
    { name: 'a.md', path: '/root/a.md', children: null },
    { name: 'b.md', path: '/root/b.md', children: null },
  ]);
});

test('builds nested tree with folder', () => {
  const paths = ['/root/a.md', '/root/docs/b.md'];
  const tree = buildFileTree(paths, '/root');
  expect(tree).toEqual([
    { name: 'a.md', path: '/root/a.md', children: null },
    {
      name: 'docs',
      path: '/root/docs',
      children: [{ name: 'b.md', path: '/root/docs/b.md', children: null }],
    },
  ]);
});

test('renderFileTree returns HTML string', () => {
  const tree = [{ name: 'a.md', path: '/root/a.md', children: null }];
  const html = renderFileTree(tree);
  expect(html).toContain('a.md');
  expect(html).toContain('<ul>');
  expect(html).toContain('data-path="/root/a.md"');
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- tests/filetree.test.js
```
Expected: FAIL — "Cannot find module"

**Step 3: Implement filetree.js**

Create `src/renderer/filetree.js`:
```js
const path = require('path');

function buildFileTree(filePaths, rootDir) {
  const tree = [];
  const dirMap = new Map();

  for (const filePath of filePaths) {
    const rel = path.relative(rootDir, filePath);
    const parts = rel.split(path.sep);

    if (parts.length === 1) {
      tree.push({ name: parts[0], path: filePath, children: null });
    } else {
      const dirName = parts[0];
      const dirPath = path.join(rootDir, dirName);
      if (!dirMap.has(dirName)) {
        const node = { name: dirName, path: dirPath, children: [] };
        dirMap.set(dirName, node);
        tree.push(node);
      }
      dirMap.get(dirName).children.push({
        name: parts.slice(1).join(path.sep),
        path: filePath,
        children: null,
      });
    }
  }

  return tree;
}

function renderFileTree(nodes) {
  const items = nodes.map((node) => {
    if (node.children) {
      return `<li class="folder">${node.name}${renderFileTree(node.children)}</li>`;
    }
    return `<li class="file" data-path="${node.path}">${node.name}</li>`;
  });
  return `<ul>${items.join('')}</ul>`;
}

module.exports = { buildFileTree, renderFileTree };
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- tests/filetree.test.js
```
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/renderer/filetree.js tests/filetree.test.js
git commit -m "feat: add file tree module with tests"
```

---

### Task 6: Search Module (TDD)

**Files:**
- Create: `src/renderer/search.js`
- Create: `tests/search.test.js`

**Step 1: Write the failing tests**

Create `tests/search.test.js`:
```js
const { searchContent, searchFiles } = require('../src/renderer/search');

test('searchContent finds matches with surrounding context', () => {
  const text = 'Hello world\nThis is a test\nAnother line';
  const results = searchContent(text, 'test');
  expect(results).toHaveLength(1);
  expect(results[0].line).toBe(2);
  expect(results[0].text).toContain('test');
});

test('searchContent is case-insensitive', () => {
  const results = searchContent('Hello World', 'hello');
  expect(results).toHaveLength(1);
});

test('searchContent returns empty when no match', () => {
  expect(searchContent('Hello world', 'xyz')).toEqual([]);
});

test('searchFiles searches across multiple files', () => {
  const files = [
    { path: '/a.md', content: 'Hello world' },
    { path: '/b.md', content: 'No match here' },
    { path: '/c.md', content: 'Hello again' },
  ];
  const results = searchFiles(files, 'hello');
  expect(results).toHaveLength(2);
  expect(results.map((r) => r.path)).toEqual(['/a.md', '/c.md']);
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- tests/search.test.js
```
Expected: FAIL — "Cannot find module"

**Step 3: Implement search.js**

Create `src/renderer/search.js`:
```js
function searchContent(text, query) {
  if (!query) return [];
  const lines = text.split('\n');
  const lowerQuery = query.toLowerCase();
  const results = [];
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes(lowerQuery)) {
      results.push({ line: idx + 1, text: line.trim() });
    }
  });
  return results;
}

function searchFiles(files, query) {
  return files
    .map(({ path, content }) => {
      const matches = searchContent(content, query);
      return matches.length > 0 ? { path, matches } : null;
    })
    .filter(Boolean);
}

module.exports = { searchContent, searchFiles };
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- tests/search.test.js
```
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/renderer/search.js tests/search.test.js
git commit -m "feat: add search module with tests"
```

---

### Task 7: IPC — Open File

**Files:**
- Modify: `src/main.js`
- Modify: `src/preload.js`
- Modify: `src/renderer/renderer.js`

**Step 1: Add IPC handler to main.js**

Replace `src/main.js` with:
```js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
}

ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  return { filePath, content };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
```

**Step 2: Expose IPC in preload.js**

Replace `src/preload.js` with:
```js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openFile: () => ipcRenderer.invoke('open-file'),
});
```

**Step 3: Wire up Open File button in renderer.js**

```js
const { renderMarkdown } = require('./markdown');
const { extractTOC } = require('./toc');

let currentContent = '';
let currentFilePath = null;

function renderAndDisplay(content) {
  currentContent = content;
  const html = renderMarkdown(content);
  document.getElementById('content').innerHTML = html;
  renderTOC(html);
}

function renderTOC(html) {
  const { extractTOC } = require('./toc');
  const items = extractTOC(html);
  const tocEl = document.getElementById('toc');
  tocEl.innerHTML = items
    .map((item) => `<a class="toc-h${item.level}" href="#${item.id}">${item.text}</a>`)
    .join('');
}

document.getElementById('btn-open-file').addEventListener('click', async () => {
  const result = await window.api.openFile();
  if (!result) return;
  currentFilePath = result.filePath;
  renderAndDisplay(result.content);
  document.getElementById('sidebar').classList.add('hidden');
});
```

**Step 4: Verify manually**

```bash
npm start
```
Expected: Click "Open File" → native file picker opens → select a `.md` file → content renders in the main panel.

**Step 5: Commit**

```bash
git add src/main.js src/preload.js src/renderer/renderer.js
git commit -m "feat: implement open file via IPC"
```

---

### Task 8: IPC — Open Folder + File Tree

**Files:**
- Modify: `src/main.js`
- Modify: `src/preload.js`
- Modify: `src/renderer/renderer.js`

**Step 1: Add open-folder IPC handler to main.js**

Add after the `open-file` handler in `src/main.js`:
```js
const { glob } = require('fs');
const pathModule = path;

ipcMain.handle('open-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const folderPath = result.filePaths[0];

  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      const full = pathModule.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(walkDir(full));
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.markdown')) {
        files.push(full);
      }
    }
    return files;
  }

  const files = walkDir(folderPath);
  return { folderPath, files };
});

ipcMain.handle('read-file', async (_event, filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return { filePath, content };
});
```

**Step 2: Expose new IPC methods in preload.js**

```js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openFile: () => ipcRenderer.invoke('open-file'),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
});
```

**Step 3: Wire up folder opening in renderer.js**

Add to `src/renderer/renderer.js`:
```js
const { buildFileTree, renderFileTree } = require('./filetree');

let currentFolder = null;
let folderFiles = [];

document.getElementById('btn-open-folder').addEventListener('click', async () => {
  const result = await window.api.openFolder();
  if (!result) return;
  currentFolder = result.folderPath;
  folderFiles = result.files.map((p) => ({ path: p, content: null }));

  const tree = buildFileTree(result.files, result.folderPath);
  document.getElementById('file-tree').innerHTML = renderFileTree(tree);
  document.getElementById('sidebar').classList.remove('hidden');
});

document.getElementById('file-tree').addEventListener('click', async (e) => {
  const li = e.target.closest('li.file');
  if (!li) return;
  const filePath = li.dataset.path;
  const result = await window.api.readFile(filePath);
  currentFilePath = result.filePath;
  renderAndDisplay(result.content);

  document.querySelectorAll('#file-tree li.active').forEach((el) => el.classList.remove('active'));
  li.classList.add('active');
});
```

**Step 4: Verify manually**

```bash
npm start
```
Expected: Click "Open Folder" → pick a folder with `.md` files → sidebar shows file tree → click a file → content renders.

**Step 5: Commit**

```bash
git add src/main.js src/preload.js src/renderer/renderer.js
git commit -m "feat: implement open folder and file tree sidebar"
```

---

### Task 9: Live Reload

**Files:**
- Modify: `src/main.js`
- Modify: `src/preload.js`
- Modify: `src/renderer/renderer.js`

**Step 1: Add chokidar watcher to main.js**

Add at the top of `src/main.js`:
```js
const chokidar = require('chokidar');
let watcher = null;
```

Add a new IPC handler:
```js
ipcMain.handle('watch-file', (_event, filePath) => {
  if (watcher) watcher.close();
  watcher = chokidar.watch(filePath, { ignoreInitial: true });
  watcher.on('change', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    mainWindow.webContents.send('file-changed', { filePath, content });
  });
});
```

**Step 2: Expose watch-file and file-changed in preload.js**

Add to the `contextBridge.exposeInMainWorld` object:
```js
watchFile: (filePath) => ipcRenderer.invoke('watch-file', filePath),
onFileChanged: (callback) => ipcRenderer.on('file-changed', (_event, data) => callback(data)),
```

**Step 3: Trigger watcher and handle updates in renderer.js**

In the `renderAndDisplay` function, add at the end:
```js
async function renderAndDisplay(content, filePath) {
  currentContent = content;
  const html = renderMarkdown(content);
  const contentEl = document.getElementById('content');
  const scrollTop = contentEl.scrollTop;
  contentEl.innerHTML = html;
  contentEl.scrollTop = scrollTop;
  renderTOC(html);
  if (filePath) {
    currentFilePath = filePath;
    await window.api.watchFile(filePath);
  }
}
```

Register the listener once at startup:
```js
window.api.onFileChanged(({ content }) => {
  renderAndDisplay(content, null);
});
```

Update call sites to pass `filePath`:
```js
// in open-file handler:
renderAndDisplay(result.content, result.filePath);
// in file-tree click handler:
renderAndDisplay(result.content, result.filePath);
```

**Step 4: Verify manually**

```bash
npm start
```
Expected: Open a `.md` file → edit and save it in another editor → content updates in the app without interaction.

**Step 5: Commit**

```bash
git add src/main.js src/preload.js src/renderer/renderer.js
git commit -m "feat: add live reload with chokidar file watcher"
```

---

### Task 10: Dark/Light Mode Toggle

**Files:**
- Modify: `src/renderer/renderer.js`

**Step 1: Add theme toggle logic**

Add to `src/renderer/renderer.js`:
```js
const themeBtn = document.getElementById('btn-theme');
const hljsThemeLink = document.getElementById('hljs-theme');

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeBtn.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  hljsThemeLink.href = theme === 'dark'
    ? '../../node_modules/highlight.js/styles/github-dark.css'
    : '../../node_modules/highlight.js/styles/github.css';
  localStorage.setItem('theme', theme);
}

// Load saved theme
applyTheme(localStorage.getItem('theme') || 'light');

themeBtn.addEventListener('click', () => {
  const current = document.documentElement.dataset.theme;
  applyTheme(current === 'dark' ? 'light' : 'dark');
});
```

**Step 2: Verify manually**

```bash
npm start
```
Expected: Click "Dark Mode" → UI switches to dark theme including code blocks. Theme persists on restart.

**Step 3: Commit**

```bash
git add src/renderer/renderer.js
git commit -m "feat: add dark/light mode toggle with localStorage persistence"
```

---

### Task 11: Search

**Files:**
- Modify: `src/renderer/renderer.js`

**Step 1: Wire up search in renderer.js**

Add to `src/renderer/renderer.js`:
```js
const { searchContent, searchFiles } = require('./search');

const searchInput = document.getElementById('search-input');
const searchResultsEl = document.getElementById('search-results');

searchInput.addEventListener('input', async () => {
  const query = searchInput.value.trim();
  if (!query) {
    searchResultsEl.innerHTML = '';
    return;
  }

  if (currentFolder && folderFiles.length > 0) {
    // Load contents of all files we haven't read yet
    for (const f of folderFiles) {
      if (f.content === null) {
        const res = await window.api.readFile(f.path);
        f.content = res.content;
      }
    }
    const results = searchFiles(folderFiles, query);
    searchResultsEl.innerHTML = results
      .map((r) =>
        `<div><strong data-path="${r.path}" class="search-file-link">${r.path.split('/').pop()}</strong>: ${
          r.matches.map((m) => `<span>L${m.line}: ${m.text}</span>`).join(', ')
        }</div>`
      )
      .join('') || '<em>No results</em>';
  } else if (currentContent) {
    const matches = searchContent(currentContent, query);
    searchResultsEl.innerHTML = matches
      .map((m) => `<div>L${m.line}: ${m.text}</div>`)
      .join('') || '<em>No results</em>';
  }
});

// Click search result file to open it
searchResultsEl.addEventListener('click', async (e) => {
  const link = e.target.closest('.search-file-link');
  if (!link) return;
  const filePath = link.dataset.path;
  const result = await window.api.readFile(filePath);
  renderAndDisplay(result.content, result.filePath);
});
```

**Step 2: Verify manually**

```bash
npm start
```
Expected:
- Single file mode: type in search box → matching lines appear below
- Folder mode: type in search box → matching files and lines appear → click a file name to open it

**Step 3: Run all tests to confirm nothing broken**

```bash
npm test
```
Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/renderer/renderer.js
git commit -m "feat: implement search for single file and folder mode"
```

---

### Task 12: Final Smoke Test & Polish

**Step 1: Run full test suite**

```bash
npm test
```
Expected: All tests PASS

**Step 2: Full manual walkthrough**

```bash
npm start
```

Test each scenario:
1. Open a single `.md` file → renders correctly with syntax highlighting
2. Toggle dark mode → switches theme, persists on restart
3. Open a folder with nested `.md` files → sidebar populates with tree
4. Click files in sidebar → content updates, active file highlighted
5. Edit the open file in another editor → content live-reloads without losing scroll position
6. TOC appears and links scroll to correct heading
7. Search in single file → shows matching lines
8. Search in folder mode → shows matching files, click to open

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete md-viewer v1 — all features verified"
```
