import fs from 'node:fs';
import crypto from 'node:crypto';

function envValue(val, key) {
  const value = String(val ?? "").trim();
  if (value.includes("\\n") && (key.includes("PRIVATE_KEY") || key.includes("JSON"))) {
    return value.replace(/\\n/g, "\n");
  }
  return value;
}

function toBase64Url(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  return Buffer.from(bytes).toString('base64url');
}

async function signJwtNode(claims, privateKeyPem) {
  const header = { alg: "RS256", typ: "JWT" };
  const signingInput = `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(claims))}`;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(privateKeyPem, 'base64url');
  
  return `${signingInput}.${signature}`;
}

const CANDIDATES = [
  'google-service-account@kharonops.iam.gserviceaccount.com',
  'kharon-delegated-user@kharonops.iam.gserviceaccount.com',
  'kharonops@appspot.gserviceaccount.com',
  '653176199946-compute@developer.gserviceaccount.com'
];

async function testCandidate(email, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now - 30,
    exp: now + 300
  };

  try {
    const assertion = await signJwtNode(claims, privateKey);
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion
      })
    });

    const result = await response.json();
    if (response.ok) {
      return { success: true, email };
    } else {
      return { success: false, email, error: result.error_description };
    }
  } catch (err) {
    return { success: false, email, error: err.message };
  }
}

async function main() {
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

  console.log('--- Brute-forcing service account email candidates ---');
  for (const email of CANDIDATES) {
    process.stdout.write(`Testing: ${email} ... `);
    const result = await testCandidate(email, privateKey);
    if (result.success) {
      console.log('✅ MATCH FOUND!');
      process.exit(0);
    } else {
      console.log(`❌ FAILED (${result.error})`);
    }
  }
  console.log('--- No matches found among candidates ---');
}

main();
