## RMU Internship Management System (Backend)

Node.js/Express API for the RMU Internship Portal frontend in `/client`.

### Setup

- **Create env file**: copy `backend/env.example` to `backend/.env` and fill in values.
- **Install deps**:

```bash
cd backend
npm install
```

### Create database

Create the database (MySQL must be running, and your `DB_*` creds must be set in `backend/.env`):

```bash
cd backend
npm run db:create
```

### Run

```bash
cd backend
npm run dev
```

The API will run on `http://localhost:5000`.

### IT user management

Use this terminal menu to list users and roles, view one user's details, change passwords,
activate/deactivate accounts, verify email, and deep-delete a user with related records:

```bash
cd backend
npm run user:delete
```

Direct dry-run delete commands are also available, for example:

```bash
npm run user:delete -- --email student@example.com
```

Add `--confirm-delete` only after checking the dry-run summary.

### Run frontend (Next.js app)

In a separate terminal:

```bash
cd client
npm install
npm run dev
```

The frontend will run on `http://localhost:3000`.

### Notes

- **DB tables**: set `DB_SYNC=true` in `backend/.env` to auto-create/update tables on boot (development convenience).
- **Auth**: uses JWT in `Authorization: Bearer <token>`.
- **Uploads**: served at `/uploads` (CVs under `uploads/cvs`, avatars under `uploads/avatars`).

