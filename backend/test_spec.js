require('dotenv').config();
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wnyxuuckngbqdhdtpmic.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const options = {
    hostname: new URL(SUPABASE_URL).hostname,
    port: 443,
    path: '/rest/v1/',
    method: 'GET',
    headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const spec = JSON.parse(data);
            if (spec.definitions && spec.definitions.letter_requests) {
                console.log("COLUMNS IN letter_requests:", Object.keys(spec.definitions.letter_requests.properties));
            } else {
                console.log("Table letter_requests not found in spec definitions.");
            }

            // Let's also search the whole spec for 'my_date'
            const specString = JSON.stringify(spec, null, 2);
            if (specString.includes('my_date')) {
                console.log("FOUND 'my_date' AT LEAST ONCE IN THE OpenAPI SPEC.");
                // Find rough location by printing context
                const lines = specString.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes('my_date')) {
                        console.log("Context around my_date:");
                        console.log(lines.slice(Math.max(0, i - 10), Math.min(lines.length, i + 10)).join('\n'));
                    }
                }
            } else {
                console.log("Did NOT find 'my_date' in the OpenAPI spec.");
            }
        } catch (err) {
            console.error("Error parsing JSON:", err);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
