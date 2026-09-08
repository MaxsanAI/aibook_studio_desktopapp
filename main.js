import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// electron-updater is a CommonJS module.
// This safely loads it from an ESM project ("type": "module").
const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  const indexPath = path.join(__dirname, 'dist', 'index.html');

  // Production / packaged application
  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else if (app.isPackaged) {
    // Never fall back to localhost in a packaged application.
    dialog.showErrorBox(
      'AI Write Book - Application Error',
      `The application could not start because the production files are missing.

Missing file:
${indexPath}

Please reinstall the application or install the latest version.`
    );

    app.quit();
    return;
  } else {
    // Development only
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------------------------
// Auto-Updater
// Only active in packaged production builds.
// ---------------------------------------------------------------------------

function sendStatus(status, info) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', {
      status,
      info
    });
  }
}

if (app.isPackaged) {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    sendStatus('checking');
  });

  autoUpdater.on('update-available', (info) => {
    sendStatus('available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    sendStatus('not-available', info);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    sendStatus('downloading', {
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendStatus('downloaded', info);

    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog
        .showMessageBox(mainWindow, {
          type: 'info',
          title: 'Update Ready',
          message:
            'A new version has been downloaded. Restart the app to apply the update.',
          buttons: ['Restart Now', 'Later'],
          defaultId: 0,
          cancelId: 1
        })
        .then((result) => {
          if (result.response === 0) {
            autoUpdater.quitAndInstall();
          }
        })
        .catch(() => {
          // Ignore dialog errors.
        });
    }
  });

  autoUpdater.on('error', (err) => {
    sendStatus('error', {
      message: err?.message || String(err)
    });
  });
}

// ---------------------------------------------------------------------------
// IPC - Auto Update
// ---------------------------------------------------------------------------

ipcMain.handle('check-for-updates', async () => {
  // Never check for updates during development.
  if (!app.isPackaged) {
    return {
      ok: false,
      error: 'Auto-update is only available in the packaged application.'
    };
  }

  try {
    await autoUpdater.checkForUpdates();

    return {
      ok: true
    };
  } catch (err) {
    return {
      ok: false,
      error: err?.message || String(err)
    };
  }
});

ipcMain.handle('install-update', async () => {
  // Never install updates from a development build.
  if (!app.isPackaged) {
    return {
      ok: false,
      error: 'Auto-update is only available in the packaged application.'
    };
  }

  autoUpdater.quitAndInstall();

  return {
    ok: true
  };
});

// ---------------------------------------------------------------------------
// IPC - Application information
// ---------------------------------------------------------------------------

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  createWindow();

  // Auto-update is ONLY executed by packaged production applications.
  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => {
        // Ignore update-check errors.
      });
    }, 3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// ---------------------------------------------------------------------------
// Close application
// ---------------------------------------------------------------------------

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```
