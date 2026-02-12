const http = require('http');
const dotenv = require('dotenv');
const app = require('./app');

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

async function start() {
  // Database migrations should be run in Supabase dashboard
  // No need to sync here since we're using Supabase

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`RMU Internship API running on port ${PORT}`);
    console.log(`Server accessible at http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
    console.log(`Using Supabase as database backend`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

