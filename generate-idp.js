// generate-idp.js
const fs = require('fs');
const path = require('path');
const jose = require('jose');

// CHANGE THIS to your public hosting directory URL (No trailing slash)
const ISSUER_URL = 'https://<YOUR_SUBDOMAIN>.github.io/mock-idp';

async function main() {
    // 1. Generate an Asymmetric RSA 2048 Key Pair (with extractable set to true)
    const { publicKey, privateKey } = await jose.generateKeyPair('RS256', {
        modulusLength: 2048,
    	extractable: true, // <-- ADD THIS LINE
    });

    // 2. Export Private Key to a local file (Keep this safe, you use it to sign assertions)
    const privateKeyPem = await jose.exportPKCS8(privateKey);
    fs.writeFileSync('private_key.pem', privateKeyPem);
    console.log('✅ Generated private_key.pem');

    // 3. Export Public Key into a JWKS object format
    const jwk = await jose.exportJWK(publicKey);
    
    // Assign mandatory parameters required by OIDC clients like Azure
    jwk.kid = 'test-key-id-001'; // Unique Key Identifier
    jwk.alg = 'RS256';
    jwk.use = 'sig';

    const jwks = { keys: [jwk] };

    // 4. Create the OIDC OpenID Configuration Metadata
    const openidConfig = {
        issuer: ISSUER_URL,
        jwks_uri: `${ISSUER_URL}/jwks.json`,
        response_types_supported: ["id_token"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"]
    };

    // 5. Build Folder Structure matching OIDC specification
    const wellKnownDir = path.join(__dirname, '.well-known');
    if (!fs.existsSync(wellKnownDir)) fs.mkdirSync(wellKnownDir);

    fs.writeFileSync(path.join(wellKnownDir, 'openid-configuration'), JSON.stringify(openidConfig, null, 2));
    fs.writeFileSync(path.join(__dirname, 'jwks.json'), JSON.stringify(jwks, null, 2));

    console.log('✅ Generated .well-known/openid-configuration');
    console.log('✅ Generated jwks.json');
    console.log('\n🚀 Push the `.well-known` folder and `jwks.json` to your public host.');
}

main().catch(console.error);
