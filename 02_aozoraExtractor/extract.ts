/**
 * extract.ts
 **
 * function：テキスト抽出
**/

// モジュール
import path from 'path'; // path
import log4js from 'log4js'; // ロガー
import { promises } from 'fs'; // fs

// ロガー設定
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

// ファイルシステム
const { copyFile, readdir } = promises;

// メイン
(async () => {
    try {
        // ファイル一覧
        const files: string[] = await readdir('source/');

        // 全ループ
        await Promise.all(files.map((fl: string): Promise<void> => {
            return new Promise(async (resolve1, reject1) => {
                try {
                    // ファイルパス
                    const filePath: string = path.join(__dirname, 'source', fl);
                    // ファイル一覧
                    const texts: string[] = await readdir(filePath);
                    // 全ループ
                    await Promise.all(texts.map((txt: string): Promise<void> => {
                        return new Promise(async (resolve2, reject2) => {
                            try {
                                // 拡張子
                                const extension: string = path.extname(txt);

                                // テキストのみ
                                if (extension == '.txt') {
                                    // 出力ファイルパス
                                    const outPath: string = path.join(__dirname, 'extracted', texts[0]);
                                    // コピー
                                    await copyFile(path.join(__dirname, 'source', fl, texts[0]), outPath);
                                }
                                // 完了
                                resolve2();

                            } catch (e: unknown) {
                                if (e instanceof Error) {
                                    reject2();
                                }
                            }

                        })
                    }))
                    // 結果
                    resolve1();

                } catch (e: unknown) {
                    if (e instanceof Error) {
                        reject1();
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
