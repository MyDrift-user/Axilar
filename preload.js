const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  sendColorUpdate: (color) => ipcRenderer.send('update-color', color),
  onSetColor: (callback) => ipcRenderer.on('set-color', (event, color) => callback(color)),
});
