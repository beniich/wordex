// electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  listModels: () => ipcRenderer.invoke("lmstudio:list-models"),
});
