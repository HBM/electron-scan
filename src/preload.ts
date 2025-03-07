const { contextBridge, ipcRenderer } = require('electron');
const remote = require('@electron/remote');

contextBridge.exposeInMainWorld('electronAPI', {
  desktopCapturer: remote.desktopCapturer,
  dialog: remote.dialog,
  Menu: remote.Menu
});
