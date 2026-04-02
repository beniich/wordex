import os
import glob

replacements = {
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
}

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")

base_dir = r"c:\Users\pc gold\projet dash\wordex\front\wordex-app\src\components"
for root, _, files in os.walk(base_dir):
    for file in files:
        if file.endswith((".tsx", ".ts")):
            process_file(os.path.join(root, file))
