import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();


const connString = process.env.AZURE_SQL_CONNECTION_STRING;

const parseConnectionString = (str) => {
  const config = {};
  str.split(';').forEach(part => {
    if (part.includes('=')) {
      const [key, value] = part.split('=');
      config[key.trim()] = value.trim();
    }
  });
  return config;
};

const connConfig = parseConnectionString(connString);

const sqlConfig = {
  server: connConfig['Server'].replace('tcp:', '').replace(',1433', ''),
  port: parseInt(connConfig['Server'].match(/,(\d+)/)?.[1] || '1433'),
  database: connConfig['Database'],
  user: connConfig['User ID'],
  password: connConfig['Password'],
  encrypt: connConfig['Encrypt'] === 'true',
  trustServerCertificate: connConfig['TrustServerCertificate'] !== 'true',
  connectionTimeout: 30000, // 30 seconds
};


const pool = await sql.connect(sqlConfig);


console.log('Connected to Azure SQL Database successfully!');

export default pool;
