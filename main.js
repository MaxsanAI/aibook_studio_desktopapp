import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { autoUpdater } from 'electron-updater';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------------------------
// Auto-Updater — works on all platforms (Windows, macOS, Linux)
// electron-updater reads latest.yml / latest-mac.yml / latest-linux.yml
// from the GitHub Releases attached to the latest published release.
// ---------------------------------------------------------------------------

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function sendStatus(status, info) {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status, info });
  }
}

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
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: 'A new version has been downloaded. Restart the app to apply the update.',
    buttons: ['Restart Now', 'Later']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  sendStatus('error', { message: err?.message || String(err) });
});

// IPC handlers so the renderer can manually check for updates or install
ipcMain.handle('check-for-updates', async () => {
  try {
    await autoUpdater.checkForUpdates();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
});

ipcMain.handle('install-update', async () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  createWindow();

  // Check for updates after a short delay so the window loads first.
  // Works in production builds; no-ops in dev (no update channel).
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {
      // Silently ignore in dev or when no update channel is configured
    });
  }, 3000);

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
