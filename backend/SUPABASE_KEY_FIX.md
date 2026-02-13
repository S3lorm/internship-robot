# Fix "Invalid API key" Error

The error `❌ Supabase query error: Invalid API key` means your Supabase service role key is incorrect or missing.

## How to Fix

### 1. Get Your Supabase Keys

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. You'll see two keys:
   - **anon/public key** - This is NOT what you need
   - **service_role key** - This is what you need (keep it secret!)

### 2. Update Your Backend `.env` File

In `backend/.env`, make sure you have:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:**
- Use the **service_role** key (starts with `eyJ...`)
- NOT the anon/public key
- The service_role key has full database access (bypasses RLS)

### 3. Verify the URL Format

Your `SUPABASE_URL` should look like:
```
https://abcdefghijklmnop.supabase.co
```

NOT:
- `https://supabase.com/...`
- `http://localhost:...`
- Just the project ID

### 4. Restart the Server

After updating `.env`:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### 5. Check for Common Mistakes

- ❌ Using anon key instead of service_role key
- ❌ Extra spaces or quotes around the key
- ❌ Wrong URL format
- ❌ Using `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY`

### Example `.env` File

```env
# Supabase Configuration
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
```

### Still Not Working?

1. **Double-check the key**: Copy it again from Supabase dashboard
2. **Check for hidden characters**: Make sure there are no extra spaces
3. **Verify the project is active**: Make sure your Supabase project isn't paused
4. **Check the URL**: Make sure it matches exactly what's in your Supabase dashboard

### Security Note

⚠️ **Never commit your `.env` file to git!**
- The service_role key has full database access
- Keep it secret and secure
- Only use it server-side (backend), never in frontend code

