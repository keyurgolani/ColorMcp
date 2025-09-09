/**
 * Fix ES module imports in compiled JavaScript files
 * This script adds .js extensions to relative imports for proper ES module resolution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '..', 'dist');

function fixImportsInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix relative imports that don't have .js extension
  content = content.replace(
    /from\s+['"](\.[^'"]*?)(?<!\.js)['"]/g,
    (match, importPath) => {
      modified = true;
      return match.replace(importPath, importPath + '.js');
    }
  );

  // Fix side-effect imports
  content = content.replace(
    /import\s+['"](\.[^'"]*?)(?<!\.js)['"]/g,
    (match, importPath) => {
      modified = true;
      return match.replace(importPath, importPath + '.js');
    }
  );

  // Fix dynamic imports
  content = content.replace(
    /import\s*\(\s*['"](\.[^'"]*?)(?<!\.js)['"]\s*\)/g,
    (match, importPath) => {
      modified = true;
      return match.replace(importPath, importPath + '.js');
    }
  );

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed imports in: ${path.relative(process.cwd(), filePath)}`);
  }
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist, skipping import fixes.`);
    return;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (item.endsWith('.js')) {
      fixImportsInFile(fullPath);
    }
  }
}

console.log('Fixing ES module imports...');
processDirectory(distDir);
console.log('Import fixes complete.');
