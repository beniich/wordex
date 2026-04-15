// electron/main.ts
import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";

let mainWindow: BrowserWindow;
let lmStudioProc: ChildProcessWithoutNullStreams | null = null;

// ---------------------------------------------------------------------
// 1️⃣  Démarrage du serveur LLM Studio
// ---------------------------------------------------------------------
function launchLlmStudio() {
  const userDataPath = app.getPath("userData");
  const binPath = path.join(__dirname, "..", "external", "llm-studio", "lm-studio");

  const configPath = path.join(userDataPath, "lmstudio_config.yaml");
  // — Vérifier que le binaire existe
  try {
    lmStudioProc = spawn(binPath, ["--port", "11434", "--config", configPath], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    lmStudioProc.stdout?.on("data", (data) => {
      console.log(`[LMStudio] ${data}`);
    });
    lmStudioProc.stderr?.on("data", (data) => {
      console.error(`[LMStudio‑ERR] ${data}`);
    });

    lmStudioProc.on("close", (code) => {
      console.warn(`[LMStudio] exited with code ${code}`);
      lmStudioProc = null;
    });
  } catch (e) {
    dialog.showErrorBox(
      "Erreur LLM Studio",
      `Impossible de lancer le serveur LLM Studio.\n${e}`
    );
  }
}

// ---------------------------------------------------------------------
// 2️⃣  Création de la fenêtre principale (React -> Changed to Lit for current project)
// ---------------------------------------------------------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, // sécurité
      nodeIntegration: false, // sécurité
    },
  });

  const startURL =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../renderer/index.html")}`;

  mainWindow.loadURL(startURL);

  // Fermer proprement le serveur LLM Studio quand l’app se ferme
  mainWindow.on("closed", () => {
    if (lmStudioProc) lmStudioProc.kill();
    mainWindow = null as any;
  });
}

// ---------------------------------------------------------------------
// 3️⃣  IPC – Liste des modèles disponibles
// ---------------------------------------------------------------------
ipcMain.handle("lmstudio:list-models", async () => {
  const userData = app.getPath("userData");
  const configPath = path.join(userData, "lmstudio_config.yaml");
  const yaml = await import("js-yaml");
  const fs = await import("fs/promises");

  const raw = await fs.readFile(configPath, "utf8");
  const cfg = yaml.load(raw) as any;

  // Le dossier `model_dir` défini dans la config
  const modelDir = cfg.model_dir;
  const files = await fs.readdir(modelDir);
  // Filtrer les fichiers *.ggml.bin (ou *.ggml.q4_0.bin, etc.)
  const models = files.filter((f: string) => f.endsWith(".ggml.bin"));
  return models;
});

// ---------------------------------------------------------------------
// 4️⃣  Lancement de l’app
// ---------------------------------------------------------------------
app.whenReady().then(() => {
  launchLlmStudio();     // ← démarre le serveur local sur 127.0.0.1:11434
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
