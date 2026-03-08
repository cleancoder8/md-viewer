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
