const { renderMarkdown } = require('./markdown');
const { extractTOC } = require('./toc');

let currentContent = '';
let currentFilePath = null;

function renderTOC(html) {
  const items = extractTOC(html);
  const tocEl = document.getElementById('toc');
  tocEl.innerHTML = items
    .map((item) => `<a class="toc-h${item.level}" href="#${item.id}">${item.text}</a>`)
    .join('');
}

function renderAndDisplay(content) {
  currentContent = content;
  const html = renderMarkdown(content);
  document.getElementById('content').innerHTML = html;
  renderTOC(html);
}

document.getElementById('btn-open-file').addEventListener('click', async () => {
  const result = await window.api.openFile();
  if (!result) return;
  currentFilePath = result.filePath;
  renderAndDisplay(result.content);
  document.getElementById('sidebar').classList.add('hidden');
});
