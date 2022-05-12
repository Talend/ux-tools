import * as FetchVersionHistory from "./fetch-version-history";
import * as DisplayHistory from "./display-version-history";
import * as AddHistory from "./add-history";

// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 360, height: 280 });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = async (msg) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === FetchVersionHistory.messageName) {
    FetchVersionHistory.handleRequest({ createPage: false });
  }

  if (msg.type === DisplayHistory.messageName) {
    await DisplayHistory.handleEvent(msg);
  }

  if (msg.type === AddHistory.messageName) {
    await AddHistory.handleEvent(msg);
  }

  if (msg.type === "cancel") {
    figma.closePlugin();
  }
};

export {};
