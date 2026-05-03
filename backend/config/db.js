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
let connecting = false;

const buildSqlConfig = () => {
  const connConfig = parseConnectionString(connString);

  if (!connConfig['Server'] || !connConfig['Database'] || !connConfig['User ID'] || !connConfig['Password']) {
    throw new Error('Invalid connection string. Missing required fields.');
  }

  return {
    server: connConfig['Server'].replace('tcp:', '').replace(',1433', ''),
    port: parseInt(connConfig['Server'].match(/,(\d+)/)?.[1] || '1433'),
    database: connConfig['Database'],
    user: connConfig['User ID'],
    password: connConfig['Password'],
    encrypt: true,
    trustServerCertificate: false,
    connectionTimeout: 15000,
    requestTimeout: 30000,
    pool: {
      max: 20,
      min: 2,
      idleTimeoutMillis: 30000,
    },
    options: {
      enableArithAbort: true,
    },
  };
};

const createPool = async () => {
  if (!connString) {
    throw new Error('AZURE_SQL_CONNECTION_STRING not set');
  }

  const sqlConfig = buildSqlConfig();
  const newPool = await sql.connect(sqlConfig);
  console.log('[DB] Connected to Azure SQL successfully');
  return newPool;
};

const recreatePool = async () => {
  if (connecting) return;
  connecting = true;

  if (pool) {
    try { await pool.close(); } catch (e) { }
  }

  try {
    pool = await createPool();
    console.log('[DB] Pool recreated successfully');
  } catch (error) {
    console.error('[DB] Failed to recreate pool:', error.message);
  } finally {
    connecting = false;
  }
};

const initPool = async () => {
  connecting = true;
  try {
    pool = await createPool();
  } catch (error) {
    console.error('[DB] Initial connection failed:', error.message);
  } finally {
    connecting = false;
  }
};

pool = null;
initPool();

const CONNECTION_ERRORS = [
  'ConnectionError', 'ETIMEOUT', 'ECONNREFUSED',
  'ECONNRESET', 'ESOCKET', 'Connection is closed',
  'Connection lost', 'TCP Provider', 'Failed to connect',
];

const isConnectionError = (err) => {
  if (!err) return false;
  const msg = (err.message || '') + (err.code || '');
  return CONNECTION_ERRORS.some(e => msg.includes(e));
};

const requestWithRecovery = async (fn, retries = 1) => {
  try {
    return await fn();
  } catch (err) {
    if (isConnectionError(err) && retries > 0 && !connecting) {
      console.warn(`[DB] Connection error, recovering pool... (${err.message.slice(0, 80)})`);
      await recreatePool();
      if (pool) {
        return await fn();
      }
    }
    throw err;
  }
};

class RequestWrapper {
  constructor() {
    this._inputs = [];
  }

  input(name, ...args) {
    this._inputs.push([name, ...args]);
    return this;
  }

  async query(sql) {
    return requestWithRecovery(async () => {
      const req = pool.request();
      for (const args of this._inputs) {
        req.input(...args);
      }
      return req.query(sql);
    });
  }
}

const dbProxy = new Proxy({}, {
  get(target, prop) {
    if (!pool) {
      throw new Error('Database connection not ready');
    }

    if (prop === 'request') {
      return () => new RequestWrapper();
    }

    if (prop === 'query') {
      return (strings, ...values) => {
        return requestWithRecovery(async () => {
          const req = pool.request();
          values.forEach((v, i) => {
            if (v !== undefined && v !== null) {
              req.input(`p${i}`, v);
            }
          });
          let query = strings[0];
          values.forEach((v, i) => {
            if (v !== undefined && v !== null) {
              query = query.replace(`\${${i}}`, `@p${i}`);
            } else {
              query = query.replace(`\${${i}}`, 'NULL');
            }
          });
          query += strings[values.length] || '';
          return req.query(query);
        });
      };
    }

    if (prop === 'close') {
      return () => pool ? pool.close() : Promise.resolve();
    }
    if (prop === 'recreate') {
      return recreatePool;
    }

    const value = pool[prop];
    if (typeof value === 'function') {
      return value.bind(pool);
    }
    return value;
  },
});

export { dbProxy as default, initPool, recreatePool };
