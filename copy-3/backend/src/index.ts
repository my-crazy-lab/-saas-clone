import app from './app';
import config from './config/env';
import prisma from './config/database';
import redis from './config/redis';

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database');

    // Test Redis connection
    await redis.ping();
    console.log('✅ Connected to Redis');

    // Start the server
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`📖 API Documentation: http://localhost:${config.port}/docs`);
      console.log(`🏥 Health Check: http://localhost:${config.port}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        try {
          await prisma.$disconnect();
          console.log('Database connection closed');
          
          redis.disconnect();
          console.log('Redis connection closed');
          
          console.log('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
