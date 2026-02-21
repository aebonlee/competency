/**
 * Extract the SVG infographic from competency-2015.jsp
 * and save it as a standalone SVG file for the React app.
 * Also copies any referenced PNG images that are missing.
 *
 * Run: node scripts/extract-svg.js
 */
const fs = require('fs');
const path = require('path');

const jspPath = path.resolve(__dirname, '../../tomcat/webapps/ROOT/competency-2015.jsp');
const srcImgDir = path.resolve(__dirname, '../../tomcat/webapps/ROOT/img');
const outPath = path.resolve(__dirname, '../public/images/competency-2015.svg');
const destImgDir = path.resolve(__dirname, '../public/images');

const content = fs.readFileSync(jspPath, 'utf-8');

// Extract SVG content (from <svg to </svg>)
const match = content.match(/<svg[\s\S]*?<\/svg>/);
if (!match) {
  console.error('SVG not found in JSP file!');
  process.exit(1);
}

let svg = match[0];

// Replace JSP expressions with static paths
svg = svg.replace(/<%=request\.getContextPath\(\) %>\//g, '/');
// The JSP uses /img/ but our React app uses /images/
svg = svg.replace(/xlink:href="\/img\//g, 'xlink:href="/images/');

// Add XML declaration
const output = '<?xml version="1.0" encoding="utf-8"?>\n' + svg;

fs.writeFileSync(outPath, output, 'utf-8');
console.log(`SVG extracted to ${outPath}`);
console.log(`Size: ${output.length} chars, ${output.split('\n').length} lines`);

// Copy referenced PNG images that don't exist in the destination
const imageRefs = svg.match(/xlink:href="\/images\/([^"]+)"/g) || [];
let copied = 0;
for (const ref of imageRefs) {
  const filename = ref.match(/\/images\/([^"]+)"/)[1];
  const srcFile = path.join(srcImgDir, filename);
  const destFile = path.join(destImgDir, filename);

  if (!fs.existsSync(destFile) && fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, destFile);
    console.log(`  Copied: ${filename}`);
    copied++;
  }
}

if (copied > 0) {
  console.log(`Copied ${copied} missing image(s) to public/images/`);
} else {
  console.log('All referenced images already present.');
}
