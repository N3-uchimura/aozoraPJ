/**
 * extract.ts
 **
 * function：text extractor
**/

'use strict';

// module
import path from 'path'; // path
import log4js from 'log4js'; // logger
import { promises } from 'fs'; // fs

// logger setting
log4js.configure({
    appenders: {
        out: { type: 'stdout' },
        system: { type: 'file', filename: 'logs/access.log' }
    },
    categories: {
        default: { appenders: ['out', 'system'], level: 'debug' }
    }
});
const logger: any = log4js.getLogger();

// file system
const { copyFile, readdir } = promises;

// main
(async () => {
    try {
        // file list
        const files: string[] = await readdir('source/');

        // loop file
        await Promise.all(files.map((fl: string): Promise<void> => {
            return new Promise(async (resolve1, reject1) => {
                try {
                    // file path
                    const filePath: string = path.join(__dirname, 'source', fl);
                    // 
                    const texts: string[] = await readdir(filePath);
                    // loop line
                    await Promise.all(texts.map((txt: string): Promise<void> => {
                        return new Promise(async (resolve2, reject2) => {
                            try {
                                // extension
                                const extension: string = path.extname(txt);

                                // when txt
                                if (extension == '.txt') {
                                    // output path
                                    const outPath: string = path.join(__dirname, 'extracted', texts[0]);
                                    // copy
                                    await copyFile(path.join(__dirname, 'source', fl, texts[0]), outPath);
                                }
                                // complete
                                resolve2();

                            } catch (err1: unknown) {
                                if (err1 instanceof Error) {
                                    // error
                                    logger.error(err1.message);
                                    reject2();
                                }
                            }

                        })
                    }))
                    // result
                    resolve1();

                } catch (err2: unknown) {
                    if (err2 instanceof Error) {
                        // error
                        logger.error(err2.message);
                        reject1();
                    }
                }
            })
        }));
        // complete
        logger.info('operation finished.');

    } catch (e: unknown) {
        if (e instanceof Error) {
            // error
            logger.error(e.message);
        }
    }
})();
