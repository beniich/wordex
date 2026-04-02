const fs = require('fs');
const path = require('path');

const replacements = {
    "text-[#857467]": "text-outline",
    "hover:bg-white/[0.02]": "hover:bg-white/2",
    "group-hover:bg-[#A67B5B]/[0.03]": "group-hover:bg-[#A67B5B]/3",
    "bg-gradient-to-r": "bg-linear-to-r",
    "from-[#894d0d]": "from-primary",
    "border-[#894d0d]/30": "border-primary/30",
    "!bg-[#FF4D4D]": "bg-[#FF4D4D]!",
    "to-[#894d0d]": "to-primary",
    "text-[#894d0d]": "text-primary",
    "w-[1px]": "w-px",
};

function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    
    for (const [old, newStr] of Object.entries(replacements)) {
        newContent = newContent.split(old).join(newStr);
    }
    
    // Also remove <style jsx> blocks because they trigger inline styles warning
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

const baseDir = path.join(__dirname, 'components');
walkSync(baseDir, function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        processFile(filePath);
    }
});
