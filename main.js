const appname = 'Axilar';

const { electron, app, Menu, MenuItem, globalShortcut, Tray, nativeImage, Notification, screen, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const Store = require('electron-store');
const { PARAMS, VALUE,  MicaBrowserWindow, IS_WINDOWS_11, WIN10 } = require('mica-electron');
const AutoLaunch = require('auto-launch');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const ini = require('ini');

const { debounce } = require('lodash');

let tray;

const configPath = './config.ini';

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

  // calculate intersection area between window and display
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
    

    if (nearLeftEdge && !nearTopEdge && !nearBottomEdge && getTaskbarPosition() !== 'left') {
      window.setOpacity(fadeOpacity);
      hoverbar.show();
      //console.log("Near left edge");

      hoverbarPosition.x = currentDisplay.bounds.x - hoverbar.getBounds().width / 2;
      hoverbarPosition.y = windowBounds.y;

      hoverbar.setResizable(true);
      hoverbar.setSize(50, 100);
      hoverbar.setResizable(false);
    }

    if (nearRightEdge && !nearTopEdge && !nearBottomEdge && getTaskbarPosition() !== 'right') {
      window.setOpacity(fadeOpacity);
      hoverbar.show();
      //console.log("Near right edge");

      hoverbarPosition.x = currentDisplay.bounds.x + currentDisplay.bounds.width - hoverbar.getBounds().width + hoverbar.getBounds().width / 2;
      hoverbarPosition.y = windowBounds.y;

      hoverbar.setResizable(true);
      hoverbar.setSize(50, 100);
      hoverbar.setResizable(false);
    }

    if (nearTopEdge && getTaskbarPosition() !== 'top') {
      window.setOpacity(fadeOpacity);
      hoverbar.show();

      hoverbarPosition.y = currentDisplay.bounds.y - hoverbar.getBounds().height / 2;

      if (!nearLeftEdge && !nearRightEdge) {
        //console.log("Near top edge");
        hoverbarPosition.x = windowBounds.x;

        hoverbar.setResizable(true);
        hoverbar.setSize(400, 50);
        hoverbar.setResizable(false);

      } else if (nearLeftEdge) {
        //console.log("Near top left");
        hoverbarPosition.x = currentDisplay.bounds.x - hoverbar.getBounds().width / 2;

        hoverbar.setResizable(true);
        hoverbar.setSize(50, 50);
        hoverbar.setResizable(false);

      } else if (nearRightEdge) {
        //console.log("Near top right");
        hoverbarPosition.x = currentDisplay.bounds.x + currentDisplay.bounds.width - hoverbar.getBounds().width + hoverbar.getBounds().width / 2;

        hoverbar.setResizable(true);
        hoverbar.setSize(50, 50);
        hoverbar.setResizable(false);

      }
    }

    if (nearBottomEdge && getTaskbarPosition() !== 'bottom') {
      window.setOpacity(fadeOpacity);
      hoverbar.show();
      //console.log("Near bottom edge");

      hoverbarPosition.y = currentDisplay.bounds.y + currentDisplay.bounds.height - hoverbar.getBounds().height + hoverbar.getBounds().height / 2;

      if (!nearLeftEdge && !nearRightEdge) {
        //console.log("Near bottom edge");
        hoverbarPosition.x = windowBounds.x;

        hoverbar.setResizable(true);
        hoverbar.setSize(400, 50);
        hoverbar.setResizable(false);

      } else if (nearLeftEdge) {
        //console.log("Near bottom left");
        hoverbarPosition.x = currentDisplay.bounds.x - hoverbar.getBounds().width / 2;

        hoverbar.setResizable(true);
        hoverbar.setSize(50, 50);
        hoverbar.setResizable(false);

      } else if (nearRightEdge) {
        //console.log("Near bottom right");
        hoverbarPosition.x = currentDisplay.bounds.x + currentDisplay.bounds.width - hoverbar.getBounds().width + hoverbar.getBounds().width / 2;

        hoverbar.setResizable(true);
        hoverbar.setSize(50, 50);
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

  // update hoverbar properties
  const updateHoverbar = (config) => {
    if (hoverbar && config.hoverbar) { // Check if config.hoverbar is defined
      const hoverbarColor = config.hoverbar.color;
      hoverbar.setBackgroundColor(hoverbarColor);
    }
  };

  // read and apply configuration
  const applyConfig = () => {
    try {
      const configFile = fs.readFileSync(configPath, 'utf-8');
      const config = ini.parse(configFile);
      updateHoverbar(config);
    } catch (error) {
      console.error('Error reading or parsing config file:', error);
    }
  };

  // Debounce applyConfig to prevent rapid successive calls
  const debouncedApplyConfig = debounce(applyConfig, 300);

  hoverbar = new BrowserWindow({
    width: 20,
    height: 20,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    frame: false,
    resizable: false,
    minimizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  hoverbar.loadFile('.hoverbar/index.html');

  hoverbar.on('closed', () => {
    hoverbar = null;
    fs.unwatchFile(configPath);
  });

  applyConfig();

  // Watch for changes in config.ini
  fs.watch(configPath, (eventType, filename) => {
    if (filename) {
      debouncedApplyConfig();
    }
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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  options.webContents.on('did-finish-load', () => {
    // Read the color from config.ini
    const configFilePath = path.join(__dirname, 'config.ini');
    fs.readFile(configFilePath, 'utf-8', (err, data) => {
      if (err) {
        console.error('Error reading config file:', err);
        return;
      }

      // Parse the INI file content
      const config = ini.parse(data);
      
      // Send the color to the renderer process
      options.webContents.send('set-color', config.hoverbar.color);
    });
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

// Save Configurations

ipcMain.on('update-color', (event, newColor) => {
  fs.readFile(configPath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading config file:', err);
      event.reply('update-color-response', 'Failed to read config file');
      return;
    }

    let config = ini.parse(data);

    if (!config.hoverbar) {
      config.hoverbar = {};
    }
    config.hoverbar.color = newColor;

    const newConfigData = ini.stringify(config);

    fs.writeFile(configPath, newConfigData, 'utf-8', (err) => {
      if (err) {
        console.error('Error writing to config file:', err);
        event.reply('update-color-response', 'Failed to write to config file');
        return;
      }

      event.reply('update-color-response', 'Config updated successfully');
    });
  });
});





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
    const icon = nativeImage.createFromPath(path.join(__dirname, 'assets/icons/win/icon.ico'));
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
  // Check if the Notification API is supported
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: appname + ' Started',
      body: appname + ' has started successfully!'
    });
    
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