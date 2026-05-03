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

let pool = null;
let connecting = true;
let connectPromise = null;

const initPool = async () => {
  if (!connString) {
    console.error('AZURE_SQL_CONNECTION_STRING environment variable is not set');
    connecting = false;
    return null;
  }

  const connConfig = parseConnectionString(connString);

  if (!connConfig['Server'] || !connConfig['Database'] || !connConfig['User ID'] || !connConfig['Password']) {
    console.error('Invalid connection string. Missing required fields.');
    connecting = false;
    return null;
  }

  const sqlConfig = {
    server: connConfig['Server'].replace('tcp:', '').replace(',1433', ''),
    port: parseInt(connConfig['Server'].match(/,(\d+)/)?.[1] || '1433'),
    database: connConfig['Database'],
    user: connConfig['User ID'],
    password: connConfig['Password'],
    encrypt: true,
    trustServerCertificate: false,
    connectionTimeout: 5000,
    requestTimeout: 15000,
  };

  try {
    pool = await sql.connect(sqlConfig);
    console.log('Connected to Azure SQL Database successfully!');
  } catch (error) {
    console.error('Failed to connect to Azure SQL Database:', error.message);
    console.log('Server is running but database queries will fail until connection is restored.');
  } finally {
    connecting = false;
  }

  return pool;
};

connectPromise = initPool();

// Allow the server to start while connecting in the background
setTimeout(() => {
  if (connecting) {
    console.log('Database connection is taking longer than expected...');
  }
}, 6000);

export { pool as default, connectPromise, initPool };
