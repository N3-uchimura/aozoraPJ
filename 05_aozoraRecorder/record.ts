/**
 * record.ts
 **
 * function：record audio
**/

'use strict';

// app name
const APP_NAME: string = 'aozoraRecorder_record';

// modules
import path from 'path'; // path
import iconv from 'iconv-lite'; // Text converter
import * as stream from 'stream';
import { promisify } from 'util';
import axios from 'axios';
import { createWriteStream, promises, existsSync } from 'fs'; // fs
import Logger from './class/Logger'; // logger
import mkdir from './class/Mkdir0301'; // mdkir

// loggeer instance
const logger: Logger = new Logger(APP_NAME, true);
// mkdir
const mkdirManager = new mkdir();

// port
const PORT: number = 5000;
const HOSTNAME: string = '127.0.0.1';

// pipe
const finished = promisify(stream.finished);

// file system
const { readFile, readdir, rm } = promises;

// synthesis audio
const synthesisRequest = async (filename: string, text: string, outDir: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.info(`${filename} started.`);
            // parameter
            const params: any = {
                text: text,
                encoding: 'utf-8',
                model_id: 0,
                speaker_id: 0,
                peaker_name: 'bratology',
                sdp_ratio: 0.2,
                noise: 0.6,
                noisew: 0.8,
                length: 1.1,
                language: 'JP',
                auto_split: true,
                split_interval: 2,
                assist_text_weight: 1.0,
                style: 'Neutral',
                style_weight: 5.0,
                // reference_audio_path: '',
            }

            // query
            const query: any = new URLSearchParams(params);
            // requestURL
            const tmpUrl: string = `http://${HOSTNAME}:${PORT}/voice?${query}`;
            // file path
            const filePath: string = path.join(outDir, filename);
            // file writer
            const writer = createWriteStream(filePath);
            // GET request
            await axios({
                method: 'get',
                url: tmpUrl,
                responseType: 'stream',

            }).then(async (response: any) => {
                await response.data.pipe(writer);
                await finished(writer);
                resolve(filePath); //this is a Promise
            });

        } catch (e: unknown) {
            // error
            logger.error(e);
            reject('error');
        }
    });
}

// main
(async () => {
    try {
        logger.info('operation started.');
        // make dir
        await mkdirManager.mkDirAll(['./txt', './tmp']);

        // subdir list
        const allDirents: any = await readdir('tmp/', { withFileTypes: true });
        const dirNames: any[] = allDirents.filter((dirent: any) => dirent.isDirectory()).map(({ name }: any) => name);

        if (dirNames) {
            // loop
            await Promise.all(dirNames.map(async (tmps: string): Promise<void> => {
                return new Promise(async (resolve0, reject0) => {
                    try {
                        // delete path
                        const delFilePath: string = path.join('./tmp', tmps);
                        logger.trace(`deleting ${tmps}`);
                        // delete file
                        await rm(delFilePath, { recursive: true });
                        resolve0();

                    } catch (err: unknown) {
                        logger.error(err);
                        // error
                        reject0();
                    }
                });
            }));

        } else {
            logger.debug('no directory in /tmp.');
        }

        // file list
        const files: string[] = await readdir('txt/');

        // loop
        await Promise.all(files.map(async (fl: string): Promise<void> => {
            return new Promise(async (resolve1, reject1) => {
                try {
                    logger.debug(`operating ${fl}`);
                    // filename list
                    let tmpFileNameArray: string[] = [];
                    // filename
                    const fileName: string = path.parse(fl).name;
                    // ID
                    const fileId: string = fileName.slice(0, 5);
                    // save path
                    const outDirPath: string = path.join('./tmp', fileId);
                    // make dir
                    if (!existsSync(outDirPath)) {
                        await mkdirManager.mkDir(outDirPath);
                        logger.trace(`finished making.. ${outDirPath}`);
                    }
                    // file path
                    const filePath: string = path.join('./txt', fl);
                    // file reading
                    const txtdata: Buffer = await readFile(filePath);
                    // decode
                    const str: string = iconv.decode(txtdata, 'UTF8');
                    logger.debug('char decoding finished.');
                    // split on \r\n
                    const strArray: string[] = str.split(/\r\n/);

                    // loop
                    await Promise.all(strArray.map(async (st: string, index: number): Promise<void> => {
                        return new Promise(async (resolve2, reject2) => {
                            try {
                                // tmpfile
                                let tmpFileName: string = '';

                                // no text error
                                if (st.trim().length == 0) {
                                    throw new Error('err: no length');
                                }
                                logger.trace(`synthesizing .. ${st}`);
                                // index
                                const paddedIndex1: string = index.toString().padStart(3, '0');

                                // over 500 char
                                if (st.length > 500) {
                                    // split on 。
                                    const subStrArray: string[] = st.split(/。/);
                                    // make audio
                                    await Promise.all(subStrArray.map(async (sb: string, idx: number): Promise<void> => {
                                        return new Promise(async (resolve3, reject3) => {
                                            try {
                                                // index
                                                const paddedIndex2: string = idx.toString().padStart(3, '0');
                                                logger.trace("1: " + paddedIndex1);
                                                logger.trace("2: " + paddedIndex2);
                                                // filename
                                                tmpFileName = `${fileId}-${paddedIndex1}${paddedIndex2}.wav`;
                                                // synthesis request
                                                await synthesisRequest(tmpFileName, sb, outDirPath);
                                                // add to filelist
                                                tmpFileNameArray.push(tmpFileName);
                                                // complete
                                                resolve3();

                                            } catch (err1: unknown) {
                                                logger.error(err1);
                                                // error
                                                reject3();
                                            }
                                        })
                                    }));

                                } else {
                                    // filename
                                    tmpFileName = `${fileId}-${paddedIndex1}.wav`;
                                    // synthesis request
                                    await synthesisRequest(tmpFileName, st, outDirPath);
                                    // add to list
                                    tmpFileNameArray.push(tmpFileName);
                                }
                                logger.debug(`${tmpFileName} finished.`);
                                // complete
                                resolve2();

                            } catch (err2: unknown) {
                                logger.error(err2);
                                // error
                                reject2();
                            }
                        });
                    }));
                    // complete
                    resolve1();

                } catch (err3: unknown) {
                    logger.error(err3);
                    // error
                    reject1();
                }
            });
        }));
        // complete
        logger.info('operation finished.');

    } catch (e: unknown) {
        // error
        logger.error(e);
    }
})();
