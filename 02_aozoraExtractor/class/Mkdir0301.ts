/**
 * Mkdir.ts
 *
 * name：Mkdir
 * function：Mkdir operation for electron
 * updated: 2025/03/01
 **/

"use strict";

// define modules
import { promises, existsSync } from "fs"; // file system
import Logger from './Logger'; // logger
// file system definition
const { mkdir } = promises;

// Mkdir class
class Mkdir {
  static logger: any; // static logger

  // construnctor
  constructor() {
    // loggeer instance
    Mkdir.logger = new Logger('mkdir', true);
    Mkdir.logger.debug('mkdir: constructed');
  }

  // mkDir
  mkDir = async (dir: string): Promise<void> => {
    return new Promise(async (resolve, _) => {
      try {
        Mkdir.logger.debug('mkDir: mkDir started.');
        // not exists
        if (!existsSync(dir)) {
          // make dir
          await mkdir(dir);
          Mkdir.logger.debug('mkDir: mkDir finished.');
          resolve();
        } else {
          throw Error("mkDir: already exists.");
        }
      } catch (e: unknown) {
        Mkdir.logger.error(e);
        resolve();
      }
    });
  };

  // mkDirAll
  mkDirAll = async (dirs: string[]): Promise<void> => {
    return new Promise(async (resolve1, _) => {
      try {
        Mkdir.logger.debug('mkDir: mkDirAll started.');
        // make all dir
        Promise.all(
          dirs.map(async (dir: string): Promise<void> => {
            return new Promise(async (resolve2, _) => {
              try {
                // not exists
                if (!existsSync(dir)) {
                  // make dir
                  await mkdir(dir);
                  Mkdir.logger.debug('mkDir: mkDirAll finished.');
                  resolve2();
                } else {
                  throw Error("mkDir: already exists.");
                }
              } catch (err: unknown) {
                Mkdir.logger.error(err);
                resolve2();
              }
            });
          })
        ).then(() => resolve1());

        // make dir
      } catch (e: unknown) {
        Mkdir.logger.error(e);
        resolve1();
      }
    });
  };
}

// export module
export default Mkdir;
