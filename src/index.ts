import { app, logger } from '@/server';

import { buildTransporter, initTransporter } from './common/mailSender/mailSenderService';
import { config } from './common/utils/config';
import { connectToMongoDB } from './common/utils/mongodb';

const server = app.listen(config.app.port, () => {
  const { port, host, node_env } = config.app;
  logger.info(`Server (${node_env}) running on port http://${host}:${port}`);
});

connectToMongoDB(config.mongodb.uri)
  .then(() => logger.info('MongoDB connected'))
  .catch((ex) => logger.error(`Error connecting to MongoDB: ${(ex as Error).message}`));

initTransporter(buildTransporter());

const onCloseSignal = () => {
  logger.info('sigint received, shutting down');
  server.close(() => {
    logger.info('server closed');
    process.exit();
  });
  setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
};

process.on('SIGINT', onCloseSignal);
process.on('SIGTERM', onCloseSignal);
