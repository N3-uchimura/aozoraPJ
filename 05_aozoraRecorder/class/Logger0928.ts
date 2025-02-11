/**
 * Logger.ts
 *
 * name：Logger
 * function：Logging operation
 * updated: 2024/09/28
 **/

'use strict';

// define modules
import * as log4js from 'log4js' // Logger
import * as path from 'path'; // path

// Logger class
class Logger {

  // logger
  static logger: any;
  // logger dir path
  static loggerDir: string;

  // construnctor
  constructor(dirpath: string) {
    // logger dir path
    Logger.loggerDir = dirpath;
    // Logger config
    const prefix: string = `${(new Date().toJSON().slice(0, 10))}.log`
    // logger config
    log4js.configure({
      appenders: {
        app: { type: 'dateFile', filename: path.join(Logger.loggerDir, prefix) },
        out: { type: 'stdout' },
      },
      categories: {
        default: { appenders: ['out', 'app'], level: 'info' }
      }
    });
    // logger instance
    Logger.logger = log4js.getLogger(); // logger instance
  }

  // logger init
  initialize = (level: string) => {
    Logger.logger.level = level;
  }

  // log info
  info = (message: string) => {
    Logger.logger.info(message);
  }

  // log error
  error = (e: unknown) => {
    // error
    if (e instanceof Error) {
      // error
      Logger.logger.error(e.message);
    }
  }

  // log debug info
  debug = (message: string) => {
    Logger.logger.debug(message);
  }

  // log trace info
  trace = (message: string) => {
    Logger.logger.trace(message);
  }

  // shutdown logger
  exit = () => {
    log4js.shutdown((err: unknown) => {
      if (err) throw err;
      process.exit(0);
    });
  }
}

// export module
export default Logger;