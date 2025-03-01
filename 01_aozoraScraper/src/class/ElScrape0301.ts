/**
 * ELScrape.ts
 *
 * name：ELScrape
 * function：scraping site for electron
 * updated: 2025/03/01
 **/

'use strict';

const DISABLE_EXTENSIONS: string = '--disable-extensions'; // disable extension
const ALLOW_INSECURE: string = '--allow-running-insecure-content'; // allow insecure content
const IGNORE_CERT_ERROR: string = '--ignore-certificate-errors'; // ignore cert-errors
const NO_SANDBOX: string = '--no-sandbox'; // no sandbox
const DISABLE_SANDBOX: string = '--disable-setuid-sandbox'; // no setup sandbox
const DISABLE_DEV_SHM: string = '--disable-dev-shm-usage'; // no dev shm
const DISABLE_GPU: string = '--disable-gpu'; // no gpu
const NO_FIRST_RUN: string = '--no-first-run'; // no first run
const NO_ZYGOTE: string = '--no-zygote'; // no zygote
const MAX_SCREENSIZE: string = '--start-maximized'; // max screen
const DEF_USER_AGENT: string =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36'; // useragent

// define modules
import { setTimeout } from 'node:timers/promises'; // wait for seconds
import puppeteer from 'puppeteer'; // Puppeteer for scraping
import ELLogger from './ElLogger'; // logger

//* Interfaces
// puppeteer options
interface puppOption {
  headless: boolean; // display mode
  ignoreDefaultArgs: string[]; // ignore extensions
  args: string[]; // args
}

// class
export class Scrape {
  static logger: any; // static logger
  static browser: any; // static browser
  static page: any; // static page

  private _result: boolean; // scrape result
  private _height: number; // body height

  // constractor
  constructor(appname: string) {
    // result
    this._result = false;
    // height
    this._height = 0;
    // logger setting
    Scrape.logger = new ELLogger(appname, 'scrape');
    Scrape.logger.info('scrape: constructed.');
  }

  // initialize
  init(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: initialize started.');
        // pupp options
        const puppOptions: puppOption = {
          headless: false, // no display mode
          ignoreDefaultArgs: [DISABLE_EXTENSIONS], // ignore extensions
          args: [
            /*
            NO_SANDBOX,
            DISABLE_SANDBOX,
            DISABLE_DEV_SHM,
            DISABLE_GPU,
            NO_FIRST_RUN,
            NO_ZYGOTE,
            ALLOW_INSECURE,
            IGNORE_CERT_ERROR,
            MAX_SCREENSIZE,
            */
          ], // args
        };
        // lauch browser
        Scrape.browser = await puppeteer.launch(puppOptions);
        // create new page
        Scrape.page = await Scrape.browser.newPage();
        // set viewport
        Scrape.page.setViewport({
          width: 1920,
          height: 1000,
        });
        // mimic agent
        await Scrape.page.setUserAgent(DEF_USER_AGENT);
        // resolved
        resolve();
        Scrape.logger.info('scrape: initialize end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // get page url
  getUrl(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: getUrl start.');
        // resolved
        resolve(await Scrape.page.url());
        Scrape.logger.info('scrape: getUrl end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        // reject
        reject('error');
      }
    });
  }

  // get page title
  getTitle(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: getTitle start.');
        // resolved
        resolve(await Scrape.page.title);
        Scrape.logger.info('scrape: getTitle end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        // reject
        reject('error');
      }
    });
  }

  // get a href
  getHref(elem: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: getHref start.');
        // resolved
        resolve(await Scrape.page.$eval(elem, (elm: any) => elm.href));
        Scrape.logger.info('scrape: getHref end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        // reject
        reject('error');
      }
    });
  }

  // press enter
  pressEnter(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: pressEnter start.');
        // press enter key
        await Scrape.page.keyboard.press('Enter');
        Scrape.logger.info('scrape: pressEnter end.');
        // resolved
        resolve();
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // go page
  doGo(targetPage: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: doGo start.');
        // goto target page
        await Scrape.page.goto(targetPage);
        // get page height
        const height = await Scrape.page.evaluate(() => {
          return document.body.scrollHeight;
        });
        // body height
        this._height = height;
        // resolved
        resolve();
        Scrape.logger.info('scrape: doGo end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // goback
  doGoBack(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: doGoBack start.');
        // go back
        await Scrape.page.goBack();
        // resolved
        resolve();
        Scrape.logger.info('scrape: doGoBack end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // click
  doClick(elem: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: doClick start.');
        // click target element
        await Scrape.page.$$eval(elem, (elements: any) => elements[0].click());
        // resolved
        resolve();
        Scrape.logger.info('scrape: doClick end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // type
  doType(elem: string, value: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: doType start.');
        // type element on specified value
        await Scrape.page.type(elem, value, { delay: 100 });
        // resolved
        resolve();
        Scrape.logger.info('scrape: doType end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // clear
  doClear(elem: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: doClear start.');
        // clear the textbox
        await Scrape.page.$eval(elem, (element: any) => (element.value = ''));
        // resolved
        resolve();
        Scrape.logger.info('scrape: doClear end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // select
  doSelect(elem: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: doSelect start.');
        // select dropdown element
        await Scrape.page.select(elem);
        // resolved
        resolve();
        Scrape.logger.info('scrape: doSelect end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // screenshot
  doScreenshot(path: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: doScreenshot start.');
        // take screenshot of window
        await Scrape.page.screenshot({ path: path });
        // resolved
        resolve();
        Scrape.logger.info('scrape: doScreenshot end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // mouse wheel
  mouseWheel(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: mouseWheel start.');
        // mouse wheel to bottom
        await Scrape.page.mouse.wheel({ deltaY: this._height - 200 });
        // resolved
        resolve();
        Scrape.logger.info('scrape: mouseWheel end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // eval
  doSingleEval(selector: string, property: string): Promise<string> {
    return new Promise(async (resolve, _) => {
      try {
        Scrape.logger.info('scrape: doSingleEval start.');
        // target item
        const exists: boolean = await Scrape.page
          .$eval(selector, () => true)
          .catch(() => false);

        // no result
        if (!exists) {
          Scrape.logger.info('scrape: not exists');
          resolve('');
        } else {
          // target value
          const item: any = await Scrape.page.$(selector);

          // if not null
          if (item !== null) {
            // got data
            const data: string = await (
              await item.getProperty(property)
            ).jsonValue();

            // if got data not null
            if (data) {
              // resolved
              resolve(data);
            } else {
              Scrape.logger.debug('scrape: nodata error');
              resolve('');
            }
          } else {
            Scrape.logger.debug('scrape: target null');
            resolve('');
          }
          Scrape.logger.info('scrape: doSingleEval end.');
        }
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        resolve('error');
      }
    });
  }

  // eval
  doMultiEval(selector: string, property: string): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: doMultiEval start.');
        // data set
        let datas: string[] = [];
        // target list
        const list: any = await Scrape.page.$$(selector);
        // result
        const result: boolean = await Scrape.page
          .$(selector)
          .then((res: any) => !!res);

        // if element exists
        if (result) {
          // loop in list
          for (const ls of list) {
            // push to data set
            datas.push(await (await ls.getProperty(property)).jsonValue());
          }
          // resolved
          resolve(datas);
        }
        Scrape.logger.info('scrape: doMultiEval end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        reject('error');
      }
    });
  }

  // waitSelector
  doWaitFor(time: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: doWaitFor start.');
        // wait for time
        await setTimeout(time);
        resolve();
        Scrape.logger.info('scrape: doWaitFor end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        reject();
      }
    });
  }

  // waitSelector
  doWaitSelector(elem: string, time: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: doWaitSelector start.');
        // target item
        const exists: boolean = await Scrape.page
          .$eval(elem, () => true)
          .catch(() => false);

        // if element exists
        if (exists) {
          // wait for loading selector
          await Scrape.page.waitForSelector(elem, { timeout: time });
          // resolved
          resolve();
        }
        Scrape.logger.info('scrape: doWaitSelector end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        reject();
      }
    });
  }

  // wait for navigaion
  doWaitForNav(time: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: doWaitForNav start.');
        // wait for time
        await Scrape.page.waitForNavigation({
          waitUntil: 'networkidle2',
          timeout: time,
        });
        resolve();
        Scrape.logger.info('scrape: doWaitForNav end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        reject();
      }
    });
  }

  // check Selector
  doCheckSelector(elem: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: doCheckSelector start.');
        // target item
        const exists: boolean = await Scrape.page
          .$eval(elem, () => true)
          .catch(() => false);
        // return true/false
        resolve(exists);
        Scrape.logger.info('scrape: doCheckSelector end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        reject(false);
      }
    });
  }

  // close window
  doClose(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: doClose start.');
        // close browser
        await Scrape.browser.close();
        // close page
        await Scrape.page.close();
        // resolved
        resolve();
        Scrape.logger.info('scrape: doClose end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        reject();
      }
    });
  }

  // reload
  doReload(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.info('scrape: doReload start.');
        // close browser
        await Scrape.page.reload();
        // resolved
        resolve();
        Scrape.logger.info('scrape: doReload end.');
      } catch (e: unknown) {
        // error
        Scrape.logger.error(e);
        reject();
      }
    });
  }

  // set result
  set setSucceed(selector: string) {
    // Do something with val that takes time
    this._result = Scrape.page.$(selector).then((res: any) => !!res);
  }

  // get result
  get getSucceed(): boolean {
    return this._result;
  }
}
