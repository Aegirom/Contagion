import logger from '../config/logger.js';

const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;

  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
    stack: err.stack,
    statusCode,
  });

  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.status(statusCode).json({
    error: err.message || 'Internal server error',
  });
};

export default errorHandler;
