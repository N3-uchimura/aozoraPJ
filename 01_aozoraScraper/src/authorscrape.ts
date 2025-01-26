/*
 * authorscrape.ts
 *
 * function：Node.js server
 **/

'use strict';

// const
//const MAX_AUTHORS: number = 2399;
const MAX_AUTHORS: number = 5;
const DEF_AOZORA_URL: string = 'https://www.aozora.gr.jp/index_pages/person'; // scraping root
const OUTPUT_PATH: string = '../output/'; // output path

// import modules
import { BrowserWindow, app, ipcMain, dialog, Tray, Menu, nativeImage } from 'electron'; // electron
import * as path from 'path'; // path
import { Scrape } from './class/Scrape1103'; // scraper
import ELLogger from './class/MyLogger0301el'; // logger
import Dialog from './class/ElectronDialog0120'; // dialog
import CSV from './class/Csv1104'; // csv
import MKDir from './class/Mkdir0126'; // mdkir

// csv
const csvMaker = new CSV('SJIS');
// dialog
const dialogMaker: Dialog = new Dialog();
// mkdir
const mkdirManager = new MKDir();
// loggeer instance
const logger: ELLogger = new ELLogger('./logs', 'access');
// scraper
const puppScraper: Scrape = new Scrape();

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
        if (e instanceof Error) {
            // error
            logger.debug('err: electron thread');
            // error
            logger.error(e.message);
        }
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
    const icon: Electron.NativeImage = nativeImage.createFromPath(path.join(__dirname, '../assets/aozora.ico'));
    // tray
    const mainTray: Electron.Tray = new Tray(icon);
    // context menu
    const contextMenu: Electron.Menu = Menu.buildFromTemplate([
        // show
        {
            label: 'show', click: () => {
                mainWindow.show();
            }
        },
        // close
        {
            label: 'close', click: () => {
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
        // last array
        let wholeArray: any = [];
        // last array
        let finalArray: string[][] = [];
        // filename
        const fileName: string = (new Date).toISOString().replace(/[^\d]/g, '').slice(0, 8);
        // init scraper
        await puppScraper.init();
        // URL
        logger.debug(`total is ${MAX_AUTHORS}`);
        // update total
        event.sender.send('total', MAX_AUTHORS);
        logger.debug('doPageScrape mode');

        // for loop
        const nums: number[] = makeNumberRange(1, MAX_AUTHORS);

        // loop
        for await (const i of nums) {
            try {
                // tmp array
                let tmpArray: string[] = [];
                // last array
                let finalArray: string[][] = [];
                // URL
                const aozoraUrl: string = `${DEF_AOZORA_URL}${i}.html`;
                logger.debug(`process: scraping ${aozoraUrl}`);
                // move to top
                await puppScraper.doGo(aozoraUrl);
                // wait 1 sec
                await puppScraper.doWaitFor(1000);
                logger.debug('doAuthorScrape mode');
                // row loop number
                const rows: number[] = makeNumberRange(1, 5);
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
                        if (err1 instanceof Error) {
                            // error
                            logger.debug('err2: scrape row loop');
                            logger.error(err1.message);
                        }
                    }

                }
                // set to finalArray
                finalArray.push(tmpArray);
                // wait for 1sec
                await puppScraper.doWaitFor(1000);

            } catch (err2: unknown) {
                if (err2 instanceof Error) {
                    // error
                    logger.debug('err2: scrape row loop');
                    logger.error(err2.message);
                }
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
            // put into wholearray
            wholeArray.push(finalArray);
            // wait for 1sec
            await puppScraper.doWaitFor(1000);
        }
        // csv filename
        const filePath: string = `${OUTPUT_PATH}${fileName}.csv`;
        // header
        const columns: { [key: string]: string } = {
            number: 'No.', // number
            authorname: '作家名', // authorname
            ruby: '作家名読み', // ruby
            roman: 'ローマ字表記', // roman
            birth: '生年', // birth
            dod: '没年', // dod
        };
        // finaljson
        let finalJsonArray: any[] = [];
        // all races
        wholeArray.forEach((authors: any) => {
            // for training
            authors.forEach((author: any) => {
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
        });
        // write data
        await csvMaker.makeCsvData(finalJsonArray, columns, filePath);
        // wait for 1sec
        await puppScraper.doWaitFor(1000);
        // end message
        dialogMaker.showmessage('info', 'completed.');

    } catch (e: unknown) {
        if (e instanceof Error) {
            // error
            logger.debug('err1: main thread');
            logger.error(e.message);
        }

    } finally {
        // close scraper
        await puppScraper.doClose();
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
        if (e instanceof Error) {
            // error
            logger.debug('err2: exit thread');
            logger.error(e.message);
        }
    }
});

// number array
const makeNumberRange = (start: number, end: number) => [...new Array(end - start).keys()].map(n => n + start);