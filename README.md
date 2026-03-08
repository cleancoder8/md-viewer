# md-viewer

A fast, lightweight desktop Markdown viewer built with Electron. Open files or entire folders and browse your docs with syntax highlighting, a live table of contents, full-text search, and instant live reload — all in a familiar VSCode-style interface.

![Dark theme](https://img.shields.io/badge/theme-dark%20%7C%20light-1e1e1e?style=flat-square)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-blue?style=flat-square)
![License](https://img.shields.io/badge/license-ISC-green?style=flat-square)

## Features

- **File & folder browsing** — open a single `.md` file or an entire folder and navigate with a VSCode-style file tree
- **Syntax highlighting** — fenced code blocks highlighted via [highlight.js](https://highlightjs.org/)
- **Table of contents** — auto-generated TOC panel that updates as you navigate
- **Full-text search** — search across the current file or all files in an open folder
- **Live reload** — edits made externally are reflected instantly without manual refresh
- **Dark / light theme** — toggle between themes; preference is saved across sessions

## Screenshot

> _Dark theme with file explorer, rendered Markdown, and TOC panel_

## Installation

Download the latest release for your platform from the [Releases](../../releases) page:

| Platform | File |
|----------|------|
| macOS (Apple Silicon + Intel) | `md-viewer-*.dmg` |
| Windows | `md-viewer-*.exe` |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- npm

### Setup

```bash
git clone https://github.com/cleancoder8/md-viewer.git
cd md-viewer
npm install
```

### Run

```bash
npm start
```

### Test

```bash
npm test
```

Tests cover the core pure modules: Markdown rendering, TOC extraction, file tree building, and search.

### Build

```bash
# macOS (.dmg — universal: arm64 + x64)
npm run build:mac

# Windows (.exe — x64 NSIS installer)
npm run build:win

# Both
npm run build:all
```

Output goes to the `dist/` directory.

## Releases

Releases are automated via GitHub Actions. Every push to `master` automatically bumps the version (patch by default), builds for macOS and Windows, and publishes a GitHub Release with the installers attached.

To trigger a release manually with a specific bump type:

1. Go to **Actions → Auto Bump & Release**
2. Click **Run workflow**
3. Select bump type: `patch`, `minor`, or `major`

Version bumping follows [Conventional Commits](https://www.conventionalcommits.org/):

| Commit prefix | Bump |
|---------------|------|
| `fix:` | patch |
| `feat:` | minor |
| `BREAKING CHANGE` | major |

## Project Structure

```
md-viewer/
├── src/
│   ├── main.js          # Electron main process, IPC handlers, file watching
│   ├── preload.js       # Exposes IPC API to renderer
│   └── renderer/
│       ├── index.html   # App shell (VSCode-style layout)
│       ├── style.css    # Dark/light theme, layout
│       ├── renderer.js  # UI logic, panel switching, search, theme toggle
│       ├── markdown.js  # Markdown rendering (markdown-it + highlight.js)
│       ├── toc.js       # TOC extraction
│       ├── filetree.js  # Recursive file tree builder
│       └── search.js    # Content and file search
├── tests/               # Jest unit tests
└── .github/workflows/   # CI/CD — auto build and release
```

## Tech Stack

- [Electron](https://www.electronjs.org/)
- [markdown-it](https://github.com/markdown-it/markdown-it) + [markdown-it-anchor](https://github.com/valeriangalliat/markdown-it-anchor)
- [highlight.js](https://highlightjs.org/)
- [chokidar](https://github.com/paulmillr/chokidar)
- [electron-builder](https://www.electron.build/)

## License

ISC
