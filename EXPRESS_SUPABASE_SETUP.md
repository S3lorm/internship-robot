# Express Backend with Supabase Setup Guide

Your Express backend now uses Supabase as the database instead of MySQL/Sequelize. Follow these steps to set it up.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm/pnpm installed

## Step 1: Set Up Supabase Database

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Run the migrations in order:
   - Copy and paste `supabase/migrations/001_initial_schema.sql` and run it
   - Copy and paste `supabase/migrations/002_rls_policies.sql` and run it
   - Copy and paste `supabase/migrations/003_functions.sql` and run it

## Step 2: Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy:
   - **Project URL** (under "Project URL")
   - **service_role key** (under "Project API keys" - keep this secret!)

## Step 3: Configure Backend Environment

1. In the `backend/` folder, create a `.env` file (or copy from `.env.example`)
2. Add your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration (SMTP) - Optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="RMU Internship Portal" <your-email@gmail.com>
```

## Step 4: Install Backend Dependencies

```bash
cd backend
npm install
# or
pnpm install
```

## Step 5: Start the Backend Server

```bash
cd backend
npm run dev
# or
pnpm dev
```

The server should start on `http://localhost:5000`

## Step 6: Configure Frontend

Make sure your frontend `.env.local` has:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## What Changed

### ✅ Backend Updates

- **Database**: Now uses Supabase PostgreSQL instead of MySQL
- **ORM**: Replaced Sequelize with Supabase client
- **Models**: All models now use Supabase queries
- **Authentication**: Still uses JWT tokens (same as before)
- **API Routes**: All routes remain the same - no frontend changes needed!

### 📁 New Files

- `backend/config/supabase.js` - Supabase client configuration
- `backend/models/supabase.js` - Supabase model helpers (replaces Sequelize models)
- `backend/.env.example` - Environment variables template

### 🔄 Modified Files

- `backend/models/index.js` - Now exports Supabase models
- `backend/app.js` - Updated to use Supabase connection
- `backend/package.json` - Added `@supabase/supabase-js`, removed `mysql2` and `sequelize`
- `backend/controllers/*` - All controllers now use Supabase models
- `backend/middleware/auth.js` - Updated to use Supabase User model

## API Compatibility

**Good news!** All your API endpoints remain exactly the same:

- `/api/auth/login` - Still works the same
- `/api/auth/register` - Still works the same
- `/api/internships` - Still works the same
- `/api/applications` - Still works the same
- All other endpoints - No changes needed!

The frontend code doesn't need any changes because the API interface is identical.

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in `backend/.env`
- Restart the backend server after adding environment variables

### "Unable to connect to Supabase"
- Check that your Supabase project is active
- Verify the `SUPABASE_URL` is correct
- Make sure you're using the **service_role** key (not the anon key)

### "Table does not exist"
- Make sure you've run all the migration files in Supabase SQL Editor
- Check that the table names match: `user_profiles`, `internships`, `applications`, `notices`, `notifications`

### "Row Level Security policy violation"
- The backend uses the service_role key which bypasses RLS
- If you see RLS errors, check your Supabase RLS policies
- The service_role key should have full access

## Migration Notes

### Removed Dependencies
- `mysql2` - No longer needed
- `sequelize` - Replaced with Supabase client

### New Dependencies
- `@supabase/supabase-js` - Supabase JavaScript client

### Database Schema
The database schema is now managed in Supabase. The migrations are in:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_rls_policies.sql`
- `supabase/migrations/003_functions.sql`

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Run database migrations
3. ✅ Configure backend `.env` file
4. ✅ Install dependencies
5. ✅ Start backend server
6. ✅ Test API endpoints
7. ✅ Create first admin user (via SQL or registration)

## Creating an Admin User

After registering a user, you can make them an admin by running this in Supabase SQL Editor:

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
```

## Support

- [Supabase Documentation](https://supabase.com/docs)
- Check the main `SUPABASE_SETUP.md` for database setup details

