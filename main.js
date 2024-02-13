const { app, Menu, MenuItem, globalShortcut, Tray, nativeImage, Notification, screen } = require('electron');
const path = require('node:path');
const Store = require('electron-store');
const { PARAMS, VALUE,  MicaBrowserWindow, IS_WINDOWS_11, WIN10 } = require('mica-electron');
const AutoLaunch = require('auto-launch');
const { autoUpdater } = require('electron-updater');

const store = new Store();
const appname = 'Axilar';
let tray;
let win;
let [windowX, windowY] = win.getPosition();
let [windowWidth, windowHeight] = win.getSize();
let { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;


function createPopup() {
  const popup = new MicaBrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  popup.setAutoTheme();
  //popup.setDarkTheme();
  //popup.setLightTheme();
  popup.setMicaEffect();

  popup.loadFile('.popup/index.html');
  
}

function createSettings() {
  const settings = new MicaBrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  settings.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

  settings.setAutoTheme();
  //settings.setDarkTheme();
  //settings.setLightTheme();
  settings.setMicaEffect();

  settings.loadFile('.settings/index.html');
}



app.on('ready', () => {
  createPopup();

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

function setupTray() {
  app.whenReady().then(async () => {
    const icon = nativeImage.createFromPath(path.join(__dirname, 'assets/icons/win/icon.ico')); // Make sure the path is correct
    tray = new Tray(icon);

    const autoLauncher = new AutoLaunch({
      name: appname,
      path: app.getPath('exe'),
    });

    // Check if autorun is enabled and update the checkbox
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