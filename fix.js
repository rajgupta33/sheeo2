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
            
            // Add favicon if not present
            if (!content.includes('href="/sh-logo.jpeg"')) {
                content = content.replace('<head>', '<head>\n    <link rel="icon" type="image/jpeg" href="/sh-logo.jpeg">');
            }
            
            // Replace email
            content = content.replace(/sadhna@sheeo-summit\.com/g, 'sadhna.attitudesmm@gmail.com');
            
            // If it is apply-directory/index.html, fix the section headings
            if (fullPath.includes('apply-directory') && file === 'index.html') {
                content = content.replace(/Section (\d) — /g, 'Section $1 - ');
            }
            
            fs.writeFileSync(fullPath, content, 'utf8');
        }
    }
}

walkDir(__dirname);
