/**
 * rename.ts
 **
 * function：txt rename
**/

'use strict';

// modules
import path from 'path'; // path
import iconv from 'iconv-lite'; // Text converter
import Encoding from 'encoding-japanese';
import { promises } from 'fs'; // fs
import { setTimeout } from 'node:timers/promises'; // wait for seconds
import Logger from "./class/Logger"; // logger
import MKDir from './class/Mkdir0301'; // mdkir

// logger setting
const logger: Logger = new Logger("./logs");
// mkdir
const mkdirManager = new MKDir();

// file system
const { readFile, readdir, rename } = promises;

// main
(async () => {
    try {
        // make directory
        await mkdirManager.mkDirAll(['txt', 'logs']);
        // file list
        const files: string[] = await readdir('txt/');

        // promise
        await Promise.all(files.map((fl: string, idx: number): Promise<void> => {
            return new Promise(async (resolve1, _) => {
                try {
                    // file name
                    let newFileName: string = '';
                    // file path
                    const filePath: string = path.join(__dirname, 'txt', fl);
                    // renamed path
                    const renamePath: string = path.join(__dirname, 'renamed');
                    // file reading
                    const txtdata: Buffer = await readFile(filePath);
                    // char encode
                    const detectedEncoding: string | boolean = Encoding.detect(txtdata);
                    logger.info('charcode: ' + detectedEncoding);
                    // if not string
                    if (typeof (detectedEncoding) !== 'string') {
                        throw new Error('error-encoding');
                    }
                    // char decode
                    const str: string = iconv.decode(txtdata, detectedEncoding);
                    logger.debug('char decoding finished.');
                    // wait for 1sec
                    await setTimeout(1000);
                    // split on \r\n
                    const strArray: string[] = str.split(/\r\n/);
                    // title
                    const titleStr: string = strArray[0];
                    // subtitle
                    const subTitleStr: string = strArray[1];
                    // author
                    const authorStr: string = strArray[2];
                    // index
                    const paddedIndex: string = (idx + 8189).toString().padStart(5, '0');

                    if (!authorStr) {
                        // filename
                        newFileName = path.join(renamePath, `${paddedIndex}_${titleStr}_${subTitleStr}.txt`);

                    } else {
                        // filename
                        newFileName = path.join(renamePath, `${paddedIndex}_${titleStr}_${subTitleStr}_${authorStr}.txt`);
                    }

                    // prohibit symbol
                    const notSymbol: string[] = ['\\', '/', ':', '*', '?', '"', '<', '>', '|'];

                    // tmp
                    let tmpStr: string = '';

                    // loop
                    await Promise.all(notSymbol.map((symb: string): Promise<void> => {
                        return new Promise(async (resolve2, _) => {
                            try {
                                // tmp
                                tmpStr = newFileName;

                                // include symbol
                                if (newFileName.includes(symb)) {
                                    tmpStr = tmpStr.replace(symb, '');
                                }
                                // result
                                resolve2();

                            } catch (error: unknown) {
                                if (error instanceof Error) {
                                    logger.error(error.message);
                                }
                            }
                        });
                    }));

                    if (tmpStr.length < 255) {
                        // rename
                        await rename(filePath, tmpStr);
                        // wait for 1sec
                        await setTimeout(1000);

                        // result
                        resolve1();
                    }

                } catch (err: unknown) {
                    if (err instanceof Error) {
                        logger.error(err.message);
                    }
                }
            });
        }));
        // result
        logger.info('operation finished.');

    } catch (e: unknown) {
        if (e instanceof Error) {
            // error
            logger.error(e.message);
        }
    }
})();