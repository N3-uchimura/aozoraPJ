/**
 * Logger.ts
 *
 * name：Logger
 * function：Logging operation
 * updated: 2025/03/01
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
  constructor(dirname: string, flg: boolean) {
    // log4js options
    let log4jsOptions;

    // log mode
    if (flg) {
      // home directory path
      const homeDir: string = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"]!;
      // logger dir path
      Logger.loggerDir = path.join(homeDir, "nthree", dirname);
      // Logger config
      const prefix: string = `${dirname}-${(new Date().toJSON().slice(0, 10))}`;
      // set log4js options
      log4jsOptions = {
        appenders: {
          app: { type: 'dateFile', filename: path.join(Logger.loggerDir, `${prefix}.log`) },
          result_raw: {
            type: 'file', filename: path.join(Logger.loggerDir, `${prefix}_debug.log`)
          },
          result: { type: 'logLevelFilter', appender: 'result_raw', level: 'info' },
          out: { type: 'stdout' },
        },
        categories: {
          default: { appenders: ['out', 'result', 'app'], level: 'debug' }
        }
      }
    } else {
      // set log4js options
      log4jsOptions = {
        appenders: {
          out: { type: 'stdout' },
        },
        categories: {
          default: { appenders: ['out'], level: 'trace' }
        }
      }
    }
    // logger config
    log4js.configure(log4jsOptions);
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

  // log debug info
  debug = (message: string) => {
    Logger.logger.debug(message);
  }

  // log trace info
  trace = (message: string) => {
    Logger.logger.trace(message);
  }

  // log error
  error = (e: unknown) => {
    // error
    if (e instanceof Error) {
      // error
      Logger.logger.error(e.message);
    }
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