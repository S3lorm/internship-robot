require('dotenv').config();
const supabase = require('./config/supabase');

async function test() {
    const { data, error } = await supabase.from('letter_requests').insert({
        student_id: '123e4567-e89b-12d3-a456-426614174000', // random uuid
        company_name: 'Test',
        internship_duration: '3 months',
        purpose: 'Test'
    });
    console.log('Result:', { data, error });
}

test();
