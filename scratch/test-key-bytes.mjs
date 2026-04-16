import fs from 'node:fs';
import crypto from 'node:crypto';

function envValue(val, key) {
  const value = String(val ?? "").trim();
  if (value.includes("\\n") && (key.includes("PRIVATE_KEY") || key.includes("JSON"))) {
    return value.replace(/\\n/g, "\n");
  }
  return value;
}

function pemToArrayBuffer(pem) {
  const normalized = pem.replace(/\\n/g, "\n").trim();
  const body = normalized
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function test() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#\s][^=]*)\s*=\s*(.*)$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      env[key] = value;
    }
  });

  const privateKeyRaw = env['GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'];
  const privateKey = envValue(privateKeyRaw, 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');

  const bytes = pemToArrayBuffer(privateKey);
  const uint8 = new Uint8Array(bytes);
  
  console.log('Key Hex (first 10 bytes):', Array.from(uint8.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' '));
  console.log('Key length:', uint8.length);
}

test();
