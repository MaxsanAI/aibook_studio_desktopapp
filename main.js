import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// electron-updater is CommonJS.
// Since this project uses ESM ("type": "module"),
// load it safely using Node's createRequire.
const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

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

  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    // In a packaged application, never fall back to localhost.
    if (app.isPackaged) {
      dialog.showErrorBox(
        'Application Error',
        `The application could not start because the production files are missing.\n\nMissing file:\n${indexPath}\n\nPlease reinstall the application.`
      );

      app.quit();
      return;
    }

    // Development mode only.
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------------------------
// Auto-Updater
// Only enabled for packaged production applications.
// ---------------------------------------------------------------------------

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
      total: progressObj.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendStatus('downloaded', info);

    if (mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message:
          'A new version has been downloaded. Restart the app to apply the update.',
        buttons: ['Restart Now', 'Later']
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    }
  });

  autoUpdater.on('error', (err) => {
    sendStatus('error', {
      message: err?.message || String(err)
    });
  });
}

function sendStatus(status, info) {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status, info });
  }
}

// ---------------------------------------------------------------------------
// IPC
// ---------------------------------------------------------------------------

ipcMain.handle('check-for-updates', async () => {
  // Never check for updates in development.
  if (!app.isPackaged) {
    return {
      ok: false,
      error: 'Auto-update is only available in the packaged application.'
    };
  }

  try {
    await autoUpdater.checkForUpdates();

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err?.message || String(err)
    };
  }
});

ipcMain.handle('install-update', async () => {
  if (!app.isPackaged) {
    return {
      ok: false,
      error: 'Auto-update is only available in the packaged application.'
    };
  }

  autoUpdater.quitAndInstall();

  return { ok: true };
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  createWindow();

  // Check for updates ONLY in the packaged production application.
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
