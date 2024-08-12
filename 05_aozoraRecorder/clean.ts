/**
 * record.ts
 **
 * function：record audios
**/

// modules
import path from 'path'; // path
import log4js from 'log4js'; // logger
import ffmpeg from 'fluent-ffmpeg'; // ffmpeg
import { promises } from 'fs'; // fs

// Logger config
log4js.configure({
    appenders: {
        out: { type: 'stdout' },
        system: { type: 'dateFile', filename: 'logs/system.log', pattern: 'yyyyMMdd' },
        errorRaw: { type: 'dateFile', filename: 'logs/error.log', pattern: 'yyyyMMdd' },
        error: { type: 'logLevelFilter', appender: 'errorRaw', level: 'error' },
    },
    categories: {
        default: { appenders: ['out', 'system', 'error'], level: 'trace' },
    }
});
const logger: any = log4js.getLogger();

// file system
const { readdir } = promises;

// main
(async () => {
    try {
        // subdir list
        const allDirents: any = await readdir('tmp/', { withFileTypes: true });
        const dirNames: any[] = allDirents.filter((dirent: any) => dirent.isDirectory()).map(({ name }: any) => name);

        // loop
        await Promise.all(dirNames.map(async (dir: any): Promise<void> => {
            return new Promise(async (resolve1, reject1) => {
                try {
                    // target dir path
                    const targetDir: string = path.join(__dirname, 'tmp', dir);
                    // file list in subfolder
                    const audioFiles: string[] = (await readdir(targetDir)).filter((ad: string) => path.parse(ad).ext == '.wav');

                    // filepath list
                    const filePaths: any[] = audioFiles.map((fl: string) => {
                        return path.join(__dirname, 'tmp', dir, fl);

                    });

                    // DL path
                    const downloadDir: string = path.join(__dirname, 'backup');
                    // output path
                    const outputPath: string = path.join(__dirname, 'download', `${dir}.wav`);

                    // ffmpeg
                    let mergedVideo: any = ffmpeg();

                    // merge
                    await Promise.all(filePaths.map(async (path: string): Promise<void> => {
                        return new Promise(async (resolve2, reject2) => {
                            try {
                                // merged video
                                mergedVideo = mergedVideo.mergeAdd(path);
                                // complete
                                resolve2();

                            } catch (e: unknown) {
                                if (e instanceof Error) {
                                    logger.error(e.message);
                                    // error
                                    reject2();
                                }
                            }
                        });
                    }));

                    // merge
                    mergedVideo.mergeToFile(outputPath, downloadDir)
                        .on('error', (err: unknown) => {
                            if (err instanceof Error) {
                                logger.error(err.message);
                            }
                        })
                        .on('end', function () {
                            logger.debug(`${dir}.wav  merge finished.`);
                        });
                    // result
                    resolve1();

                } catch (e: unknown) {
                    if (e instanceof Error) {
                        logger.error(e.message);
                        // error
                        reject1();
                    }
                }
            });
        }));
        logger.info('operation finished.');

    } catch (e: unknown) {
        if (e instanceof Error) {
            // error
            logger.error(e.message);
        }
    }
})();