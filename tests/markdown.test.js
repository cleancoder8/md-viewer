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
