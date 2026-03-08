const { renderMarkdown } = require('./markdown');
const { extractTOC }    = require('./toc');
const { buildFileTree, renderFileTree } = require('./filetree');
const { searchContent, searchFiles }    = require('./search');

// ─── State ───────────────────────────────────────────────────────────
let currentContent  = '';
let currentFilePath = null;
let currentFolder   = null;
let folderFiles     = [];

// ─── Helpers ─────────────────────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function basename(p) { return p.split(/[\\/]/).pop(); }

function buildBreadcrumb(filePath) {
  if (!filePath) return '';
  const parts = filePath.split(/[\\/]/);
  return parts.map((part, i) => {
    if (i === parts.length - 1) {
      return `<span class="crumb-last">${escapeHtml(part)}</span>`;
    }
    return `<span class="crumb">${escapeHtml(part)}</span><span class="crumb-sep">›</span>`;
  }).join('');
}

// ─── Render & Display ─────────────────────────────────────────────────
async function renderAndDisplay(content, filePath) {
  currentContent = content;
  const html = renderMarkdown(content);

  // Remove welcome screen if present
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.remove();

  const contentEl = document.getElementById('content');
  const scrollTop = contentEl.scrollTop;
  contentEl.innerHTML = html;
  contentEl.scrollTop = scrollTop;

  // Update TOC
  const items = extractTOC(html);
  document.getElementById('toc').innerHTML = items
    .map(item => `<a class="toc-h${item.level}" href="#${item.id}">${escapeHtml(item.text)}</a>`)
    .join('');

  if (filePath) {
    currentFilePath = filePath;
    const name = basename(filePath);
    document.getElementById('tab-filename').textContent  = name;
    document.getElementById('breadcrumb-path').innerHTML = buildBreadcrumb(filePath);
    document.getElementById('status-file').textContent   = name;
    await window.api.watchFile(filePath);
  }
}

// ─── Live Reload ──────────────────────────────────────────────────────
window.api.onFileChanged(({ content }) => {
  renderAndDisplay(content, null);
});

// ─── Activity Bar — Panel Switching ──────────────────────────────────
document.querySelectorAll('.activity-btn[data-panel]').forEach(btn => {
  btn.addEventListener('click', () => {
    const panelId = 'panel-' + btn.dataset.panel;

    // Toggle: clicking active panel collapses sidebar
    const isActive = btn.classList.contains('active');
    document.querySelectorAll('.activity-btn[data-panel]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

    const sidePanel = document.getElementById('side-panel');
    if (isActive) {
      sidePanel.style.display = 'none';
    } else {
      sidePanel.style.display = '';
      btn.classList.add('active');
      const panel = document.getElementById(panelId);
      if (panel) panel.classList.add('active');
    }
  });
});

// ─── Open File ────────────────────────────────────────────────────────
document.getElementById('btn-open-file').addEventListener('click', async () => {
  const result = await window.api.openFile();
  if (!result) return;
  currentFolder = null;
  folderFiles   = [];
  renderAndDisplay(result.content, result.filePath);
});

// ─── Open Folder ──────────────────────────────────────────────────────
document.getElementById('btn-open-folder').addEventListener('click', async () => {
  const result = await window.api.openFolder();
  if (!result) return;
  currentFolder = result.folderPath;
  folderFiles   = result.files.map(p => ({ path: p, content: null }));

  const tree = buildFileTree(result.files, result.folderPath);
  document.getElementById('file-tree').innerHTML = renderFileTreeWithIcons(tree);
});

// Render file tree with VSCode-style SVG icons
function renderFileTreeWithIcons(nodes, depth = 0) {
  const items = nodes.map(node => {
    if (node.children) {
      return `<li class="folder" title="${escapeHtml(node.path)}">
        <svg viewBox="0 0 16 16" fill="currentColor" class="folder-icon">
          <path d="M14.5 3H7.71l-.85-.85L6.51 2h-5l-.5.5v11l.5.5h13l.5-.5v-10L14.5 3zm-.5 10H2V5h12v8z"/>
        </svg>
        ${escapeHtml(node.name)}
        ${renderFileTreeWithIcons(node.children, depth + 1)}
      </li>`;
    }
    return `<li class="file" data-path="${escapeHtml(node.path)}" title="${escapeHtml(node.path)}">
      <svg viewBox="0 0 16 16" fill="currentColor" class="file-icon">
        <path d="M9.5 1.1l3.4 3.5.1.4V14l-.5.5h-10l-.5-.5V1.5L2.5 1h6.7l.3.1zM9 5h3l-3-3v3zM3 2v12h9V6H8.5L8 5.5V2H3z"/>
      </svg>
      ${escapeHtml(node.name)}
    </li>`;
  });
  return `<ul>${items.join('')}</ul>`;
}

// File tree click
document.getElementById('file-tree').addEventListener('click', async e => {
  const li = e.target.closest('li.file');
  if (!li) return;
  const filePath = li.dataset.path;
  const result = await window.api.readFile(filePath);
  renderAndDisplay(result.content, result.filePath);

  document.querySelectorAll('#file-tree li.active').forEach(el => el.classList.remove('active'));
  li.classList.add('active');
});

// ─── Search ───────────────────────────────────────────────────────────
document.getElementById('search-input').addEventListener('input', async function () {
  const query    = this.value.trim();
  const resultsEl = document.getElementById('search-results');

  if (!query) { resultsEl.innerHTML = ''; return; }

  if (currentFolder && folderFiles.length > 0) {
    for (const f of folderFiles) {
      if (f.content === null) {
        const res = await window.api.readFile(f.path);
        f.content = res.content;
      }
    }
    const results = searchFiles(folderFiles, query);
    if (!results.length) {
      resultsEl.innerHTML = `<div class="search-empty">No results for "${escapeHtml(query)}"</div>`;
      return;
    }
    resultsEl.innerHTML = results.map(r => `
      <div class="search-file-link" data-path="${escapeHtml(r.path)}">${escapeHtml(basename(r.path))}</div>
      ${r.matches.map(m => `
        <div class="search-line" data-path="${escapeHtml(r.path)}">
          <span style="opacity:0.5">${m.line}</span>  ${escapeHtml(m.text)}
        </div>`).join('')}
    `).join('');
  } else if (currentContent) {
    const matches = searchContent(currentContent, query);
    if (!matches.length) {
      resultsEl.innerHTML = `<div class="search-empty">No results for "${escapeHtml(query)}"</div>`;
      return;
    }
    resultsEl.innerHTML = matches.map(m =>
      `<div class="search-line">
        <span style="opacity:0.5">${m.line}</span>  ${escapeHtml(m.text)}
      </div>`
    ).join('');
  }
});

// Click search result to open file
document.getElementById('search-results').addEventListener('click', async e => {
  const el = e.target.closest('[data-path]');
  if (!el) return;
  const result = await window.api.readFile(el.dataset.path);
  renderAndDisplay(result.content, result.filePath);
});

// ─── Theme Toggle ─────────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === 'dark';
  document.getElementById('icon-moon').style.display = isDark ? '' : 'none';
  document.getElementById('icon-sun').style.display  = isDark ? 'none' : '';
  document.getElementById('hljs-theme').href = isDark
    ? '../../node_modules/highlight.js/styles/github-dark.css'
    : '../../node_modules/highlight.js/styles/github.css';
  localStorage.setItem('md-viewer-theme', theme);
}

applyTheme(localStorage.getItem('md-viewer-theme') || 'dark');

document.getElementById('btn-theme').addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});
