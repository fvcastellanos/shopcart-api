import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

async function bootstrap(): Promise<void> {
  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(`🚀 shopcart-api escuchando en http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.error(err);
  process.exit(1);
});
