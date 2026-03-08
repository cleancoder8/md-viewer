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

test('builds 2-level nested tree', () => {
  const paths = ['/root/docs/api/ref.md'];
  const tree = buildFileTree(paths, '/root');
  expect(tree).toEqual([
    {
      name: 'docs',
      path: '/root/docs',
      children: [
        {
          name: 'api',
          path: '/root/docs/api',
          children: [{ name: 'ref.md', path: '/root/docs/api/ref.md', children: null }],
        },
      ],
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
