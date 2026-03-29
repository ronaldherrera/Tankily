import fs from 'fs';
import path from 'path';

const wikiDir = 'd:/Mis Desarrollos/Tankily/WikiTank';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const h1Regex = /^# (SECCIÓN \d+ — |[0-9]+\. )(.*)$/gm;
const h2Regex = /^## [0-9.]+\s+(.*)$/gm;

walkDir(wikiDir, (filePath) => {
  if (path.extname(filePath) === '.md') {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
      .replace(h1Regex, '# $2')
      .replace(h2Regex, '## $1');
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Cleaned: ${filePath}`);
    }
  }
});
