const http = require('http');
const dotenv = require('dotenv');
const app = require('./app');
const { sequelize } = require('./models');

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

async function start() {
  if (String(process.env.DB_SYNC).toLowerCase() === 'true') {
    await sequelize.sync({ alter: true });
    console.log('Database synced (alter=true)');
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`RMU Internship API running on port ${PORT}`);
    console.log(`Server accessible at http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

