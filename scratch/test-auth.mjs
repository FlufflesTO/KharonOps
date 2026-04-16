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

  const email = env['GOOGLE_SERVICE_ACCOUNT_EMAIL'];
  const privateKeyRaw = env['GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'];
  const privateKey = envValue(privateKeyRaw, 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');

  console.log('Testing with iat skewed backwards by 60s...');
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now - 60,
    exp: now + 300
  };

  try {
    const assertion = await signJwtNode(claims, privateKey);
    console.log('JWT signed successfully (Node Crypto).');
    
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
      console.log('✅ Auth SUCCESS! Token received.');
    } else {
      console.error('❌ Auth FAILED:', result);
      
      if (result.error_description === 'Invalid JWT Signature.') {
          console.log('\n--- Forensic Check ---');
          console.log('Payload:', JSON.stringify(claims));
          console.log('Header: {"alg":"RS256","typ":"JWT"}');
          
          // Check if the private key looks valid
          try {
              crypto.createSign('RSA-SHA256').update('test').sign(privateKey);
              console.log('Private key is cryptographically valid for signing local data.');
          } catch (e) {
              console.error('Private key is INVALID for local signing:', e.message);
          }
      }
    }
  } catch (err) {
    console.error('💥 Error during test:', err);
  }
}

test();
