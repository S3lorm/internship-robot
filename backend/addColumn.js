require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    console.log('Adding column request_type to letter_requests');
    // Attempt to use postgrest to make a dummy RPC or use Supabase's migration functionality
    // Note: we can't easily alter table natively from js client without raw SQL access
    // Sometimes project has an RPC to run arbitrary sql:
    const { data, error } = await supabase.rpc('run_sql', {
        sql_query: "ALTER TABLE letter_requests ADD COLUMN IF NOT EXISTS request_type VARCHAR(50) DEFAULT 'admin';"
    });

    if (error) {
        console.error('Failed to run rpc:', error);
    } else {
        console.log('Success:', data);
    }
}

run();
