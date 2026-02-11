# Supabase Backend Migration

This project has been migrated from an Express.js/MySQL backend to use **Supabase** as the backend service.

## What Changed

### ✅ Completed

1. **Database**: Migrated from MySQL/Sequelize to Supabase PostgreSQL
2. **Authentication**: Now using Supabase Auth instead of JWT tokens
3. **API Layer**: All API calls now go through Supabase client
4. **Storage**: File uploads (avatars, CVs) now use Supabase Storage
5. **Security**: Row Level Security (RLS) policies implemented
6. **Real-time**: Ready for real-time subscriptions (if needed)

### 📁 New Files

- `lib/supabase/` - Supabase client configuration
  - `client.ts` - Client-side Supabase client
  - `server.ts` - Server-side Supabase client
  - `api.ts` - All API functions using Supabase
  - `middleware.ts` - Next.js middleware for session management
- `supabase/migrations/` - Database migration files
  - `001_initial_schema.sql` - Database tables
  - `002_rls_policies.sql` - Row Level Security policies
  - `003_functions.sql` - Database functions and triggers
  - `004_storage_policies.sql` - Storage bucket policies
- `middleware.ts` - Next.js middleware for auth session refresh
- `SUPABASE_SETUP.md` - Detailed setup instructions
- `.env.example` - Environment variables template

### 🔄 Modified Files

- `contexts/auth-context.tsx` - Updated to use Supabase Auth
- `lib/api.ts` - Now re-exports Supabase API functions
- `package.json` - Added Supabase dependencies

### 🗑️ Deprecated (Can be removed)

- `backend/` folder - The Express.js backend is no longer needed
  - You can keep it for reference or delete it
  - All functionality has been migrated to Supabase

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Set up Supabase**:
   - Follow the detailed guide in `SUPABASE_SETUP.md`
   - Create a Supabase project
   - Run the database migrations
   - Set up storage buckets

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   # Then edit .env.local with your Supabase credentials
   ```

4. **Start development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

## Key Differences from Express Backend

### Authentication
- **Before**: JWT tokens stored in localStorage
- **Now**: Supabase Auth handles sessions automatically
- **Benefit**: Automatic token refresh, better security

### Database Queries
- **Before**: REST API calls to Express backend
- **Now**: Direct Supabase client queries
- **Benefit**: Faster, real-time capable, type-safe

### File Storage
- **Before**: Local file system or Express uploads
- **Now**: Supabase Storage buckets
- **Benefit**: Scalable, CDN-backed, secure

### Security
- **Before**: Manual authorization checks in Express
- **Now**: Row Level Security (RLS) at database level
- **Benefit**: More secure, can't be bypassed

## API Compatibility

The API interface remains the same, so most of your frontend code should work without changes:

```typescript
// These still work the same way
import { authApi, internshipsApi, applicationsApi } from '@/lib/api';

await authApi.login(email, password);
await internshipsApi.getAll();
await applicationsApi.create(formData);
```

## Migration Checklist

- [x] Install Supabase dependencies
- [x] Create database schema
- [x] Set up RLS policies
- [x] Create Supabase API layer
- [x] Update auth context
- [x] Set up storage buckets
- [ ] Run database migrations in Supabase
- [ ] Configure environment variables
- [ ] Test authentication flow
- [ ] Test file uploads
- [ ] Create first admin user
- [ ] Remove old Express backend (optional)

## Next Steps

1. **Set up your Supabase project** (see `SUPABASE_SETUP.md`)
2. **Test the authentication flow**
3. **Verify file uploads work**
4. **Create your first admin user**
5. **Optional**: Remove the old `backend/` folder if you don't need it

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- Check `SUPABASE_SETUP.md` for detailed setup instructions

