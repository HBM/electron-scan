declare const __dirname: string;
declare const require: any;

const electron = require('electron');
const { app, BrowserWindow, session } = electron;
import { ipcMain, type BrowserWindow as BrowserWindowType } from 'electron';
const path = require('path');
const remoteMain = require('@electron/remote/main');
const { initialize, enable } = remoteMain;

// von Scan-App
export * from './HbkScanner'
export * from './Bonjour'
export * from './UpnpHelper'
export * from './UpnpScanner'
export * from './Scanner'
export type * from './Types'

import { HBKScanner } from './HbkScanner';
import { HBKDEVICE } from './Types';

initialize();

const electronSquirrelStartup = require('electron-squirrel-startup');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (electronSquirrelStartup) {
  app.quit();
}

// Scanner im modul niveau initialisiert damit es von IPC Handlern angesprochen werden kann 
let scanner: HBKScanner | null = null;

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  enable(mainWindow.webContents);

  // CSP
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["script-src 'self' 'unsafe-inline' 'unsafe-eval'"]
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
  
  // IPC Handlern für scanner kontrolle (events von renderer)
  ipcMain.on('start-scanning', () => {
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
  ipcMain.handle('configure-device', (_event, config) => {
    console.log('Main process: Configuring device:', config);
    scanner?.configureDevice(config);
  });

  // Scanner automatisch anfangen
  scanner.startScanning();
  mainWindow.webContents.send('scanner-status', 'running');
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
  if (scanner) {
    scanner.stopScanning();
    scanner = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.