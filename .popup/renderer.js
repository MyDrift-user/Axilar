const { ipcRenderer, shell } = require('electron');

ipcRenderer.on('directory-contents', (event, files) => {
  const fileList = document.getElementById('file-list');
  files.forEach(file => {
    const listItem = document.createElement('li');
    listItem.textContent = file;
    listItem.addEventListener('click', () => {
      ipcRenderer.send('open-file', file);
    });
    fileList.appendChild(listItem);
  });
});