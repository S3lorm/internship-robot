## RMU Internship Management System (Backend)

Node.js/Express API for the RMU Internship Portal frontend in `/app`.

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

### Notes

- **DB tables**: set `DB_SYNC=true` in `backend/.env` to auto-create/update tables on boot (development convenience).
- **Auth**: uses JWT in `Authorization: Bearer <token>`.
- **Uploads**: served at `/uploads` (CVs under `uploads/cvs`, avatars under `uploads/avatars`).

