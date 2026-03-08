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
