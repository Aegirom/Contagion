import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;
let connecting = false;

const buildSqlConfig = () => {
  return {
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT || '1433'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    encrypt: true,
    trustServerCertificate: true,
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
  if (!process.env.DB_SERVER) {
    throw new Error('DB_SERVER not set');
  }

  const sqlConfig = buildSqlConfig();
  const newPool = await sql.connect(sqlConfig);
  console.log('[DB] Connected to AWS RDS successfully');
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
          let query = strings[0];
          for (let i = 0; i < values.length; i++) {
            const v = values[i];
            if (v !== undefined && v !== null) {
              req.input(`p${i}`, v);
              query += `@p${i}`;
            } else {
              query += 'NULL';
            }
            query += strings[i + 1] || '';
          }
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
