function searchContent(text, query) {
  if (!query) return [];
  const lines = text.split('\n');
  const lowerQuery = query.toLowerCase();
  const results = [];
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes(lowerQuery)) {
      results.push({ line: idx + 1, text: line.trim() });
    }
  });
  return results;
}

function searchFiles(files, query) {
  return files
    .map(({ path, content }) => {
      const matches = searchContent(content, query);
      return matches.length > 0 ? { path, matches } : null;
    })
    .filter(Boolean);
}

module.exports = { searchContent, searchFiles };
