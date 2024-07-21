import { pino } from 'pino';

const logger = pino(
  { name: 'server-logger', level: 'trace', timestamp: pino.stdTimeFunctions.isoTime },
  pino.transport({
    targets: [
      // File log
      {
        target: 'pino/file',
        options: {
          destination: `./app.log`,
          append: false,
        },
      },
      // Console log
      {
        target: 'pino-pretty',
        options: {
          destination: 1,
          colorize: true,
        },
        level: 'trace',
      },
    ],
  })
);

export { logger };
