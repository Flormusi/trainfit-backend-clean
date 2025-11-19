import http from 'http';
import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});

// Graceful shutdown
const shutdown = (reason: string) => {
  console.log(`Shutting down server: ${reason}`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});