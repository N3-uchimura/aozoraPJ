/*
 * aozorastation.ts
 *
 * aozorastation - aozorastation tools -
 **/

'use strict';

/// const
// namespace
import { myConst, myLinks, myNums, mySelectors } from './consts/globalvariables';

/// import modules
import { BrowserWindow, app, ipcMain, Tray, Menu, nativeImage } from 'electron'; // electron
import * as path from 'node:path'; // path
import { rmSync, createWriteStream, existsSync } from 'node:fs'; // file system
import { copyFile, readFile, writeFile, rename, readdir } from 'node:fs/promises'; // file system
import ffmpeg from 'fluent-ffmpeg'; // ffmpeg
import iconv from 'iconv-lite'; // Text converter
import Encoding from 'encoding-japanese';
import { promisify } from 'util';
import axios from 'axios';
import * as stream from 'stream';
import { Modifiy } from './class/ElTextModifiy0518'; // scraper
import { Scrape } from './class/ElScrape0517'; // scraper
import ELLogger from './class/ElLogger'; // logger
import Dialog from './class/ElDialog0414'; // dialog
import CSV from './class/ElCsv0414'; // csv
import MKDir from './class/ElMkdir0414'; // mdkir
// log level
const LOG_LEVEL: string = myConst.LOG_LEVEL ?? 'all';
// loggeer instance
const logger: ELLogger = new ELLogger(myConst.APP_NAME, LOG_LEVEL);
// csv
const csvMaker = new CSV(myConst.CSV_ENCODING, logger);
// dialog
const dialogMaker: Dialog = new Dialog(logger);
// mkdir
const mkdirManager = new MKDir(logger);
// scraper
const puppScraper: Scrape = new Scrape(logger);
//  modify
const modifyMaker: Modifiy = new Modifiy(logger);

/*
 main
*/
// main window
let mainWindow: Electron.BrowserWindow;
// quit flg
let isQuiting: boolean;

// create main window
const createWindow = (): void => {
  try {
    // window
    mainWindow = new BrowserWindow({
      width: 1200, // width
      height: 1000, // height
      webPreferences: {
        nodeIntegration: false, // Node.js use
        contextIsolation: true, // isolate context
        preload: path.join(__dirname, 'preload.js'), // preload
      },
    });

    // index.html load
    mainWindow.loadFile(path.join(__dirname, '../author.html'));
    // ready
    mainWindow.once('ready-to-show', () => {
      // dev mode
      //mainWindow.webContents.openDevTools();
    });

    // stay at tray
    mainWindow.on('minimize', (event: any): void => {
      // avoid Wclick
      event.preventDefault();
      // hide window
      mainWindow.hide();
      // returnfalse
      event.returnValue = false;
    });

    // close window
    mainWindow.on('close', (event: any): void => {
      // not closing
      if (!isQuiting) {
        // without apple
        if (process.platform !== 'darwin') {
          // return false
          event.returnValue = false;
        }
      }
    });

    // closing
    mainWindow.on('closed', (): void => {
      // destroy window
      mainWindow.destroy();
    });

  } catch (e: unknown) {
    logger.error(e);
  }
}

// enable sandbox
app.enableSandbox();

// main app
app.on('ready', async () => {
  logger.info('app: electron is ready');
  // create window
  createWindow();
  // make dir
  mkdirManager.mkDirAll(['output', 'logs']);
  // icons
  const icon: Electron.NativeImage = nativeImage.createFromPath(path.join(__dirname, 'assets/aozora.ico'));
  // tray
  const mainTray: Electron.Tray = new Tray(icon);
  // context menu
  const contextMenu: Electron.Menu = Menu.buildFromTemplate([
    // show
    {
      label: '表示', click: () => {
        mainWindow.show();
      }
    },
    // close
    {
      label: '閉じる', click: () => {
        app.quit();
      }
    }
  ]);
  // context menu
  mainTray.setContextMenu(contextMenu);
  // Wclick reopen
  mainTray.on('double-click', () => mainWindow.show());
});

// activate
app.on('activate', () => {
  // no window
  if (BrowserWindow.getAllWindows().length === 0) {
    // reload
    createWindow();
  }
});

// close
app.on('before-quit', () => {
  // turn on close flg
  isQuiting = true;
});

// end
app.on('window-all-closed', () => {
  logger.info('app: close app');
  // exit
  app.quit();
});

/*
 IPC
*/
// scraping
ipcMain.on('scrape', async (event: any, _: any) => {
  try {
    logger.info('ipc: scrape mode');
    // success
    let successCounter: number = 0;
    // faile
    let failCounter: number = 0;
    // init scraper
    await puppScraper.init();

    // URL
    for await (const [key, value] of Object.entries(myLinks.linkSelection)) {
      try {
        logger.debug(`process: getting ${key} 行`);
        // loop number
        const childLength: number = myLinks.numSelection[key];

        // within total 
        if (childLength >= myNums.FIRST_BOOK_ROWS) {
          logger.debug(`total is ${childLength}`);
          // update total
          event.sender.send('total', childLength * 50);
          // now URL
          event.sender.send('pageUpdate', `${key} 行`);
          logger.debug('doPageScrape mode');

          // for loop
          const nums: number[] = makeNumberRange(myNums.FIRST_BOOK_ROWS, childLength + 1);

          // loop
          for await (const j of nums) {
            try {
              // URL
              const aozoraUrl: string = `${myConst.DEF_AOZORA_BOOK_URL}${value}${j}.html`;
              logger.debug(`process: scraping ${aozoraUrl}`);
              // move to top
              await puppScraper.doGo(aozoraUrl);
              // wait 1 sec
              await puppScraper.doWaitFor(1000);
              logger.debug('doUrlScrape mode');
              // loop number
              const links: number[] = makeNumberRange(myNums.FIRST_PAGE_ROWS, myNums.MAX_PAGE_ROWS);

              // loop
              for await (const k of links) {
                try {
                  // selector
                  const finalLinkSelector: string = `body > center > table.list > tbody > tr:nth-child(${k}) > td:nth-child(2) > a`;
                  // wait for 2sec
                  await puppScraper.doWaitFor(2000);

                  // selector exists
                  if (await puppScraper.doCheckSelector(finalLinkSelector)) {
                    logger.debug(`process: downloading No.${k - 1}`);
                    // wait and click
                    await Promise.all([
                      // wait 1sec
                      await puppScraper.doWaitFor(1000),
                      // url
                      await puppScraper.doClick(finalLinkSelector),
                      // wait 2sec
                      await puppScraper.doWaitFor(2000),
                    ]);
                    // get href
                    const zipHref: string = await puppScraper.getHref(mySelectors.ZIPLINK_SELECTOR);
                    logger.debug(zipHref);

                    if (zipHref.includes('.zip')) {
                      await Promise.all([
                        // wait for 1sec
                        await puppScraper.doWaitFor(1000),
                        // wait for datalist
                        await puppScraper.doWaitSelector(mySelectors.ZIPLINK_SELECTOR, 3000),
                        // download zip
                        await puppScraper.doClick(mySelectors.ZIPLINK_SELECTOR),
                        // wait for 3sec
                        await puppScraper.doWaitFor(3000),
                        // goback
                        await puppScraper.doGoBack(),
                      ]);
                      // success
                      successCounter++;

                    } else {
                      // error
                      logger.error('err4: not zip file');
                      throw new Error('err4: not zip file');
                    }

                  } else {
                    // error
                    logger.debug('err4: no download link');
                    throw new Error('err4: no download link');
                  }

                } catch (err1: unknown) {
                  logger.error(err1);

                } finally {
                  // URL
                  event.sender.send('statusUpdate', `process: downloading No.${k - 1}`);
                  // update total
                  event.sender.send('update', {
                    success: successCounter,
                    fail: failCounter,
                  });
                }
              }
              // wait for 1sec
              await puppScraper.doWaitFor(1000);

            } catch (err2: unknown) {
              logger.error(err2);
            }
          }

        }

      } catch (err3: unknown) {
        logger.error(err3);
      }
    }
    // end message
    dialogMaker.showmessage('info', 'completed.');

  } catch (e: unknown) {
    logger.error(e);

  } finally {
    // close scraper
    await puppScraper.doClose();
  }
});

// authorscrape
ipcMain.on('authorscrape', async (event: any, _: any) => {
  try {
    logger.info('ipc: authorscrape mode');
    // success
    let successCounter: number = 0;
    // faile
    let failCounter: number = 0;
    // last array
    let finalArray: string[][] = [];
    // filename
    const fileName: string = (new Date).toISOString().replace(/[^\d]/g, '').slice(0, 8);
    // init scraper
    await puppScraper.init();
    // URL
    logger.debug(`total is ${myNums.MAX_AUTHORS}`);
    // update total
    event.sender.send('total', myNums.MAX_AUTHORS);
    logger.debug('doPageScrape mode');

    // for loop
    const nums: number[] = makeNumberRange(1, myNums.MAX_AUTHORS);

    // loop
    for await (const i of nums) {
      try {
        // tmp array
        let tmpArray: string[] = [];
        // URL
        const aozoraUrl: string = `${myConst.DEF_AOZORA_AUTHOR_URL}${i}.html`;
        logger.debug(`process: scraping ${aozoraUrl}`);
        // move to top
        await puppScraper.doGo(aozoraUrl);
        // wait 1 sec
        await puppScraper.doWaitFor(1000);
        logger.debug('doAuthorScrape mode');
        // row loop number
        const rows: number[] = makeNumberRange(1, 6);
        // insert no.
        tmpArray.push(i.toString());

        // loop
        for await (const j of rows) {
          try {
            logger.debug(`process: scraping No.${j - 1}`);
            // selector
            let finalLinkSelector: string = `body > table > tbody > tr:nth-child(${j}) > td:nth-child(2)`;
            // when title link
            if (j == 1) {
              finalLinkSelector += ' > font';
            }
            // wait for 2sec
            await puppScraper.doWaitFor(500);
            // wait and click
            const targetstring: string = await puppScraper.doSingleEval(finalLinkSelector, 'innerHTML');

            // set to tmparray
            tmpArray.push(targetstring);
            // wait 0.5 sec
            await puppScraper.doWaitFor(500);

          } catch (err1: unknown) {
            logger.error(err1);
          }

        }
        // set to finalArray
        finalArray.push(tmpArray);
        // wait for 1sec
        await puppScraper.doWaitFor(1000);

      } catch (err2: unknown) {
        logger.error(err2);
        // fail
        failCounter++;
      } finally {
        // URL
        event.sender.send('statusUpdate', `process: downloading Page.${i}`);
        // update total
        event.sender.send('update', {
          success: successCounter,
          fail: failCounter,
        });
      }
      // successcounter
      successCounter++;
      // wait for 1sec
      await puppScraper.doWaitFor(1000);
    }
    // csv filename
    const filePath: string = path.join(myConst.OUTPUT_PATH, fileName, '.csv');
    // header
    const columns: string[] = [
      'No.', '作家名', '作家名読み', 'ローマ字表記', '生年', '没年'
    ];
    // finaljson
    let finalJsonArray: any[] = [];
    // for training
    finalArray.forEach((author: any) => {
      // empty array
      let tmpObj: { [key: string]: string } = {
        number: '', // number
        authorname: '', // authorname
        ruby: '', // ruby
        roman: '', // roman
        birth: '', // birth
        dod: '', // dod
      };
      // set each value
      tmpObj.number = author[0];
      tmpObj.authorname = author[1];
      tmpObj.ruby = author[2];
      tmpObj.roman = author[3];
      tmpObj.birth = author[4];
      tmpObj.dod = author[5];
      // set to json
      finalJsonArray.push(tmpObj);
    });
    // write data
    await csvMaker.makeCsvData(finalJsonArray, columns, filePath);
    // wait for 1sec
    await puppScraper.doWaitFor(1000);
    // end message
    dialogMaker.showmessage('info', 'completed.');
    logger.info('app: completed');

  } catch (e: unknown) {
    logger.error(e);

  } finally {
    // close scraper
    await puppScraper.doClose();
  }
});

// titlescrape
ipcMain.on('titlescrape', async (event: any, _: any) => {
  try {
    logger.info('ipc: titlescrape mode');
    // make directory
    await mkdirManager.mkDirAll(['output', 'logs']);
    // filename
    const fileName: string = (new Date).toISOString().replace(/[^\d]/g, "").slice(0, 8);
    // init scraper
    await puppScraper.init();
    // URL
    for await (const [key, value] of Object.entries(myLinks.linkSelection)) {
      try {
        logger.debug(`process: getting ${key} 行`);
        // last array
        let wholeArray: any = [];
        // success
        let successCounter: number = 0;
        // faile
        let failCounter: number = 0;
        // loop number
        const childLength: number = myLinks.numSelection[key];

        // within total 
        if (childLength >= myNums.FIRST_BOOK_ROWS) {
          logger.debug(`total is ${childLength}`);
          // update total
          event.sender.send('total', childLength * myNums.MAX_PAGE_ROWS);
          // now URL
          event.sender.send('pageUpdate', `${key} 行`);
          logger.debug('doPageScrape mode');

          // for loop
          const nums: number[] = makeNumberRange(myNums.FIRST_BOOK_ROWS, childLength + 1);
          // loop
          for await (const i of nums) {
            try {
              // last array
              let finalArray: string[][] = [];
              // URL
              const aozoraUrl: string = `${myConst.DEF_AOZORA_BOOK_URL}${value}${i}.html`;
              logger.debug(`process: scraping ${aozoraUrl}`);
              // move to top
              await puppScraper.doGo(aozoraUrl);
              // wait 1 sec
              await puppScraper.doWaitFor(1000);
              logger.debug('doTableScrape mode');
              // row loop number
              const rows: number[] = makeNumberRange(myNums.FIRST_PAGE_ROWS, myNums.MAX_PAGE_ROWS);
              // column loop number
              const columns: number[] = makeNumberRange(1, 6);

              // loop
              for await (const j of rows) {
                try {
                  // tmp array
                  let tmpArray: string[] = [];
                  logger.debug(`process: scraping No.${j - 1}`);

                  // loop
                  for await (const k of columns) {
                    try {
                      // selector
                      let finalLinkSelector: string = `body > center > table.list > tbody > tr:nth-child(${j}) > td:nth-child(${k})`;
                      // when title link
                      if (k == 2) {
                        finalLinkSelector += ' > a';
                      }
                      // wait for 2sec
                      await puppScraper.doWaitFor(500);
                      // wait and click
                      const targetstring: string = await puppScraper.doSingleEval(finalLinkSelector, 'innerHTML');
                      // set to tmparray
                      tmpArray.push(targetstring);
                      // wait 0.5 sec
                      await puppScraper.doWaitFor(500);

                    } catch (err1: unknown) {
                      logger.error(err1);
                    }
                  }
                  // set to finalArray
                  finalArray.push(tmpArray);
                  // successcounter
                  successCounter++;

                } catch (err2: unknown) {
                  logger.error(err2);

                } finally {
                  // URL
                  event.sender.send('statusUpdate', `process: downloading Page.${i - 1} No.${j - 1}`);
                  // update total
                  event.sender.send('update', {
                    success: successCounter,
                    fail: failCounter,
                  });
                }
              }
              // put into wholearray
              wholeArray.push(finalArray);
              // wait for 1sec
              await puppScraper.doWaitFor(1000);

            } catch (err3: unknown) {
              logger.error(err3);
            }
          }
          // csv filename
          const filePath: string = path.join(__dirname, `${myConst.OUTPUT_PATH}\\${fileName}_${key}行.csv`)
          // header
          const columns: string[] = [
            'No.', '作品名', '文字遣い種別', '著者名', '著者基本名', '翻訳者名等'
          ];
          // finaljson
          let finalJsonArray: any[] = [];
          // all races
          wholeArray.forEach((books: any) => {
            // for training
            books.forEach((book: any) => {
              // empty array
              let tmpObj: { [key: string]: string } = {
                number: '', // number
                title: '', // title
                ruby: '', // ruby
                authorname: '', // authorname
                authorbasename: '', // authorbasename
                editor: '', // editor
              };
              // set each value
              tmpObj.number = book[0];
              tmpObj.title = book[1];
              tmpObj.ruby = book[2];
              tmpObj.authorname = book[3];
              tmpObj.authorbasename = book[4];
              tmpObj.editor = book[5];
              // set to json
              finalJsonArray.push(tmpObj);
            });
          });
          // write data
          await csvMaker.makeCsvData(finalJsonArray, columns, filePath);
          // wait for 1sec
          await puppScraper.doWaitFor(1000);
        }

      } catch (err4: unknown) {
        logger.error(err4);
      }
    }
    // end message
    dialogMaker.showmessage('info', 'completed.');

  } catch (e: unknown) {
    logger.error(e);

  } finally {
    // close scraper
    await puppScraper.doClose();
  }
});

// extract
ipcMain.on('extract', async () => {
  try {
    logger.info('ipc: extract mode');
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
                logger.error(err1);
              }

            })
          }))
          // result
          resolve1();

        } catch (err2: unknown) {
          logger.error(err2);
        }
      })
    }));
    // complete
    logger.info('operation finished.');

  } catch (e: unknown) {
    logger.error(e);
  }
});

// finalize
ipcMain.on('finalize', async () => {
  try {
    logger.info('ipc: finalize mode');
    // make dir
    await mkdirManager.mkDirAll(['./download', './tmp', './backup']);

    // subdir list
    const allDirents: any = await readdir('tmp/', { withFileTypes: true });
    const dirNames: any[] = allDirents.filter((dirent: any) => dirent.isDirectory()).map(({ name }: any) => name);
    logger.debug(`filepaths are ${dirNames}`);

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
          logger.debug(`files are ${filePaths}`);

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
                logger.debug(`add to mergelist ${path}...`);
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
});

// modify
ipcMain.on('modify', async () => {
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
          const removedStr0: string = await modifyMaker.repeatCharacter(str);
          if (removedStr0 == 'error') {
            logger.error('0: none');
          }
          logger.debug('0: finished');
          // annotations
          const removedStr1: any = await modifyMaker.removeAnnotation(removedStr0);
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
          const removedStr2: string = await modifyMaker.removeFooter(finalStr.body);
          if (removedStr2 == 'error') {
            logger.error('error2');
          }
          logger.debug('2: finished');
          // remove ryby(《》)
          const removedStr3: string = await modifyMaker.removeRuby(removedStr2);
          if (removedStr3 == 'error') {
            logger.error('error3');
          }
          logger.debug('3: finished');
          // remove angle bracket([])
          const removedStr4: string = await modifyMaker.removeBrackets(removedStr3);
          if (removedStr4 == 'error') {
            logger.error('error4');
          }
          logger.debug('4: finished');
          // remove unnecessary string
          const removedStr5: string = await modifyMaker.removeSymbols(removedStr4);
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
    logger.error(e);
  }
});

// record
ipcMain.on('record', async () => {
  try {
    logger.info('ipc: record mode');

  } catch (e: unknown) {
    logger.error(e);
  }
});

// rename
ipcMain.on('rename', async () => {
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
            logger.debug(`deleting ${tmps}`);
            // delete file
            rmSync(delFilePath, { recursive: true });
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
            logger.debug(`finished making.. ${outDirPath}`);
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
                logger.debug(`synthesizing .. ${st}`);
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
                        logger.debug("1: " + paddedIndex1);
                        logger.debug("2: " + paddedIndex2);
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
});

// exit
ipcMain.on('exit', async () => {
  try {
    logger.info('ipc: exit mode');
    // selection
    const selected: number = dialogMaker.showQuetion('question', 'exit', 'exit? data is exposed');

    // when yes
    if (selected == 0) {
      // close
      app.quit();
    }

  } catch (e: unknown) {
    logger.error(e);
  }
});

// number array
const makeNumberRange = (start: number, end: number) => [...new Array(end - start).keys()].map(n => n + start);

// synthesis audio
const synthesisRequest = async (filename: string, text: string, outDir: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.info(`${filename} started.`);
      // pipe
      const finished = promisify(stream.finished);
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
      const tmpUrl: string = `http://${myConst.HOSTNAME}:${myNums.PORT}/voice?${query}`;
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