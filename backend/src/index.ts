import dotenv from 'dotenv';
import { createApp } from './app.js';
import { getDatabase } from './db/index.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const DB_PATH = process.env.DATABASE_URL || ':memory:';

// Initialize Database and Seed Data
getDatabase(DB_PATH);

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[LegalConnect Gateway] Listening on http://localhost:${PORT}`);
  console.log(`[LegalConnect Gateway] Operating in BCI Rule 36 Compliance Mode`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
