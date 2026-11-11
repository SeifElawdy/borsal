// scripts/analyze-test-image.js
// CLI script to extract and calibrate fabric contour from test images
// Usage: node scripts/analyze-test-image.js TEST1.png

const fs = require('fs');
const path = require('path');
const { extractFabricContour } = require('../src/vision/extractContour');

async function main() {
  const imageName = process.argv[2];
  if (!imageName) {
    console.error('Usage: node scripts/analyze-test-image.js <imageName>');
    console.error('Example: node scripts/analyze-test-image.js TEST1.png');
    process.exit(1);
  }

  const projectRoot = path.resolve(__dirname, '..');
  const markersPath = path.join(projectRoot, 'data', 'test', 'markers.json');
  const imagePath = path.join(projectRoot, 'data', 'test', imageName);
  const debugDir = path.join(projectRoot, 'data', 'debug');

  if (!fs.existsSync(markersPath)) {
    console.error(`Error: Config file not found at ${markersPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(imagePath)) {
    console.error(`Error: Test image not found at ${imagePath}`);
    process.exit(1);
  }

  const markersConfig = JSON.parse(fs.readFileSync(markersPath, 'utf8'));
  const marker = markersConfig[imageName];
  if (!marker) {
    console.error(`Error: No marker configuration found for "${imageName}" in ${markersPath}`);
    process.exit(1);
  }

  console.log(`Processing image: ${imageName}`);
  console.log(`Marker corners:`, marker.markerCornersPx);
  console.log(`Marker size: ${marker.markerSizeCm} cm\n`);

  const imageBuffer = fs.readFileSync(imagePath);
  const result = await extractFabricContour(imageBuffer, marker.markerCornersPx, marker.markerSizeCm);

  console.log('=== EXTRACTION RESULTS ===');
  console.log(`Status: ${result.ok ? 'OK' : 'FAILED'}`);
  console.log('\n--- Stats ---');
  console.log(`Width: ${result.stats.widthCm} cm`);
  console.log(`Height: ${result.stats.heightCm} cm`);
  console.log(`Area: ${result.stats.areaCm2} cm²`);
  console.log(`Scale: ${result.stats.pxPerCmApprox} px/cm`);
  console.log(`Perspective skew: ${result.stats.perspectiveSkew}`);
  console.log(`Contour points (raw): ${result.stats.contourPointsRaw}`);
  console.log(`Contour points (simplified): ${result.stats.contourPointsSimplified}`);
  console.log(`Threshold used: ${result.stats.thresholdUsed} Lab distance units`);
  console.log(`Background Lab: [${result.stats.backgroundLab.join(', ')}]`);

  console.log('\n--- Validation ---');
  console.log(`Valid: ${result.validation.valid}`);
  if (result.validation.errors.length > 0) {
    console.log(`Errors:`);
    for (const err of result.validation.errors) {
      console.log(`  - ${err}`);
    }
  } else {
    console.log(`Errors: none`);
  }

  console.log('\n--- Warnings ---');
  if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      console.log(`  - ${w}`);
    }
  } else {
    console.log(`  None`);
  }

  // Ensure data/debug directory exists
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }

  const baseName = path.parse(imageName).name;
  const maskPath = path.join(debugDir, `${baseName}-mask.png`);
  const overlayPath = path.join(debugDir, `${baseName}-overlay.png`);

  if (result.debug && result.debug.maskPng) {
    fs.writeFileSync(maskPath, result.debug.maskPng);
    console.log(`\nSaved debug mask: ${maskPath}`);
  }
  if (result.debug && result.debug.overlayPng) {
    fs.writeFileSync(overlayPath, result.debug.overlayPng);
    console.log(`Saved debug overlay: ${overlayPath}`);
  }

  if (!result.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal extraction error:', err.message);
  process.exit(1);
});

