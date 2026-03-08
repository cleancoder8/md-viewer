const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
}

ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  return { filePath, content };
});

ipcMain.handle('open-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const folderPath = result.filePaths[0];

  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(walkDir(full));
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.markdown')) {
        files.push(full);
      }
    }
    return files;
  }

  const files = walkDir(folderPath);
  return { folderPath, files };
});

ipcMain.handle('read-file', async (_event, filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return { filePath, content };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
