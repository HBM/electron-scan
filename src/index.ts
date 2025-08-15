// HbkScanner Modul verwaltet device discovery/scanning und konfiguration
import { type ConfigMessage, HBKScanner } from './HbkScanner'
import { HBKDEVICE } from './Types'
import * as path from 'path'
import {
  ipcMain,
  type BrowserWindow as BrowserWindowType,
  app,
  BrowserWindow
} from 'electron'

import { initialize, enable } from '@electron/remote/main'

// von Scan-App
export * from './HbkScanner'
export * from './Bonjour'
export * from './UpnpHelper'
export * from './UpnpScanner'
export * from './Scanner'
export type * from './Types'

// const inDevelopment = !app.isPackaged || process.env.NODE_ENV === 'development'
app.disableHardwareAcceleration()
initialize()

// Scanner im modul niveau initialisiert damit es von IPC Handlern angesprochen werden kann
let scanner: HBKScanner | null = null

// Electron setup
const createWindow = (): void => {
  if (require('electron-squirrel-startup')) app.quit()
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    icon:
      process.platform === 'win32'
        ? path.join(__dirname, '../src/assets/hbk-logo.ico') // Windows
        : process.platform === 'darwin'
          ? path.join(__dirname, '../src/assets/hbk-logo.icns') // macOS
          : path.join(__dirname, '../src/assets/hbk-logo.png') // Linux
  })
  enable(mainWindow.webContents)

  // and load the index.html of the app.
  void mainWindow.loadFile(path.join(__dirname, 'index.html'))

  mainWindow.webContents.on('did-finish-load', () => {
    // Scanner initialisiert
    initializeScanner(mainWindow)
  })

  mainWindow.webContents.on(
    'did-fail-load',
    (event, errorCode, errorDescription) => {
      // eslint-disable-next-line no-console
      console.error('Failed to load:', errorDescription)
    }
  )
}

const initializeScanner = (mainWindow?: BrowserWindowType): void => {
  scanner = new HBKScanner()

  // Weiterleitung von discovery events an den Renderer
  scanner.addListener(HBKDEVICE, (device) => {
    if (mainWindow != null && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('hbk-device-found', device)
    }
  })

  // Start scanning automatically when initialized
  scanner.startScanning()
  mainWindow?.webContents.send('scanner-status', 'running')

  // Error events
  scanner.addListener('error', (error) => {
    if (mainWindow != null && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('hbk-scanner-error', error)
    }
  })

  // IPC Handlern für scanner kontrolle (events von renderer und renderer anfragen)

  ipcMain.handle('start-scanning', () => {
    scanner?.startScanning()
    mainWindow?.webContents.send('scanner-status', 'running')
  })

  ipcMain.handle('stop-scanning', () => {
    scanner?.stopScanning()
    mainWindow?.webContents.send('scanner-status', 'stopped')
  })

  // Geräte Konfiguration
  ipcMain.handle(
    'configure-device',
    (_event, config: ConfigMessage): object => {
      try {
        const result = scanner?.configureDevice(config)
        return { success: true, result }
      } catch (error: unknown) {
        // eslint-disable-next-line no-console
        console.error('Error configuring device:', error)
        if (error instanceof Error) {
          return { success: false, error: error.message }
        }
        return { success: false, error: String(error) }
      }
    }
  )

  mainWindow?.webContents.send('scanner-status', 'stopped')
}

void app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (scanner != null) {
    try {
      scanner.stopScanning()
    } catch (err) {
      console.warn('Error stopping scanner:', err)
    }
    scanner = null
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

process.on('SIGINT', () => {
  if (scanner != null) {
    try {
      scanner.stopScanning()
    } catch (err) {
      console.warn('Error stopping scanner:', err)
    }
    scanner = null
  }
  app.exit(0)
})

process.on('SIGTERM', () => {
  if (scanner != null) {
    try {
      scanner.stopScanning()
    } catch (err) {
      console.warn('Error stopping scanner:', err)
    }
    scanner = null
  }
  app.exit(0)
})

app.on('before-quit', () => {
  if (scanner != null) {
    try {
      scanner.stopScanning()
    } catch (err) {
      console.warn('Error stopping scanner:', err)
    }
    scanner = null
  }
})
