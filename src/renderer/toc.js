function extractTOC(html) {
  const matches = [...html.matchAll(/<h([1-4])[^>]*id="([^"]+)"[^>]*>(.*?)<\/h\1>/gi)];
  return matches.map((m) => ({
    level: parseInt(m[1], 10),
    id: m[2],
    text: m[3].replace(/<[^>]+>/g, ''),
  }));
}

module.exports = { extractTOC };
