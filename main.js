const appname = 'Axilar';

const { electron, app, Menu, MenuItem, globalShortcut, Tray, nativeImage, Notification, screen, BrowserWindow } = require('electron');
const path = require('node:path');
const Store = require('electron-store');
const { PARAMS, VALUE,  MicaBrowserWindow, IS_WINDOWS_11, WIN10 } = require('mica-electron');
const AutoLaunch = require('auto-launch');
const { autoUpdater } = require('electron-updater');

const store = new Store();
let tray;

// Windows not opened
let popup = null;
let settings = null;
let hoverbar = null;

app.disableHardwareAcceleration();

// Popup (explorer with shortcuts)

function createPopup() {

  if (popup) {
    popup.focus();
    return;
  }

  popup = new MicaBrowserWindow({
    width: 400,
    height: 100,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    skipTaskbar: true, 
    resizable: false, 
    minimizable: false,
    setOpacity: 1.0,
  });

  popup.setAutoTheme();
  popup.setMicaEffect();
  popup.loadFile('.popup/index.html');


  popup.on('move', () => {
    checkWindowPosition(popup);
  }),

  popup.on('closed', () => {
    popup = null;
  })


}

// popup position (if near edge of screen + Multi Screen Support)

function checkWindowPosition(window) {

  let threshold = 20;
  let fadeOpacity = 0.5;
  let windowBounds = window.getBounds();
  
  // Get all connected displays
  let displays = screen.getAllDisplays();

  // Function to calculate intersection area between window and display
  function calculateIntersectionArea(displayBounds) {
    let xOverlap = Math.max(0, Math.min(windowBounds.x + windowBounds.width, displayBounds.x + displayBounds.width) - Math.max(windowBounds.x, displayBounds.x));
    let yOverlap = Math.max(0, Math.min(windowBounds.y + windowBounds.height, displayBounds.y + displayBounds.height) - Math.max(windowBounds.y, displayBounds.y));
    return xOverlap * yOverlap;
  }

  // Find the display with the maximum intersection area with the window
  let currentDisplay = displays.reduce((prev, current) => {
    return (calculateIntersectionArea(current.bounds) > calculateIntersectionArea(prev.bounds)) ? current : prev;
  });

  // Check if the window is near any edge of the current display
  let nearLeftEdge = windowBounds.x - currentDisplay.bounds.x <= threshold;
  let nearRightEdge = currentDisplay.bounds.x + currentDisplay.bounds.width - (windowBounds.x + windowBounds.width) <= threshold;
  let nearTopEdge = windowBounds.y - currentDisplay.bounds.y <= threshold;
  let nearBottomEdge = currentDisplay.bounds.y + currentDisplay.bounds.height - (windowBounds.y + windowBounds.height) <= threshold;

  let nearAnyEdge = nearLeftEdge || nearRightEdge || nearTopEdge || nearBottomEdge;

  if (nearAnyEdge && !nearBottomEdge) {
    window.setOpacity(fadeOpacity);
    //window.setOpacity(0.1);
    hoverbar.show();

    // Near left edge
    if (nearLeftEdge&& !nearTopEdge && !nearBottomEdge) {
      // Perform actions for when the window is near the left edge
      console.log("Near left edge");
      // Example: hoverbar.setPosition(x, y);
    }

    // Near right edge
    if (nearRightEdge && !nearTopEdge && !nearBottomEdge) {
      // Perform actions for when the window is near the right edge
      console.log("Near right edge");
      // Example: hoverbar.setPosition(x, y);
    }

    // Near top edge
    if (nearTopEdge && !nearLeftEdge && !nearRightEdge) {
      // Perform actions for when the window is near the top edge
      console.log("Near top edge");
      // Example: hoverbar.setPosition(x, y);
    }

    // Near bottom edge
    if (nearBottomEdge && !nearLeftEdge && !nearRightEdge) {
      // Perform actions for when the window is near the bottom edge
      console.log("Near bottom edge");
      // Example: hoverbar.setPosition(x, y);
    }

    // Near top and left edge
    if (nearLeftEdge && nearTopEdge) {
      console.log("Near left and top edge");
      // Example: hoverbar.setPosition(x, y);
    }

    // Near top and right edge
    if (nearRightEdge && nearTopEdge) {
      console.log("Near right and top edge");
      // Example: hoverbar.setPosition(x, y);
    }

  } else {
    window.setOpacity(1.0);
    hoverbar.hide();
  }
}

// Hoverbar for popup

function createhoverbar() {
  if (hoverbar) {
    hoverbar.focus();
    return;
  }
  
  hoverbar = new BrowserWindow({
    width: 600,
    height: 600,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    skipTaskbar: true, 
    frame: false,
    resizable: false, 
    transparent: true,
    minimizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  hoverbar.loadFile('.hoverbar/index.html');

  hoverbar.on('closed', () => {
    hoverbar = null;
  });
}


// Marketplace + Settings
 function createSettings() {
  if (settings) {
    settings.focus();
    return;
  }

  settings = new MicaBrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
  });

  settings.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

  settings.setAutoTheme();
  //settings.setDarkTheme();
  //settings.setLightTheme();
  settings.setMicaEffect();

  settings.loadFile('.settings/index.html');

  settings.on('closed', () => {
    settings = null;
  });

}

app.on('ready', () => {
  createPopup();
  createhoverbar();
  hoverbar.hide();

  const shortcut = process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Alt+Shift+I';
  globalShortcut.register(shortcut, () => {
    createSettings();
  });

  showStartupNotification();

  const menu = new Menu();
  menu.append(new MenuItem({
    label: 'Electron',
    submenu: [{
      role: 'help',
      accelerator: shortcut,
      click: () => { createSettings(); }
    }]  
  }));

  Menu.setApplicationMenu(menu);

  setupTray();

});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // app.quit(); // don't quit app, when closing windows
});



// Tray
function setupTray() {
  app.whenReady().then(async () => {
    const icon = nativeImage.createFromPath(path.join(__dirname, 'assets/icons/win/icon.ico')); // Make sure the path is correct
    tray = new Tray(icon);

    const autoLauncher = new AutoLaunch({
      name: appname,
      path: app.getPath('exe'),
    });

    tray.on('click', () => {createPopup();});


    const isAutoLaunchEnabled = await autoLauncher.isEnabled();

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Settings', click: () => { createSettings(); } },
      {
        label: 'Autostart',
        type: 'checkbox',
        checked: isAutoLaunchEnabled,
        click: async (menuItem) => {
          if (menuItem.checked) {
            await autoLauncher.enable();
          } else {
            await autoLauncher.disable();
          }
          console.log(`Autostart is now ${menuItem.checked ? 'enabled' : 'disabled'}`);
        }
      },
      { label: 'Stop', click: () => { app.quit(); } }
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip(appname);

  });
}



// Notification: App started
function showStartupNotification() {
  // Check if the Notification API is supported on the platform
  if (Notification.isSupported()) {
    // Create a new notification
    const notification = new Notification({
      title: appname + ' Started',
      body: appname + ' has started successfully!'
    });

    // Show the notification
    notification.show();
  } else {
    console.log('Notification API is not supported on this platform.');
  }
}



// Auto Updates
autoUpdater.on('update-available', () => {
  const notification = new Notification({
    title: 'Update Available',
    body: 'A new version of the app is available. It will be downloaded in the background.',
  });
  notification.show();
});

autoUpdater.on('update-downloaded', () => {
  const notification = new Notification({
    title: 'Update Ready',
    body: 'A new version of the app has been downloaded. Restart the app to apply the updates.',
  });
  notification.show();
});