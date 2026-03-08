const { renderMarkdown } = require('./markdown');
const { extractTOC } = require('./toc');
const { buildFileTree, renderFileTree } = require('./filetree');

let currentContent = '';
let currentFilePath = null;

function renderTOC(html) {
  const items = extractTOC(html);
  const tocEl = document.getElementById('toc');
  tocEl.innerHTML = items
    .map((item) => `<a class="toc-h${item.level}" href="#${item.id}">${item.text}</a>`)
    .join('');
}

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

window.api.onFileChanged(({ content }) => {
  renderAndDisplay(content, null);
});

let currentFolder = null;
let folderFiles = [];

document.getElementById('btn-open-file').addEventListener('click', async () => {
  const result = await window.api.openFile();
  if (!result) return;
  renderAndDisplay(result.content, result.filePath);
  document.getElementById('sidebar').classList.add('hidden');
});

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
  renderAndDisplay(result.content, result.filePath);

  document.querySelectorAll('#file-tree li.active').forEach((el) => el.classList.remove('active'));
  li.classList.add('active');
});
