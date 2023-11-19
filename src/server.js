import { env, exit } from 'node:process';
import { createServer } from 'node:http';

import 'dotenv/config';
import mongoose from 'mongoose';

import app from '#app';
import logger from '#utils/logger';

export default class Server {
  static {
    const server = createServer(app);
    server.on('listening', () => logger.start(`http server started: http://localhost:${server.address().port}/`));
    server.on('close', () => logger.success('http server closed'));

    mongoose.connection.on('connected', () => logger.start('database connected'));
    mongoose.connection.on('close', () => logger.success('database connection closed'));
    this.server = server;
  }

  static async start() {
    try {
      const port = env.PORT || 0;
      await mongoose.connect(env.DB_URI, { autoIndex: false });
      await new Promise((res) => { Server.server.listen({ port }, res); });
    } catch (err) {
      logger.error('Trouble starting server. Exiting application...');
      if (env.NODE_ENV === 'development') logger.error(err);
      exit(1);
    }
  }

  static stop(exitCode) {
    Server.server.closeAllConnections();
    Server.server.close(() => mongoose.connection.close().then(() => exit(exitCode)));
  }
}
