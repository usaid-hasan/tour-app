import process from 'node:process';

import Server from "./server.js";
import logger from './utils/logger.js';

await Server.start();

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, (e) => {
    logger.info(`${e} recieved. Shutting down server...`);
    Server.stop(0);
  });
}

for (const error of ['unhandledRejection', 'uncaughtException']) {
  process.on(error, (err) => {
    logger.error(`Error: ${error}. Shutting down server...`);
    if (process.env.NODE_ENV === 'development') logger.error(err);
    Server.stop(1);
  });  
}
