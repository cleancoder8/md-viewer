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
