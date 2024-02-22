// Tabs

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

}

// Change Hover color

const { ipcRenderer } = require('electron');

const colorPicker = document.getElementById('hoverbar-color-picker');

colorPicker.addEventListener('change', (event) => {
    const color = event.target.value;
    ipcRenderer.send('color-change', color);
});