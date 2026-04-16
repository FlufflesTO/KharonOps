import crypto from 'crypto';
import fs from 'fs';

const content = fs.readFileSync('c:/Users/User/KharonOps/KharonOps/.env', 'utf8');
const lines = content.split('\n');
const keyLine = lines.find(l => l.startsWith('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY='));

if (!keyLine) {
    console.error('Key line not found');
    process.exit(1);
}

let keyStr = keyLine.substring('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY='.length);
// Remove quotes if present
if (keyStr.startsWith('"') && keyStr.endsWith('"')) {
    keyStr = keyStr.substring(1, keyStr.length - 1);
}
// Replace \n literals with actual newlines
keyStr = keyStr.replace(/\\n/g, '\n');

console.log('--- KEY START ---');
console.log(keyStr.substring(0, 30) + '...');
console.log('--- KEY END ---');

try {
    const key = crypto.createPrivateKey(keyStr);
    const publicKey = crypto.createPublicKey(key);
    const spkiDer = publicKey.export({ type: 'spki', format: 'der' });
    
    const sha1 = crypto.createHash('sha1').update(spkiDer).digest('hex');
    console.log('FINGERPRINT (SHA1):', sha1);
    
    // Check if it matches any of the IDs provided by user
} catch (e) {
    console.error('Failed to parse key:', e.message);
}
