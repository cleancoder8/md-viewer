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
        return `<pre class="hljs"><code class="language-${lang}">${
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
