const { contextBridge } = require('electron');
// IPC bindings added in later tasks
contextBridge.exposeInMainWorld('api', {});
