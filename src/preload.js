const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openFile: () => ipcRenderer.invoke('open-file'),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
});
