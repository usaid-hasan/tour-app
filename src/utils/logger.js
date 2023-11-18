import { env } from 'node:process';

import { createConsola } from 'consola';
import { colorize } from 'consola/utils';

const isDev = env.NODE_ENV === 'development';

export default new class Logger {
  constructor() {
    this.logger = createConsola({
      level: 3,
      fancy: isDev,
      formatOptions: {
        colors: isDev,
        columns: 70,
      },
    });
  }

  static #colored(message, color) {
    return isDev ? colorize(color ?? 'gray', message) : message;
  }

  log(message) {
    this.logger.log(message);
  }

  warn(message) {
    this.logger.warn(message);
  }

  error(err) {
    if (err instanceof Error) this.logger.error(err);
    else this.logger.error(Logger.#colored(err, 'red'));
  }

  info(message) {
    this.logger.info(Logger.#colored(message));
  }

  start(message) {
    this.logger.start(Logger.#colored(message));
  }

  success(message) {
    this.logger.success(Logger.#colored(message));
  }

  box(message) {
    this.logger.box({
      message,
      style: { padding: 0, marginTop: 0, marginBottom: 0, borderColor: 'gray' },
    });
  }
}();
