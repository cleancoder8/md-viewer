const { ipcRenderer } = require('electron');

window.api = {
  openFile: () => ipcRenderer.invoke('open-file'),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  watchFile: (filePath) => ipcRenderer.invoke('watch-file', filePath),
  onFileChanged: (callback) => {
    ipcRenderer.removeAllListeners('file-changed');
    ipcRenderer.on('file-changed', (_event, data) => callback(data));
  },
};
