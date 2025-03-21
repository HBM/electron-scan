const { contextBridge } = require('electron');
const remote = require('@electron/remote');

contextBridge.exposeInMainWorld('electronAPI', {
  dialog: remote.dialog,
  Menu: remote.Menu
});
