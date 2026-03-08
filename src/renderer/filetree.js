const path = require('path');

function buildFileTree(filePaths, rootDir) {
  const root = { children: [] };

  for (const filePath of filePaths) {
    const rel = require('path').relative(rootDir, filePath);
    const parts = rel.split(require('path').sep);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        current.children.push({ name: part, path: filePath, children: null });
      } else {
        let dir = current.children.find((n) => n.name === part && n.children);
        if (!dir) {
          const dirPath = require('path').join(rootDir, parts.slice(0, i + 1).join(require('path').sep));
          dir = { name: part, path: dirPath, children: [] };
          current.children.push(dir);
        }
        current = dir;
      }
    }
  }

  return root.children;
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
