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

document.getElementById('hoverbar-color-picker').addEventListener('input', (event) => {
    const newColor = event.target.value;
    window.electron.sendColorUpdate(newColor);
  });

  window.electron.onSetColor((color) => {
  document.getElementById('hoverbar-color-picker').value = color;
});


window.electron.onSetColor((color) => {
    document.getElementById('hoverbar-color-picker').value = color;
  });
  