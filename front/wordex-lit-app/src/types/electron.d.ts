// front/wordex-lit-app/src/types/electron.d.ts
declare global {
  interface Window {
    electronAPI: {
      listModels: () => Promise<string[]>;
    };
  }
}
export {};
