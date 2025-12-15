import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to wait
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function patchReact() {
  // Assets are now in root directory (to avoid Firebase rewrite rule issues)
  const distDir = path.resolve(__dirname, '../dist-mobile/public');

  // Wait for directory to exist (in case build just finished)
  let retries = 10;
  while (retries > 0 && !fs.existsSync(distDir)) {
    await sleep(100);
    retries--;
  }

  if (!fs.existsSync(distDir)) {
    console.error('Public directory does not exist:', distDir);
    process.exit(1);
  }

  // Get all JS files in root (not in subdirectories)
  const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js') && !f.includes('/'));

  // Patch ALL JS files to fix any broken = == patterns
  let totalPatched = 0;
  for (const file of files.filter(f => f.endsWith('.js'))) {
    const filePath = path.join(distDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // CRITICAL FIX: Convert ALL == to === to eliminate parse errors
    // Strategy: Protect multi-char operators, replace ==, then restore
    content = content.replace(/!==/g, '___OP_NEQ___');
    content = content.replace(/===/g, '___OP_SEQ___');
    content = content.replace(/<=/g, '___OP_LE___');
    content = content.replace(/>=/g, '___OP_GE___');
    content = content.replace(/==/g, '===');
    content = content.replace(/___OP_SEQ___/g, '===');
    content = content.replace(/___OP_NEQ___/g, '!==');
    content = content.replace(/___OP_LE___/g, '<=');
    content = content.replace(/___OP_GE___/g, '>=');
    content = content.replace(/\s*=\s*===\s*/g, ' === ');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      const beforeLength = originalContent.length;
      const afterLength = content.length;
      console.log(`Patched ${file} (changed ${afterLength - beforeLength} bytes)`);
      totalPatched++;
    }
  }
  
  // React-specific patching - CRITICAL: Fix .Children = assignments
  // React might be in ANY file (vendor-react, vendor-misc, page-aichat, etc.)
  // Find ALL files that contain React code
  const reactFiles = [];
  for (const file of files.filter(f => f.endsWith('.js'))) {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('react_production_min') && content.includes('function requireReact_production_min()')) {
        reactFiles.push(file);
      }
    }
  }

  if (reactFiles.length > 0) {
    console.log(`Found ${reactFiles.length} React bundle(s): ${reactFiles.join(', ')}`);
    
    // Patch ALL React bundles
    for (const reactFile of reactFiles) {
      const filePath = path.join(distDir, reactFile);
      let content = fs.readFileSync(filePath, 'utf8');
      
      console.log(`Patching React bundle: ${reactFile} (${(content.length / 1024).toFixed(2)} KB)`);
      
      const beforeLength = content.length;
      
      // CRITICAL FIX 1: Ensure react_production_min is initialized BEFORE early return
      const functionStart = content.indexOf('function requireReact_production_min()');
      if (functionStart !== -1) {
        const functionBodyStart = content.indexOf('{', functionStart);
        if (functionBodyStart !== -1) {
          const ifPattern = /if\s*\(\s*hasRequiredReact_production_min\s*\)\s*return\s+react_production_min;/;
          const searchStart = functionBodyStart + 1;
          const ifMatch = content.substring(searchStart).match(ifPattern);
          
          if (ifMatch) {
            const ifStart = searchStart + ifMatch.index;
            const beforeIf = content.substring(searchStart, ifStart);
            
            if (!beforeIf.includes('if (!react_production_min)')) {
              content = content.substring(0, ifStart) + 
                        '  if (!react_production_min) react_production_min = {};\n' +
                        content.substring(ifStart);
            }
          }
        }
      }
      
      // CRITICAL FIX 2: Patch ALL react_production_min property assignments to be safe
      // This includes .Children, .createContext, .useState, etc.
      // Use a simpler approach: replace all react_production_min.PROP = that are NOT already wrapped
      let patchingChanged = true;
      let iterations = 0;
      while (patchingChanged && iterations < 15) {
        const before = content;
        // Match react_production_min.PROPERTY = but skip if already wrapped with ||
        // We check if the line doesn't already have the safe pattern
        content = content.replace(/react_production_min\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g, (match, prop) => {
          // Check if this match is already wrapped (look backwards a bit)
          const matchIndex = content.indexOf(match, before.length - content.length);
          const beforeMatch = content.substring(Math.max(0, matchIndex - 50), matchIndex);
          if (beforeMatch.includes('(react_production_min ||')) {
            return match; // Already patched, skip
          }
          return `(react_production_min || (react_production_min = {})).${prop} =`;
        });
        patchingChanged = (content !== before);
        iterations++;
      }
      
      // CRITICAL FIX 3: Ensure react object is initialized
      const requireReactStart = content.indexOf('function requireReact()');
      if (requireReactStart !== -1) {
        const requireReactBodyStart = content.indexOf('{', requireReactStart);
        if (requireReactBodyStart !== -1) {
          const ifPattern = /if\s*\(\s*hasRequiredReact\s*\)\s*return\s+react\.exports;/;
          const searchStart = requireReactBodyStart + 1;
          const ifMatch = content.substring(searchStart).match(ifPattern);
          
          if (ifMatch) {
            const ifStart = searchStart + ifMatch.index;
            const beforeIf = content.substring(searchStart, ifStart);
            
            if (!beforeIf.includes('if (!react)')) {
              content = content.substring(0, ifStart) + 
                        '  if (!react) react = { exports: {} };\n' +
                        content.substring(ifStart);
            }
          }
        }
      }
      
      // Remove block around react.exports
      content = content.replace(/\{\s*react\.exports\s*=\s*requireReact_production_min\(\);\s*\}/g,
        'react.exports = requireReact_production_min();');
      
      // Fix {}{} pattern
      let fixChanged = true;
      while (fixChanged) {
        const before = content;
        content = content.replace(/var\s+react_production_min\s*=\s*\{\}\{\}/g, 'var react_production_min={}');
        content = content.replace(/react_production_min\s*=\s*\{\}\{\}/g, 'react_production_min={}');
        fixChanged = (content !== before);
      }
      
      if (content.length !== beforeLength) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Patched React bundle: ${reactFile} (changed ${content.length - beforeLength} bytes)`);
      } else {
        console.log(`React bundle: ${reactFile} - no patching needed`);
      }
    }
  } else {
    console.error('React bundle not found. Available files:', files.filter(f => f.includes('vendor') || f.includes('page')).join(', '));
    process.exit(1);
  }
}

// Also fix index.html paths after build
async function fixIndexHtml() {
  const indexPath = path.resolve(__dirname, '../dist-mobile/public/index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    const before = html;
    // Remove /assets/ prefix since assets are now in root
    html = html.replace(/src="\/assets\//g, 'src="/');
    html = html.replace(/href="\/assets\//g, 'href="/');
    // Also remove query parameters that might cause issues
    html = html.replace(/src="([^"]*\.js)\?[^"]*"/g, 'src="$1"');
    html = html.replace(/href="([^"]*\.js)\?[^"]*"/g, 'href="$1"');
    
    // Add cache-busting timestamp to ALL JS files to force CDN refresh
    const timestamp = Date.now();
    html = html.replace(/src="([^"]*\.js)"/g, `src="$1?v=${timestamp}"`);
    html = html.replace(/href="([^"]*\.js)"/g, `href="$1?v=${timestamp}"`);
    
    if (html !== before) {
      fs.writeFileSync(indexPath, html, 'utf8');
      console.log('Fixed index.html asset paths and added cache-busting');
    }
  }
}

patchReact()
  .then(() => fixIndexHtml())
  .catch(err => {
    console.error('Error patching:', err);
    process.exit(1);
  });
