const fs = require('fs');
const path = require('path');

function fixMojibake(text) {
    return text
        .replace(/â€“/g, '-')
        .replace(/â€”/g, '-')
        .replace(/Â©/g, '©')
        .replace(/â€™/g, "'")
        .replace(/â€œ/g, '"')
        .replace(/â€/g, '"');
}

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
            let fixed = fixMojibake(content);
            if (content !== fixed) {
                fs.writeFileSync(fullPath, fixed, 'utf8');
                console.log(`Fixed ${fullPath}`);
            }
        }
    }
}

walkDir(__dirname);
