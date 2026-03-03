require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

async function setupNoticeReadsTable() {
    console.log('Creating user_notice_reads table via SQL...');

    // Create table and indexes using rpc
    // Note: if rpc is not available for arbitrary sql, this will require the user to run it in the SQL Editor.
    // We will attempt a standard insert first to see if the table magically exists or to prompt creation.
    const sql = `
    CREATE TABLE IF NOT EXISTS public.user_notice_reads (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
      read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, notice_id)
    );
    
    -- Add permissions
    ALTER TABLE public.user_notice_reads ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can create their own read records"
      ON public.user_notice_reads FOR INSERT
      WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can view their own read records"
      ON public.user_notice_reads FOR SELECT
      USING (auth.uid() = user_id);
  `;

    console.log("Since Supabase REST API doesn't allow DDL execution directly without RPC, please run the following SQL in your Supabase SQL Editor:");
    console.log("\n--------------------------------------------------");
    console.log(sql);
    console.log("--------------------------------------------------\n");
}

setupNoticeReadsTable();
