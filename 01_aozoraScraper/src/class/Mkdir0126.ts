/**
 * Mkdir.ts
 *
 * name：Mkdir
 * function：Mkdir operation for electron
 * updated: 2025/01/26
 **/

// define modules
import * as path from 'path'; // path
import { promises, existsSync } from "fs"; // file system
// file system definition
const { mkdir } = promises;

// Mkdir class
class Mkdir {
  // construnctor
  constructor() {
    console.log('mkdir: initialize mode');
  }

  // mkDir
  mkDir = async (dir: string): Promise<void> => {
    return new Promise(async (resolve, _) => {
      try {
        // file path
        const filePath: string = path.join(__dirname, '..', dir);
        // not exists
        if (!existsSync(filePath)) {
          // make dir
          await mkdir(filePath);
          resolve();
        } else {
          throw Error('already exists.');
        }
      } catch (err: unknown) {
        // error
        if (err instanceof Error) {
          // error
          console.log(err.message);
        }
        resolve();
      }
    });
  }

  // mkDirAll
  mkDirAll = async (dirs: string[]): Promise<void> => {
    return new Promise(async (resolve1, _) => {
      try {
        // make all dir
        Promise.all(dirs.map(async (dir: string): Promise<void> => {
          return new Promise(async (resolve2, _) => {
            try {
              // file path
              const filePath: string = path.join(__dirname, '..', dir);
              // not exists
              if (!existsSync(filePath)) {
                // make dir
                await mkdir(filePath);
                resolve2();
              } else {
                throw Error('already exists.');
              }
            } catch (err: unknown) {
              // error
              if (err instanceof Error) {
                // error
                console.log(err.message);
              }
              resolve2();
            }
          })
        })).then(() => resolve1());

        // make dir
      } catch (e: unknown) {
        // error
        if (e instanceof Error) {
          // error
          console.log(e.message);
        }
        resolve1();
      }
    });
  }
}

// export module
export default Mkdir;