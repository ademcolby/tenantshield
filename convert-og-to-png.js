// Run this from your project root:
// node convert-og-to-png.js
//
// Requires: npm install sharp (run once)
// Output: public/og-image.png

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'public', 'og-image.svg');
const pngPath = path.join(__dirname, 'public', 'og-image.png');

const svgBuffer = fs.readFileSync(svgPath);

sharp(svgBuffer)
  .resize(1200, 630)
  .png()
  .toFile(pngPath, (err, info) => {
    if (err) {
      console.error('Error converting SVG to PNG:', err);
      process.exit(1);
    }
    console.log('✅ og-image.png created successfully:', info);
  });
