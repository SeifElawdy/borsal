// scripts/spike-cloudflare.js
// One-off test script to send a single image generation request to Cloudflare Workers AI

const fs = require('fs');
const path = require('path');

// Step 1: Resolve project paths and ensure required directories exist
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');
const fabricPath = path.join(dataDir, 'fabric.png');
const outputPath = path.join(dataDir, 'output.png');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Step 2: Load environment variables (.env) safely
const envPath = path.join(projectRoot, '.env');
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // If .env is missing or invalid, configuration check below will catch missing variables
  }
} else {
  try {
    require('dotenv').config({ path: envPath });
  } catch {
    // Fallback parser if neither process.loadEnvFile nor dotenv is available
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

// Step 3: Validate configuration
const accountId = process.env.CF_ACCOUNT_ID;
const apiToken = process.env.CF_API_TOKEN;

if (!accountId || !apiToken) {
  console.error('Error: CF_ACCOUNT_ID and/or CF_API_TOKEN are missing in .env');
  process.exit(1);
}

// Safety helper: ensure CF_API_TOKEN is never printed anywhere
function safeLog(text) {
  if (typeof text !== 'string') return text;
  return apiToken ? text.replaceAll(apiToken, '[REDACTED]') : text;
}

// Step 4: Validate required input image
if (!fs.existsSync(fabricPath)) {
  console.error(`Error: Required input image not found at "${fabricPath}".`);
  process.exit(1);
}

// Step 5: Execute the single request
async function run() {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-2-klein-4b`;

  // Read input fabric image and construct multipart FormData
  const fabricBuffer = fs.readFileSync(fabricPath);
  const fabricBlob = new Blob([fabricBuffer], { type: 'image/png' });

  const formData = new FormData();
  formData.append('prompt', 'a small handmade tote bag sewn from the fabric in image 0, studio product photo, white background');
  formData.append('input_image_0', fabricBlob, 'fabric.png');
  formData.append('width', '1024');
  formData.append('height', '1024');

  console.log(`Sending request to Cloudflare Workers AI (@cf/black-forest-labs/flux-2-klein-4b)...`);

  const startTime = Date.now();
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        // Note: Do NOT set Content-Type manually so fetch sets multipart boundary automatically
      },
      body: formData,
    });
  } catch (networkError) {
    console.error('Network request failed:', safeLog(networkError.message));
    process.exit(1);
  }

  const elapsedMs = Date.now() - startTime;
  const contentType = (response.headers.get('content-type') || '').toLowerCase();

  // Log response status, elapsed time, and content-type header
  console.log(`\nHTTP Status: ${response.status} ${response.statusText}`);
  console.log(`Elapsed Time: ${elapsedMs} ms`);
  console.log(`Content-Type: ${contentType || 'none'}`);

  // Print all response headers once (may contain quota / rate limit info)
  console.log('\n--- Response Headers ---');
  for (const [key, value] of response.headers.entries()) {
    console.log(`${key}: ${safeLog(value)}`);
  }
  console.log('------------------------\n');

  // Handle non-2xx status: print full body and exit
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Request failed with status ${response.status}`);
    console.error('Response Body:');
    console.error(safeLog(errorBody));
    process.exit(1);
  }

  // Handle successful response (image bytes or JSON)
  if (contentType.startsWith('image/')) {
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(outputPath, imageBuffer);
  } else {
    const bodyText = await response.text();
    let parsedJson = null;
    try {
      parsedJson = JSON.parse(bodyText);
    } catch {
      // Not valid JSON
    }

    if (parsedJson) {
      const base64Data = parsedJson?.result?.image || parsedJson?.image;
      if (base64Data && typeof base64Data === 'string') {
        const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        const imageBuffer = Buffer.from(cleanBase64, 'base64');
        fs.writeFileSync(outputPath, imageBuffer);
      } else {
        console.error('Error: JSON response did not contain image in result.image or image.');
        console.log('Response body preview (first 500 chars):');
        console.log(safeLog(bodyText.slice(0, 500)));
        process.exit(1);
      }
    } else {
      console.error('Error: Response is neither an image nor JSON.');
      console.log('Response body preview (first 500 chars):');
      console.log(safeLog(bodyText.slice(0, 500)));
      process.exit(1);
    }
  }

  // Print the saved file path and its size in KB
  const stats = fs.statSync(outputPath);
  const sizeKb = (stats.size / 1024).toFixed(2);
  console.log(`Saved output image: ${outputPath} (${sizeKb} KB)`);
}

run();

