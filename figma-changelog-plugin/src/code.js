var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { pipe } from "fp-ts/function";
import * as OptionFP from "fp-ts/Option";
const CHANGELOG_PAGE_NAME = "📒 Changelog";
// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).
// This shows the HTML page in "ui.html".
figma.showUI(__html__);
// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(msg);
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'create-changelog') {
        const fileKey = figma.fileKey;
        console.log(fileKey);
        figma.ui.postMessage({ type: 'get-changelog', fileKey: fileKey });
    }
    if (msg.type === "set-history") {
        const pageNode = figma.root
            .findAllWithCriteria({
            types: ["PAGE"],
        })
            .find((page) => page.name === CHANGELOG_PAGE_NAME);
        const changelogPage = pipe(pageNode, OptionFP.fromNullable, OptionFP.fold(() => {
            const newPage = figma.createPage();
            newPage.name = CHANGELOG_PAGE_NAME;
            return newPage;
        }, (page) => page));
        console.log({ msg });
        console.log(changelogPage);
        figma.closePlugin();
    }
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    // figma.closePlugin();
});
