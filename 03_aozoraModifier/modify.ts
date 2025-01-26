/**
 * modify.ts
 **
 * function：modify text
**/

'use strict';

// modules
import path from 'path'; // path
import { promises } from 'fs'; // fs
import iconv from 'iconv-lite'; // Text converter
import Encoding from 'encoding-japanese';
import { toDakuon } from 'kanadaku';
import Logger from "./class/Logger0928"; // logger
import MKDir from './class/Mkdir0126'; // mdkir

// logger
const logger: Logger = new Logger("./logs");
// mkdir
const mkdirManager = new MKDir();
// file system
const { rename, readFile, writeFile, readdir } = promises;

// removed
interface removed {
    header: string;
    body: string;
}

// remove annotation
const removeAnnotation = (str: string): Promise<removed | string> => {
    return new Promise(async (resolve, reject) => {
        try {

            // annotation distinction
            const annotation: string = '-------------------------------------------------------';

            // remove
            if (str.includes(annotation)) {
                // split
                const result: string[] = str.split(annotation);
                // complete
                resolve({
                    header: result[0],
                    body: str.split(annotation)[2],
                });

            }

        } catch (e: unknown) {
            if (e instanceof Error) {
                // error
                logger.error(e.message);
                reject('error');
            }
        }
    });
}

// remove footer
const removeFooter = (str: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            // distinction
            const annotation: string = '底本：';
            // remove footer
            if (str.includes(annotation)) {
                // split
                const result: string[] = str.split(annotation);
                // result
                resolve(result[0]);
            }

        } catch (e: unknown) {
            if (e instanceof Error) {
                // error
                logger.error(e.message);
                reject('error');
            }
        }
    });
}

// remove ruby(《》)
const removeRuby = (str: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            // result
            resolve(str.replace(/《.+?》/g, ''));

        } catch (e: unknown) {
            if (e instanceof Error) {
                // error
                logger.error(e.message);
                reject('error');
            }
        }
    });
}

// remove brackets([])
const removeBrackets = (str: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            // result
            resolve(str.replace(/［＃.*］/g, ''));

        } catch (e: unknown) {
            if (e instanceof Error) {
                // error
                logger.error(e.message);
                reject('error');
            }
        }
    });
}

// remove repeat signs
const repeatCharacter = async (str: string): Promise<string> => {
    return new Promise(async (resolve1, reject1) => {
        try {
            // tmp
            let tmpStr: string = str;
            // remove repeat signs
            const shortSymbols: string[] = ['ゝ', 'ゞ', '／＼', '／″＼'];

            // promise
            await Promise.all(shortSymbols.map(async (smb: string): Promise<void> => {
                return new Promise(async (resolve2, reject2) => {
                    try {
                        // str length
                        let strLen: number = 0;
                        // matched
                        let matchedStr: string = '';

                        // if include
                        if (tmpStr.includes(smb)) {

                            // when voiced
                            if (smb == '／″＼') {
                                // str length
                                strLen = 2;

                            } else {
                                // str length
                                strLen = smb.length;
                            }

                            // str length is over 2
                            if (strLen > 1) {
                                matchedStr = '.{2}';

                            } else {
                                matchedStr = '.';
                            }

                            // regexp
                            const regex: RegExp = new RegExp(matchedStr + smb, 'g');
                            // match part
                            const match = tmpStr.match(regex);

                            // if match
                            if (match) {
                                // promise
                                await Promise.all(match.map(async (mp: string): Promise<void> => {
                                    return new Promise(async (resolve3, reject3) => {
                                        try {
                                            // just before
                                            let previousChar = '';
                                            // matched char
                                            let hitChar = '';

                                            // voiced
                                            if (smb == '／″＼') {
                                                // just before
                                                previousChar = toDakuon(mp.substring(0, strLen));
                                                // matched char
                                                hitChar = mp.substring(strLen, strLen * 2 + 1);

                                            } else {
                                                // just before
                                                previousChar = mp.substring(0, strLen);
                                                // matched char
                                                hitChar = mp.substring(strLen, strLen * 2);
                                            }
                                            // replace
                                            const replaced: string = mp.replace(hitChar, previousChar);
                                            // replaced string
                                            tmpStr = tmpStr.replace(mp, replaced);

                                            // result
                                            resolve3();

                                        } catch (err1: unknown) {
                                            if (err1 instanceof Error) {
                                                logger.error(err1.message);
                                                // error
                                                reject3();
                                            }
                                        }
                                    });
                                }));

                            } else {
                                logger.error('not found');
                            }
                        }
                        // result
                        resolve2();

                    } catch (err2: unknown) {
                        if (err2 instanceof Error) {
                            logger.error(err2.message);
                            // error
                            reject2();
                        }
                    }
                });
            }));
            // result
            resolve1(tmpStr);

        } catch (err3: unknown) {
            if (err3 instanceof Error) {
                logger.error(err3.message);
                // error
                reject1('error');
            }
        }
    });
}

// remove symbols
const removeSymbols = (str: string): Promise<string> => {
    return new Promise(async (resolve1, reject1) => {
        try {
            // tmp
            let tmpStr: string = str;
            // symbols
            const symbols: string[] = ['｜', '――'];
            // removal
            await Promise.all(symbols.map((syb: string): Promise<void> => {
                return new Promise(async (resolve2, reject2) => {
                    try {
                        // regexp
                        const regStr: RegExp = new RegExp(syb, 'g');
                        // replaced
                        tmpStr = tmpStr.replace(regStr, '');
                        // result
                        resolve2();

                    } catch (err: unknown) {
                        if (err instanceof Error) {
                            logger.error(err.message);
                            // error
                            reject2();
                        }
                    }
                })
            }));
            // result
            resolve1(tmpStr);

        } catch (e: unknown) {
            if (e instanceof Error) {
                logger.error(e.message);
                // error
                reject1('error');
            }
        }
    });
}

// main
(async () => {
    try {
        // make directory
        await mkdirManager.mkDirAll(['txt', 'logs', 'modify']);
        // file list
        const files: string[] = await readdir('txt/');

        // loop for files
        await Promise.all(files.map((fl: string): Promise<void> => {
            return new Promise(async (resolve, _) => {
                try {
                    let finalStr: any;
                    // filepath
                    const filePath: string = path.join(__dirname, 'txt', fl);
                    // filepath completed
                    const fileCompPath: string = path.join(__dirname, 'txt', 'complete', fl);
                    // filepath output
                    const outPath: string = path.join(__dirname, 'modify', fl);
                    // read files
                    const txtdata = await readFile(filePath);
                    // detect charcode
                    const detectedEncoding: string | boolean = Encoding.detect(txtdata);
                    logger.info('charcode: ' + detectedEncoding);
                    // without string
                    if (typeof (detectedEncoding) !== 'string') {
                        throw new Error('error-encoding');
                    }
                    // decode
                    const str = iconv.decode(txtdata, detectedEncoding);
                    logger.debug('char decoding finished.');
                    // repeat strings
                    const removedStr0: string = await repeatCharacter(str);
                    if (removedStr0 == 'error') {
                        logger.error('0: none');
                    }
                    logger.debug('0: finished');
                    // annotations
                    const removedStr1: any = await removeAnnotation(removedStr0);
                    if (typeof (removedStr1) == 'string') {
                        logger.error('error1');
                        finalStr = {
                            header: '',
                            body: removedStr0,
                        }
                    } else {
                        finalStr = removedStr1;
                    }
                    logger.debug('1: finished');
                    // remove footer
                    const removedStr2: string = await removeFooter(finalStr.body);
                    if (removedStr2 == 'error') {
                        logger.error('error2');
                    }
                    logger.debug('2: finished');
                    // remove ryby(《》)
                    const removedStr3: string = await removeRuby(removedStr2);
                    if (removedStr3 == 'error') {
                        logger.error('error3');
                    }
                    logger.debug('3: finished');
                    // remove angle bracket([])
                    const removedStr4: string = await removeBrackets(removedStr3);
                    if (removedStr4 == 'error') {
                        logger.error('error4');
                    }
                    logger.debug('4: finished');
                    // remove unnecessary string
                    const removedStr5: string = await removeSymbols(removedStr4);
                    if (removedStr5 == 'error') {
                        logger.error('error5');
                    }
                    logger.debug('5: finished');

                    // write out to file
                    await writeFile(outPath, removedStr1.header + removedStr5);
                    // move to complete dir
                    await rename(filePath, fileCompPath);
                    logger.info('writing finished.');
                    // result
                    resolve();

                } catch (err: unknown) {
                    if (err instanceof Error) {
                        logger.error(err.message);
                    }
                }
            })
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
