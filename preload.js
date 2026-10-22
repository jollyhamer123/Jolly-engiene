const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jolly', {
  fact: () => ipcRenderer.invoke('jolly:fact'),
  search: payload => ipcRenderer.invoke('jolly:search', payload),
  library: payload => ipcRenderer.invoke('jolly:library', payload),
  ask: payload => ipcRenderer.invoke('jolly:ask', payload),
  openExternal: url => ipcRenderer.invoke('jolly:openExternal', url)
});
