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
let options = null;
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

// Check where the taskbar is

function getTaskbarPosition() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { bounds, workArea } = primaryDisplay;

  if (workArea.y > 0) return 'top';
  if (workArea.x > 0) return 'left';
  if (workArea.height < bounds.height) return 'bottom';
  if (workArea.width < bounds.width) return 'right';
  return 'unknown';
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

  if (nearAnyEdge) {
    //window.setOpacity(0.1);
    //console.log(getTaskbarPosition());
    let hoverbarPosition = { x: 0, y: 0 };
    

    // Near left edge
    if (nearLeftEdge && !nearTopEdge && !nearBottomEdge && getTaskbarPosition() !== 'left') {
      window.setOpacity(fadeOpacity);
      hoverbar.show();
      console.log("Near left edge");

      hoverbarPosition.x = currentDisplay.bounds.x;
      hoverbarPosition.y = windowBounds.y;

      hoverbar.setResizable(true);
      hoverbar.setSize(5, 100);
      hoverbar.setResizable(false);
    }

    // Near right edge
    if (nearRightEdge && !nearTopEdge && !nearBottomEdge && getTaskbarPosition() !== 'right') {
      window.setOpacity(fadeOpacity);
      hoverbar.show();
      console.log("Near right edge");

      hoverbarPosition.x = currentDisplay.bounds.x + currentDisplay.bounds.width - hoverbar.getBounds().width;
      hoverbarPosition.y = windowBounds.y;

      hoverbar.setResizable(true);
      hoverbar.setSize(5, 100);
      hoverbar.setResizable(false);
    }

    // Near top edge
    if (nearTopEdge && getTaskbarPosition() !== 'top') {
      window.setOpacity(fadeOpacity);
      hoverbar.show();

      hoverbarPosition.y = currentDisplay.bounds.y;

      if (!nearLeftEdge && !nearRightEdge) {
        console.log("Near top edge");
        hoverbarPosition.x = windowBounds.x;

        hoverbar.setResizable(true);
        hoverbar.setSize(400, 5);
        hoverbar.setResizable(false);

      } else if (nearLeftEdge) {
        console.log("Near top left");
        hoverbarPosition.x = currentDisplay.bounds.x;

        hoverbar.setResizable(true);
        hoverbar.setSize(5, 5);
        hoverbar.setResizable(false);

      } else if (nearRightEdge) {
        console.log("Near top right");
        hoverbarPosition.x = currentDisplay.bounds.x + currentDisplay.bounds.width - hoverbar.getBounds().width;

        hoverbar.setResizable(true);
        hoverbar.setSize(5, 5);
        hoverbar.setResizable(false);

      }
    }

    // Near bottom edge
    if (nearBottomEdge && getTaskbarPosition() !== 'bottom') {
      window.setOpacity(fadeOpacity);
      hoverbar.show();
      console.log("Near bottom edge");

      hoverbarPosition.y = currentDisplay.bounds.y + currentDisplay.bounds.height - hoverbar.getBounds().height;

      if (!nearLeftEdge && !nearRightEdge) {
        console.log("Near bottom edge");
        hoverbarPosition.x = windowBounds.x;

        hoverbar.setResizable(true);
        hoverbar.setSize(400, 5);
        hoverbar.setResizable(false);

      } else if (nearLeftEdge) {
        console.log("Near bottom left");
        hoverbarPosition.x = currentDisplay.bounds.x;

        hoverbar.setResizable(true);
        hoverbar.setSize(5, 5);
        hoverbar.setResizable(false);

      } else if (nearRightEdge) {
        console.log("Near bottom right");
        hoverbarPosition.x = currentDisplay.bounds.x + currentDisplay.bounds.width - hoverbar.getBounds().width;

        hoverbar.setResizable(true);
        hoverbar.setSize(5, 5);
        hoverbar.setResizable(false);

      }
    }

    hoverbar.setPosition(hoverbarPosition.x, hoverbarPosition.y);

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
    width: 20,
    height: 20,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    skipTaskbar: true, 
    frame: false,
    resizable: false, 
    //transparent: true,
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
 function createOptions() {
  if (options) {
    options.focus();
    return;
  }

  options = new MicaBrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
  });

  options.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

  options.setAutoTheme();
  //options.setDarkTheme();
  //options.setLightTheme();
  options.setMicaEffect();

  options.loadFile('.options/index.html');

  options.on('closed', () => {
    options = null;
  });

}

app.on('ready', () => {
  createPopup();
  createhoverbar();
  hoverbar.hide();

  const shortcut = process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Alt+Shift+I';
  globalShortcut.register(shortcut, () => {
    createOptions();
  });

  showStartupNotification();

  const menu = new Menu();
  menu.append(new MenuItem({
    label: 'Electron',
    submenu: [{
      role: 'help',
      accelerator: shortcut,
      click: () => { createOptions(); }
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
      { label: 'Options', click: () => { createOptions(); } },
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