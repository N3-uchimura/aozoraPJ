/**
 * ElectronDialog.ts
 *
 * ElectronDialog
 * function：Dialog operation for electron
 * updated: 2025/01/20
 **/

"use strict";

/// import modules
import { dialog } from "electron"; // electron

const CHOOSE_IMG_FILE: string = "画像を選択してください"; // select image

// ElectronDialog class
class Dialog {
  // construnctor
  constructor() {}

  /// show question
  // show yes/no
  showQuetion(title: string, message: string, detail: string): number {
    try {
      // quetion message option
      const options: Electron.MessageBoxSyncOptions = {
        type: "question",
        title: title,
        message: message,
        detail: detail,
        buttons: ["yes", "no"],
        cancelId: -1, // Esc
      };
      // selected number
      const selected: number = dialog.showMessageBoxSync(options);
      // return selected
      return selected;
    } catch (e: unknown) {
      // error
      if (e instanceof Error) {
        // error
        console.log(e.message);
      }
      return 99;
    }
  }

  // show image
  showImage(properties: any): any {
    try {
      // quetion message option
      const options: Electron.OpenDialogSyncOptions = {
        properties: properties, // file
        title: CHOOSE_IMG_FILE, // file selection
        defaultPath: ".", // root path
        filters: [
          { name: "jpg|png", extensions: ["jpg", "jpeg", "png"] }, // jpg|png
        ],
      };
      // result
      const result: any = dialog.showOpenDialog(options);
      // return selected
      return result;
    } catch (e: unknown) {
      // error
      if (e instanceof Error) {
        // error
        console.log(e.message);
      }
      return 99;
    }
  }

  // show message
  showmessage(type: string, message: string) {
    try {
      // mode
      let tmpType:
        | "none"
        | "info"
        | "error"
        | "question"
        | "warning"
        | undefined;
      // title
      let tmpTitle: string | undefined;

      // url
      switch (type) {
        // info mode
        case "info":
          tmpType = "info";
          tmpTitle = "info";
          break;

        // error mode
        case "error":
          tmpType = "error";
          tmpTitle = "error";
          break;

        // warning mode
        case "warning":
          tmpType = "warning";
          tmpTitle = "warning";
          break;

        // others
        default:
          tmpType = "none";
          tmpTitle = "";
      }

      // options
      const options: Electron.MessageBoxOptions = {
        type: tmpType, // type
        message: tmpTitle, // title
        detail: message, // description
      };
      // show dialog
      dialog.showMessageBox(options);
    } catch (e: unknown) {
      // error
      if (e instanceof Error) {
        // error
        console.log(e.message);
      }
    }
  }
}

// export module
export default Dialog;
