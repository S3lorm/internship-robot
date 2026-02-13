# Quick Start Guide

## 1. Install Dependencies

```bash
cd backend
npm install
# or
pnpm install
```

## 2. Set Up Environment Variables

Create a `.env` file in the `backend/` folder:

```env
# Supabase Configuration (REQUIRED)
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration (Optional - for email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="RMU Internship Portal" <your-email@gmail.com>
```

**Important**: You must set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the server to start!

## 3. Start the Backend Server

```bash
npm run dev
# or
pnpm dev
```

You should see:
```
✅ Supabase connection established
RMU Internship API running on port 5000
Server accessible at http://localhost:5000
API endpoints available at http://localhost:5000/api
Using Supabase as database backend
```

## 4. Verify It's Working

Open your browser and go to: http://localhost:5000/api/health

You should see: `{"status":"ok"}`

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure you created `backend/.env` file
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Restart the server after adding environment variables

### "Unable to connect to Supabase"
- Verify your Supabase project is active
- Check that the `SUPABASE_URL` is correct (should be like `https://xxxxx.supabase.co`)
- Make sure you're using the **service_role** key (not the anon key)

### "Port 5000 already in use"
- Change `PORT=5001` in your `.env` file
- Update `NEXT_PUBLIC_API_URL=http://localhost:5001/api` in your frontend `.env.local`

### Backend starts but frontend can't connect
- Check CORS settings in `backend/app.js`
- Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Verify the frontend `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:5000/api`


