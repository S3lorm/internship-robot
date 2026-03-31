const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../client/public/assets/rmu-crest.webp');
const outputPath = path.join(__dirname, './public/rmu-crest.png');

if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

sharp(inputPath)
  .png()
  .toFile(outputPath)
  .then(() => {
    console.log('Conversion successful: ' + outputPath);
  })
  .catch(err => {
    console.error('Conversion failed:', err);
  });
