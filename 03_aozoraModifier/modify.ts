/**
 * modify.ts
 **
 * function：modify text
**/

// modules
import path from 'path'; // path
import log4js from 'log4js'; // logger
import { promises } from 'fs'; // fs
import iconv from 'iconv-lite'; // Text converter
import Encoding from 'encoding-japanese';
import { toDakuon } from 'kanadaku';

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

                                        } catch (e: unknown) {
                                            if (e instanceof Error) {
                                                logger.error(e.message);
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

                    } catch (e: unknown) {
                        if (e instanceof Error) {
                            logger.error(e.message);
                            // error
                            reject2();
                        }
                    }
                });
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

// 不要文字除去
const removeSymbols = (str: string): Promise<string> => {
    return new Promise(async (resolve1, reject1) => {
        try {
            // 一時保存
            let tmpStr: string = str;
            // 除去対象
            const symbols: string[] = ['｜', '――'];
            // 除去
            await Promise.all(symbols.map((syb: string): Promise<void> => {
                return new Promise(async (resolve2, reject2) => {
                    try {
                        // 正規表現
                        const regStr: RegExp = new RegExp(syb, 'g');
                        // 除去処理
                        tmpStr = tmpStr.replace(regStr, '');
                        // 結果
                        resolve2();

                    } catch (e: unknown) {
                        if (e instanceof Error) {
                            // エラー
                            reject2();
                        }
                    }
                })
            }));
            // 結果
            resolve1(tmpStr);

        } catch (e: unknown) {
            if (e instanceof Error) {
                logger.error(e.message);
                // エラー
                reject1('error');
            }
        }
    });
}

// main
(async () => {
    try {
        // ファイル一覧
        const files: string[] = await readdir('txt/');

        // 全ループ
        await Promise.all(files.map((fl: string): Promise<void> => {
            return new Promise(async (resolve, reject) => {
                try {
                    let finalStr: any;
                    // ファイルパス
                    const filePath: string = path.join(__dirname, 'txt', fl);
                    // 完了ファイルパス
                    const fileCompPath: string = path.join(__dirname, 'txt', 'complete', fl);
                    // ファイルパス
                    const outPath: string = path.join(__dirname, 'modify', fl);
                    // ファイル読み込み
                    const txtdata = await readFile(filePath);
                    // 文字コード検出
                    const detectedEncoding: string | boolean = Encoding.detect(txtdata);
                    logger.info('charcode: ' + detectedEncoding);
                    // 文字列以外エラー
                    if (typeof (detectedEncoding) !== 'string') {
                        throw new Error('error-encoding');
                    }
                    // デコード
                    const str = iconv.decode(txtdata, detectedEncoding);
                    logger.debug('char decoding finished.');
                    // 反復処理
                    const removedStr0: string = await repeatCharacter(str);
                    if (removedStr0 == 'error') {
                        logger.error('0: none');
                    }
                    logger.debug('0: finished');
                    // 注釈除去
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
                    // フッタ除去
                    const removedStr2: string = await removeFooter(finalStr.body);
                    if (removedStr2 == 'error') {
                        logger.error('error2');
                    }
                    logger.debug('2: finished');
                    // ルビ(《》)除去
                    const removedStr3: string = await removeRuby(removedStr2);
                    if (removedStr3 == 'error') {
                        logger.error('error3');
                    }
                    logger.debug('3: finished');
                    // かっこ([])除去
                    const removedStr4: string = await removeBrackets(removedStr3);
                    if (removedStr4 == 'error') {
                        logger.error('error4');
                    }
                    logger.debug('4: finished');
                    // 不要文字除去
                    const removedStr5: string = await removeSymbols(removedStr4);
                    if (removedStr5 == 'error') {
                        logger.error('error5');
                    }
                    logger.debug('5: finished');

                    // 書き出し
                    await writeFile(outPath, removedStr1.header + removedStr5);
                    // 完了フォルダに移動
                    await rename(filePath, fileCompPath);
                    logger.info('writing finished.');
                    // 結果
                    resolve();

                } catch (e: unknown) {
                    if (e instanceof Error) {
                        logger.error(e.message);
                        //reject();
                    }
                }
            })
        }));
        // 完了
        logger.info('operation finished.');

    } catch (e: unknown) {
        if (e instanceof Error) {
            // エラー
            logger.error(e.message);
        }
    }
})();
