/**
 * finalize.ts
 **
 * function：finalize
**/

'use strict';

// app name
const APP_NAME: string = 'aozoraRecorder_finalize';

// modules
import path from 'path'; // path
import ffmpeg from 'fluent-ffmpeg'; // ffmpeg
import { promises } from 'fs'; // fs
import Logger from './class/Logger'; // logger
import mkdir from './class/Mkdir0301'; // mdkir

// file system
const { readdir } = promises;
// loggeer instance
const logger: Logger = new Logger(APP_NAME, true);
// mkdir
const mkdirManager = new mkdir();

// main
(async () => {
    try {
        logger.info('audio files merge started.');
        // make dir
        await mkdirManager.mkDirAll(['./download', './tmp', './backup']);

        // subdir list
        const allDirents: any = await readdir('tmp/', { withFileTypes: true });
        const dirNames: any[] = allDirents.filter((dirent: any) => dirent.isDirectory()).map(({ name }: any) => name);
        logger.trace(`filepaths are ${dirNames}`);

        // loop
        await Promise.all(dirNames.map(async (dir: any): Promise<void> => {
            return new Promise(async (resolve1, reject1) => {
                try {
                    // target dir path
                    const targetDir: string = path.join('./tmp', dir);
                    // file list in subfolder
                    const audioFiles: string[] = (await readdir(targetDir)).filter((ad: string) => path.parse(ad).ext == '.wav');

                    // filepath list
                    const filePaths: any[] = audioFiles.map((fl: string) => {
                        return path.join('./tmp', dir, fl);
                    });
                    logger.trace(`files are ${filePaths}`);

                    // DL path
                    const downloadDir: string = './backup';
                    // output path
                    const outputPath: string = path.join('./download', `${dir}.wav`);

                    logger.debug(`outputPath is ${outputPath}`);

                    // ffmpeg
                    let mergedVideo: any = ffmpeg();

                    // merge
                    await Promise.all(filePaths.map(async (path: string): Promise<void> => {
                        return new Promise(async (resolve2, reject2) => {
                            try {
                                // merged video
                                mergedVideo = mergedVideo.mergeAdd(path);
                                logger.trace(`add to mergelist ${path}...`);
                                // complete
                                resolve2();

                            } catch (err1: unknown) {
                                logger.error(err1);
                                // error
                                reject2();
                            }
                        });
                    }));

                    logger.info('merging files...');
                    // merge
                    mergedVideo.mergeToFile(outputPath, downloadDir)
                        .on('error', (err2: unknown) => {
                            logger.error(err2);
                            reject1();
                        })
                        .on('end', function () {
                            logger.debug(`${dir}.wav  merge finished.`);
                            // result
                            resolve1();
                        });

                } catch (error: unknown) {
                    logger.error(error);
                    // error
                    reject1();
                }
            });
        })).then(() => logger.info('operation finished.'));

    } catch (e: unknown) {
        logger.error(e);
    }
})();