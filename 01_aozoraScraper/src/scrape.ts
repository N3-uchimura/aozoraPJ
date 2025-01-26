/*
 * scrape.ts
 *
 * function：Node.js server
 **/

'use strict';

// const
const FIRST_BOOK_ROWS: number = 1;
const FIRST_PAGE_ROWS: number = 2;
const MAX_PAGE_ROWS: number = 52;
const DEF_AOZORA_URL: string = 'https://www.aozora.gr.jp/index_pages/sakuhin_'; // scraping root

// import modules
import { BrowserWindow, app, ipcMain, dialog, Tray, Menu, nativeImage } from 'electron'; // electron
import * as path from 'path'; // path
import { Scrape } from './class/Scrape1103'; // scraper
import ELLogger from './class/MyLogger0301el'; // logger
import Dialog from './class/ElectronDialog0120'; // dialog
import mkdir from './class/Mkdir0126'; // mdkir

// success
let successCounter: number = 0;
// faile
let failCounter: number = 0;
// loggeer instance
const logger: ELLogger = new ELLogger('./logs', 'access');
// scraper
const puppScraper: Scrape = new Scrape();
// dialog
const dialogMaker: Dialog = new Dialog();
// mkdir
const mkdirManager = new mkdir();
// zip linkselector
const zipLinkSelector: string = 'body > table.download > tbody > tr:nth-child(2) > td:nth-child(3) > a';

// links
const linkSelection: any = Object.freeze({
    あ: 'a',
    い: 'i',
    う: 'u',
    え: 'e',
    お: 'o',
    か: 'ka',
    き: 'ki',
    く: 'ku',
    け: 'ke',
    こ: 'ko',
    さ: 'sa',
    し: 'si',
    す: 'su',
    せ: 'se',
    そ: 'so',
    た: 'ta',
    ち: 'ti',
    つ: 'tu',
    て: 'te',
    と: 'to',
    な: 'na',
    に: 'ni',
    ぬ: 'nu',
    ね: 'ne',
    の: 'no',
    は: 'ha',
    ひ: 'hi',
    ふ: 'hu',
    へ: 'he',
    ほ: 'ho',
    ま: 'ma',
    み: 'mi',
    む: 'mu',
    め: 'me',
    も: 'mo',
    や: 'ya',
    ゆ: 'yu',
    よ: 'yo',
    ら: 'ra',
    り: 'ri',
    る: 'ru',
    れ: 're',
    ろ: 'ro',
    わ: 'wa',
    を: 'wo',
    ん: 'nn',
    A: 'zz',
});

// links number
const numSelection: any = Object.freeze({
    あ: 21,
    い: 10,
    う: 7,
    え: 5,
    お: 14,
    か: 20,
    き: 14,
    く: 8,
    け: 8,
    こ: 17,
    さ: 11,
    し: 35,
    す: 5,
    せ: 18,
    そ: 6,
    た: 12,
    ち: 8,
    つ: 5,
    て: 8,
    と: 11,
    な: 6,
    に: 9,
    ぬ: 1,
    ね: 2,
    の: 3,
    は: 17,
    ひ: 10,
    ふ: 14,
    へ: 4,
    ほ: 7,
    ま: 6,
    み: 6,
    む: 4,
    め: 3,
    も: 4,
    や: 5,
    ゆ: 6,
    よ: 6,
    ら: 3,
    り: 3,
    る: 1,
    れ: 2,
    ろ: 3,
    わ: 7,
    A: 1,
})

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
        mainWindow.loadFile(path.join(__dirname, '../scrape.html'));
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
    mkdirManager.mkDir('./logs');
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

        // init scraper
        await puppScraper.init();

        // URL
        for await (const [key, value] of Object.entries(linkSelection)) {
            try {
                logger.debug(`process: getting ${key} 行`);
                // loop number
                const childLength: number = numSelection[key];

                // within total 
                if (childLength >= FIRST_BOOK_ROWS) {
                    logger.debug(`total is ${childLength}`);
                    // update total
                    event.sender.send('total', childLength * 50);
                    // now URL
                    event.sender.send('pageUpdate', `${key} 行`);
                    logger.debug('doPageScrape mode');

                    // for loop
                    const nums: number[] = makeNumberRange(FIRST_BOOK_ROWS, childLength + 1);

                    // loop
                    for await (const j of nums) {
                        try {
                            // URL
                            const aozoraUrl: string = `${DEF_AOZORA_URL}${value}${j}.html`;
                            logger.debug(`process: scraping ${aozoraUrl}`);
                            // move to top
                            await puppScraper.doGo(aozoraUrl);
                            // wait 1 sec
                            await puppScraper.doWaitFor(1000);
                            logger.debug('doUrlScrape mode');
                            // loop number
                            const links: number[] = makeNumberRange(FIRST_PAGE_ROWS, MAX_PAGE_ROWS);

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
                                        const zipHref: string = await puppScraper.getHref(zipLinkSelector);
                                        logger.debug(zipHref);

                                        if (zipHref.includes('.zip')) {
                                            await Promise.all([
                                                // wait for 1sec
                                                await puppScraper.doWaitFor(1000),
                                                // wait for datalist
                                                await puppScraper.doWaitSelector(zipLinkSelector, 3000),
                                                // download zip
                                                await puppScraper.doClick(zipLinkSelector),
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
                                    if (err1 instanceof Error) {
                                        // error
                                        logger.debug('err4: download thread loop');
                                        logger.error(err1.message);
                                        // fail
                                        failCounter++;
                                        // goback
                                        await puppScraper.doGoBack();
                                    }

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
                            if (err2 instanceof Error) {
                                // error
                                logger.debug('err3: scrape thread loop');
                                logger.error(err2.message);
                            }
                        }
                    }

                }

            } catch (err3: unknown) {
                if (err3 instanceof Error) {
                    // error
                    logger.debug('err1: main thread loop');
                    logger.error(err3.message);
                }
            }
        }
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