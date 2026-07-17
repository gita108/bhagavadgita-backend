require('dotenv').config();
const App = require('./src/app');
const logger = require('./src/utils/logger');

async function main() {
  try {
    const app = new App();
    
    // Инициализация приложения
    await app.initialize();
    
    // Запуск сервера
    await app.start();
    
    // Обработка сигналов завершения
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await app.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await app.stop();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start  Server:', error);
    process.exit(1);
  }
}

// Запуск приложения
main();
