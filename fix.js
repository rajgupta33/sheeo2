const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== '.git') {
                walkDir(fullPath);
            }
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Replace email
            content = content.replace(/sadhna\.attitudesmm@gmail\.com/g, 'sadhna@sheeo-summit.com');
            
            fs.writeFileSync(fullPath, content, 'utf8');
        }
    }
}

walkDir(__dirname);
