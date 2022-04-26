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
figma.ui.onmessage = async msg => {
  console.log(msg);
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'create-changelog') {
    const fileKey = figma.fileKey;
    console.log(fileKey);
    figma.ui.postMessage({ type: 'get-changelog', fileKey: fileKey });
  }

  if (msg.type === "set-history") {
    const pageNode: PageNode | undefined = figma.root
      .findAllWithCriteria({
        types: ["PAGE"],
      })
      .find((page) => page.name === CHANGELOG_PAGE_NAME);

    const changelogPage = pipe(
        pageNode,
        OptionFP.fromNullable,
        OptionFP.fold(
            () => {
              const newPage = figma.createPage();
              newPage.name = CHANGELOG_PAGE_NAME;
              return newPage;
            },
            (page) => page,
        ),
    );

    console.log({msg});
    console.log(changelogPage);
    figma.closePlugin();
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  // figma.closePlugin();
};

export {}


