/**
 * ElScrape.ts
 *
 * class：ElScrape
 * function：scraping site
 * updated: 2025/05/17
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
const DISABLE_BALANCED_MODE: string = '--disable-features=HttpsFirstBalancedModeAutoEnable';
const DEF_USER_AGENT: string =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36'; // useragent

// define modules
import { setTimeout } from 'node:timers/promises'; // wait for seconds
import puppeteer from 'puppeteer'; // Puppeteer for scraping

//* Interfaces
// puppeteer options
interface puppOption {
  headless: boolean; // display mode
  ignoreDefaultArgs: string[]; // ignore extensions
  args: string[]; // args
}

// class
export class Scrape {
  static logger: any; // logger
  static browser: any; // static browser
  static page: any; // static page
  private _result: boolean; // scrape result
  private _height: number; // body height

  // constractor
  constructor(logger: any) {
    // loggeer instance
    Scrape.logger = logger;
    // result
    this._result = false;
    // height
    this._height = 0;
    Scrape.logger.debug('scrape: constructed');
  }

  // initialize
  init(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.debug('scrape: initialize mode.');
        const puppOptions: puppOption = {
          headless: true, // no display mode
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
            DISABLE_BALANCED_MODE
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
        //await Scrape.page.setUserAgent(DEF_USER_AGENT);
        Scrape.logger.debug('scrape: initialize finished.');
        // resolved
        resolve();

      } catch (e: unknown) {
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
        Scrape.logger.debug('scrape: getUrl mode.');
        // resolved
        resolve(await Scrape.page.url());

      } catch (e: unknown) {
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
        Scrape.logger.debug('scrape: getTitle mode.');
        // resolved
        resolve(await Scrape.page.title);

      } catch (e: unknown) {
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
        Scrape.logger.debug('scrape: getHref mode.');
        // resolved
        resolve(await Scrape.page.$eval(elem, (elm: any) => elm.href));

      } catch (e: unknown) {
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
        Scrape.logger.debug('scrape: pressEnter mode.');
        // press enter key
        await Scrape.page.keyboard.press('Enter');
        // resolved
        resolve();

      } catch (e: unknown) {
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
        Scrape.logger.debug('scrape: doGo mode.');
        // goto target page
        Scrape.logger.debug(targetPage);
        await Scrape.page.goto(targetPage);
        // get page height
        const height = await Scrape.page.evaluate(() => {
          return document.body.scrollHeight;
        });
        // body height
        this._height = height;
        // resolved
        resolve();

      } catch (e: unknown) {
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
        Scrape.logger.debug('scrape: doGoBack mode.');
        // go back
        await Scrape.page.goBack();
        // resolved
        resolve();

      } catch (e: unknown) {
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
        Scrape.logger.debug('scrape: doClick mode.');
        // click target element
        await Scrape.page.$$eval(elem, (elements: any) => elements[0].click());
        // resolved
        resolve();

      } catch (e: unknown) {
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
        Scrape.logger.debug('scrape: doType mode.');
        // type element on specified value
        await Scrape.page.type(elem, value, { delay: 100 });
        // resolved
        resolve();

      } catch (e: unknown) {
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
        Scrape.logger.debug('scrape: doClear mode.');
        // clear the textbox
        await Scrape.page.$eval(elem, (element: any) => (element.value = ''));
        // resolved
        resolve();

      } catch (e: unknown) {
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
        Scrape.logger.debug('scrape: doSelect mode.');
        // select dropdown element
        await Scrape.page.select(elem);
        // resolved
        resolve();

      } catch (e: unknown) {
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
        Scrape.logger.debug('scrape: doScreenshot mode.');
        // take screenshot of window
        await Scrape.page.screenshot({ path: path });
        // resolved
        resolve();

      } catch (e: unknown) {
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
        Scrape.logger.debug('scrape: mouseWheel mode.');
        // mouse wheel to bottom
        await Scrape.page.mouse.wheel({ deltaY: this._height - 200 });
        // resolved
        resolve();

      } catch (e: unknown) {
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
        Scrape.logger.debug('scrape: doSingleEval mode.');
        // target item
        const exists: boolean = await Scrape.page.$eval(selector, () => true).catch(() => false);

        // no result
        if (!exists) {
          console.log('not exists');
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
              console.log('nodata error');
              resolve('');
            }

          } else {
            console.log('target null');
            resolve('');
          }
        }

      } catch (e: unknown) {
        Scrape.logger.error(e);
        resolve('error');
      }
    });
  }

  // eval
  doMultiEval(selector: string, property: string): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.debug('scrape: doMultiEval mode.');
        // data set
        let datas: string[] = [];
        // target list
        const list: any = await Scrape.page.$$(selector);
        // result
        const result: boolean = await Scrape.page.$(selector).then((res: any) => !!res);

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

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject('error');
      }
    });
  }

  // waitSelector
  doWaitFor(time: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.debug('scrape: doWaitFor mode.');
        // wait for time
        await setTimeout(time);
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // waitSelector
  doWaitSelector(elem: string, time: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.debug('scrape: doWaitSelector mode.');
        // target item
        const exists: boolean = await Scrape.page.$eval(elem, () => true).catch(() => false);

        // if element exists
        if (exists) {
          // wait for loading selector
          await Scrape.page.waitForSelector(elem, { timeout: time });
          // resolved
          resolve();
        }

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // wait for navigaion
  doWaitForNav(time: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.debug('scrape: doWaitForNav mode.');
        // wait for time
        await Scrape.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: time });
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // check Selector
  doCheckSelector(elem: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.debug('scrape: doCheckSelector mode.');
        // target item
        const exists: boolean = await Scrape.page.$eval(elem, () => true).catch(() => false);
        // return true/false
        resolve(exists);

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject(false);
      }
    });
  }

  // close window
  doClose(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.debug('scrape: doClose mode.');
        // close browser
        await Scrape.browser.close();
        // close page
        await Scrape.page.close();
        // resolved
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // reload
  doReload(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.debug('scrape: doReload mode.');
        // close browser
        await Scrape.page.reload();
        // resolved
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
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
