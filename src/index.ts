import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './api/routes';
import config from './config/config';

// Create Express application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API routes
app.use('/api', routes);

// Default route
app.get('/', (_req, res) => {
  res.json({
    name: 'InspectorAI API',
    version: '1.0.0',
    status: 'running',
  });
});

// Start server
const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app; 