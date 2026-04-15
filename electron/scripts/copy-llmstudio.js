// electron/scripts/copy-llmstudio.js
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', '..', 'external', 'llm-studio', 'lm-studio');
const dest = path.resolve(__dirname, '..', 'dist', 'lm-studio');

// crée le répertoire destination s’il n’existe pas
if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

// Note: If lm-studio is a directory, copy recursively. If it's a file, copy file.
// The install script suggests it's extracted from a tar/zip into external/llm-studio.
// Usually lm-studio is an executable or a folder containing it.

function copyRecursiveSync(src, dest) {
  var exists = fs.existsSync(src);
  var stats = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName),
                        path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  if (fs.existsSync(src)) {
    copyRecursiveSync(src, dest);
    console.log('✅ lm-studio copié dans le répertoire de build');
  } else {
    console.warn('⚠️ Source lm-studio non trouvée à ' + src);
  }
} catch (err) {
  console.error('❌ Erreur lors de la copie de lm-studio:', err);
}
