/**
 * Scrape.ts
 *
 * class：Scrape
 * function：scraping site
 * updated: 2024/11/03
 **/

const DISABLE_EXTENSIONS: string = "--disable-extensions"; // disable extension
const ALLOW_INSECURE: string = "--allow-running-insecure-content"; // allow insecure content
const IGNORE_CERT_ERROR: string = "--ignore-certificate-errors"; // ignore cert-errors
const NO_SANDBOX: string = "--no-sandbox"; // no sandbox
const DISABLE_SANDBOX: string = "--disable-setuid-sandbox"; // no setup sandbox
const DISABLE_DEV_SHM: string = "--disable-dev-shm-usage"; // no dev shm
const DISABLE_GPU: string = "--disable-gpu"; // no gpu
const NO_FIRST_RUN: string = "--no-first-run"; // no first run
const NO_ZYGOTE: string = "--no-zygote"; // no zygote
const MAX_SCREENSIZE: string = "--start-maximized"; // max screen
const DEF_USER_AGENT: string =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"; // useragent

// define modules
import { setTimeout } from 'node:timers/promises'; // wait for seconds
import puppeteer from "puppeteer"; // Puppeteer for scraping

//* Interfaces
// class
export class Scrape {
  static browser: any; // static browser
  static page: any; // static page

  private _result: boolean; // scrape result
  private _height: number; // body height

  // constractor
  constructor() {
    // result
    this._result = false;
    // height
    this._height = 0;
  }

  // initialize
  init(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const puppOptions: any = {
          headless: true, // no display mode
          ignoreDefaultArgs: [], // ignore extensions
          /*
          args: [
            NO_SANDBOX,
            DISABLE_SANDBOX,
            DISABLE_DEV_SHM,
            DISABLE_GPU,
            NO_FIRST_RUN,
            NO_ZYGOTE,
            ALLOW_INSECURE,
            IGNORE_CERT_ERROR,
            MAX_SCREENSIZE,
          ], // args
          */
        };
        // lauch browser
        Scrape.browser = await puppeteer.launch(puppOptions);
        // create new page
        Scrape.page = await Scrape.browser.newPage();
        // set viewport
        Scrape.page.setViewport({
          width: 1000,
          height: 1000,
        });
        // mimic agent
        await Scrape.page.setUserAgent(DEF_USER_AGENT);
        // resolved
        resolve();

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`init: ${e.message}`);
          // reject
          reject();
        }
      }
    });
  }

  // get page url
  getUrl(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // resolved
        resolve(await Scrape.page.url());

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`getTitle: ${e.message}`);
          // reject
          reject(e.message);
        }
      }
    });
  }

  // get page title
  getTitle(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // resolved
        resolve(await Scrape.page.title);

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`getTitle: ${e.message}`);
          // reject
          reject(e.message);
        }
      }
    });
  }

  // get a href
  getHref(elem: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // resolved
        resolve(await Scrape.page.$eval(elem, (elm: any) => elm.href));

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`getHref: ${e.message}`);
          // reject
          reject(e.message);
        }
      }
    });
  }

  // press enter
  pressEnter(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // press enter key
        await Scrape.page.keyboard.press("Enter");
        // resolved
        resolve();

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`pressEnter: ${e.message}`);
          // reject
          reject();
        }
      }
    });
  }

  // go page
  doGo(targetPage: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // goto target page
        await Scrape.page.goto(targetPage);
        // resolved
        resolve();

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`doGo: ${e.message}`);
          // reject
          reject();
        }
      }
    });
  }

  // goback
  doGoBack(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // go back
        await Scrape.page.goBack();
        // resolved
        resolve();

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`doGoBack: ${e.message}`);
          // reject
          reject(e.message);
        }
      }
    });
  }

  // click
  doClick(elem: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // click target element
        await Scrape.page.$$eval(elem, (elements: any) => elements[0].click());
        // resolved
        resolve();

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`doClick: ${e.message}`);
          // reject
          reject();
        }
      }
    });
  }

  // type
  doType(elem: string, value: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // type element on specified value
        await Scrape.page.type(elem, value, { delay: 100 });
        // resolved
        resolve();

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`doType: ${e.message}`);
          // reject
          reject();
        }
      }
    });
  }

  // clear
  doClear(elem: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // clear the textbox
        await Scrape.page.$eval(elem, (element: any) => (element.value = ""));
        // resolved
        resolve();

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`doClear: ${e.message}`);
          // reject
          reject();
        }
      }
    });
  }

  // select
  doSelect(elem: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // select dropdown element
        await Scrape.page.select(elem);
        // resolved
        resolve();

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`doSelect: ${e.message}`);
          // reject
          reject();
        }
      }
    });
  }

  // screenshot
  doScreenshot(path: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // take screenshot of window
        await Scrape.page.screenshot({ path: path });
        // resolved
        resolve();

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`doScreenshot: ${e.message}`);
          // reject
          reject();
        }
      }
    });
  }

  // mouse wheel
  mouseWheel(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(this._height);
        // mouse wheel to bottom
        await Scrape.page.mouse.wheel({ deltaY: this._height - 200 });
        // resolved
        resolve();

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`mouseWheel: ${e.message}`);
          // reject
          reject();
        }
      }
    });
  }

  // eval
  doSingleEval(selector: string, property: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
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
            reject("error");
          }
        }

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`doSingleEval: ${e.message}`);
          // reject
          reject(e.message);
        }
      }
    });
  }

  // eval
  doMultiEval(selector: string, property: string): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      try {
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
            try {
              // push to data set
              datas.push(await (await ls.getProperty(property)).jsonValue());
            } catch (e: unknown) {
              // if type is error
              if (e instanceof Error) {
                // error
                console.log(`doMultiEval: ${e.message}`);
                // reject
                reject(e.message);
              }
            }
          }
          // resolved
          resolve(datas);
        }

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`doMultiEval: ${e.message}`);
          // reject
          reject(e.message);
        }
      }
    });
  }

  // waitSelector
  doWaitFor(time: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // wait for time
        await setTimeout(time);
        resolve();

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`doWaitFor: ${e.message}`);
          // reject
          reject();
        }
      }
    });
  }

  // waitSelector
  doWaitSelector(elem: string, time: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
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
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`doWaitSelector: ${e.message}`);
          // reject
          reject();
        }
      }
    });
  }

  // wait for navigaion
  doWaitForNav(time: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // wait for time
        await Scrape.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: time });
        resolve();

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`doWaitForNav: ${e.message}`);
          // reject
          reject();
        }
      }
    });
  }

  // check Selector
  doCheckSelector(elem: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        // target item
        const exists: boolean = await Scrape.page.$eval(elem, () => true).catch(() => false);
        // return true/false
        resolve(exists);

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`doCheckSelector: ${e.message}`);
          // reject
          reject(false);
        }
      }
    });
  }

  // close window
  doClose(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // close browser
        await Scrape.browser.close();
        // resolved
        resolve();

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`doClose: ${e.message}`);
          // reject
          reject();
        }
      }
    });
  }

  // reload
  doReload(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // close browser
        await Scrape.page.reload();
        // resolved
        resolve();

      } catch (e: unknown) {
        // if type is error
        if (e instanceof Error) {
          // error
          console.log(`doReload: ${e.message}`);
          // reject
          reject();
        }
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
