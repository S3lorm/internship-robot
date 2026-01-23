const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'rmu_internship';

  const conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await conn.end();
  console.log(`Ensured database exists: ${dbName}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

