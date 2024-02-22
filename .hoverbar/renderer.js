const { ipcRenderer } = require('electron');

ipcRenderer.on('color-change', (event, color) => {
    document.body.style.backgroundColor = color;
});