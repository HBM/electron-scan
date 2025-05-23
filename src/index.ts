// Main process kontrolliert the application lifecycle und verwaltet die system resourcen
// HBK scanning gestartet und rennt in main process
// Sanner entdeckt Gerät und sendet event das von den main process gefangen wird. main process sendet event zum renderer und renderer erhält event und aktualisert UI
// Scann wird von Button im Renderer gestartet/gestoppt und eigentliche HbkScanner Funktionen werden im main process angerufen 
/*
Electron-Hauptprozessdatei
Einrichten des Anwendungsfensters und der IPC
Initialisiert den Gerätescanner
Kommuniziert Scanner-Ereignisse an den Renderer-Prozess
*/

declare const __dirname: string;
declare const require: any;

const electron = require('electron');
const { app, BrowserWindow, session } = electron;
import { ipcMain, type BrowserWindow as BrowserWindowType } from 'electron';
const path = require('path');
const remoteMain = require('@electron/remote/main');
const { initialize, enable } = remoteMain;

import { fileURLToPath } from 'url';

// von Scan-App
export * from './HbkScanner'
export * from './Bonjour'
export * from './UpnpHelper'
export * from './UpnpScanner'
export * from './Scanner'
export type * from './Types'

// HbkScanner Modul verwaltet device discovery/scanning und konfiguration
import { HBKScanner } from './HbkScanner';
import { HBKDEVICE } from './Types';

const inDevelopment = !app.isPackaged || process.env.NODE_ENV === 'development';

initialize();

const electronSquirrelStartup = require('electron-squirrel-startup');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (electronSquirrelStartup) {
  app.quit();
}

// Scanner im modul niveau initialisiert damit es von IPC Handlern angesprochen werden kann 
let scanner: HBKScanner | null = null;

// Electron setup
const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    icon: process.platform === 'win32'
    ? path.join(__dirname, '../src/assets/hbk-logo.ico')  // Windows
    : process.platform === 'darwin'
      ? path.join(__dirname, '../src/assets/hbk-logo.icns') // macOS
      : path.join(__dirname, '../src/assets/hbk-logo.png')  // Linux
  });

  enable(mainWindow.webContents);

  // CSP
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          `script-src 'self'${inDevelopment ? " 'unsafe-eval'" : ""}; ` +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data:; " +
          "connect-src 'self' http://localhost:* ws://localhost:*; " +
          "font-src 'self';"
        ]
      }
    });
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
    // Scanner initialisiert
    initializeScanner(mainWindow);
  });
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorDescription);
  });

  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.executeJavaScript(`
      console.log('DOM ready, testing remote module:');
      try {
        const remote = require('@electron/remote');
        console.log('Remote module loaded:', !!remote);
      } catch (e) {
        console.error('Remote module error:', e);
      }
    `);
  });
};

function initializeScanner(mainWindow: BrowserWindowType) {
  console.log('Initializing HBK Scanner in main process');

  scanner = new HBKScanner();
  
  // Weiterleitung von discovery events an den Renderer
  scanner.addListener(HBKDEVICE, (device) => {
    console.log('Main process: Found HBK device:', device);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('hbk-device-found', device);
    }
  });
  
  // Error events
  scanner.addListener('error', (error) => {
    console.error('Main process: Scanner error:', error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('hbk-scanner-error', error);
    }
  });

  // Device update listener
  scanner.addListener('device-updated' as any, (device) => {
    console.log('Main process: Device updated:', device);
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('hbk-device-updated', device);
    }
  });
  
  // IPC Handlern für scanner kontrolle (events von renderer und renderer anfragen)

  ipcMain.handle('start-scanning', () => {
    console.log('Main process: Starting HBK device scanner');
    scanner?.startScanning();
    mainWindow.webContents.send('scanner-status', 'running');
  });
  
  ipcMain.handle('stop-scanning', () => {
    console.log('Main process: Stopping HBK device scanner');
    scanner?.stopScanning();
    mainWindow.webContents.send('scanner-status', 'stopped');
  });
  
  // Geräte Konfiguration
  ipcMain.handle('configure-device', async (_event, config) => {
    console.log('Main process: Configuring device:', config);
    try {
      const result = scanner?.configureDevice(config);
      console.log('Configuration result:', result);
      return { success: true, result };
    } catch (error: unknown) {
        console.error('Error configuring device:', error);
        if (error instanceof Error) {
          return { success: false, error: error.message };
        }
        return { success: false, error: String(error) };
    }
  });

  mainWindow.webContents.send('scanner-status', 'stopped');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  console.log('Window closed, cleaning up resources...');
  if (scanner) {
    try {
      scanner.stopScanning();
      console.log('Scanner stopped successfully');
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
    scanner = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('SIGINT', () => {
  console.log('Received SIGINT signal. Closing application...');
  if (scanner) {
    try {
      scanner.stopScanning();
    } catch (error) {
      console.error('Failed to stop scanner on SIGINT:', error);
    }
    scanner = null;
  }
  app.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal. Closing application...');
  if (scanner) {
    try {
      scanner.stopScanning();
    } catch (error) {
      console.error('Failed to stop scanner on SIGTERM:', error);
    }
    scanner = null;
  }
  app.exit(0);
});

app.on('before-quit', () => {
  console.log('Preparing to quit application...');
  if (scanner) {
    try {
      scanner.stopScanning();
      console.log('Scanner stopped successfully');
    } catch (error) {
      console.error('Failed to stop scanner before quitting:', error);
    }
    scanner = null;
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.