const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jolly', {
  search: payload => ipcRenderer.invoke('jolly:search', payload),
  ask: payload => ipcRenderer.invoke('jolly:ask', payload),
  openExternal: url => ipcRenderer.invoke('jolly:openExternal', url)
});
