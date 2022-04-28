import { pipe } from "fp-ts/function";
import * as OptionFP from "fp-ts/Option";
import * as ArrayFP from "fp-ts/Array";
import * as NonEmptyArrayFP from "fp-ts/NonEmptyArray";
import tokens from "@talend/design-tokens/lib/light/dictionary";

function prefixWith0(value: number) {
  return value > 10 ? value : `0${value}`;
}

const fontTokens = pipe(
  tokens,
  ArrayFP.filter((token) => token.type === "typography")
);
const fillTokens = pipe(
  tokens,
  ArrayFP.filter((token) => token.type === "color")
);

type Version = {
  created_at: string;
  description?: string;
  id: string;
  label?: string;
};
type Log = {
  created_at: string;
  description: string;
  id: string;
  label: string;
  user: { handle: string; img_url: string; id: string };
};

const CHANGELOG_PAGE_NAME = "📒 Changelog";
const CHANGELOG_FRAME = "Changelog";

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
figma.ui.onmessage = async (msg) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === "create-changelog") {
    const { fileKey } = figma;
    figma.ui.postMessage({ type: "get-changelog", fileKey });
  }

  if (msg.type === "set-history") {
    const { fileKey } = figma;
    const pageNode: PageNode | undefined = figma.root
      .findAllWithCriteria({
        types: ["PAGE"],
      })
      .find((page) => page.name === CHANGELOG_PAGE_NAME);

    const versions: OptionFP.Option<NonEmptyArrayFP.NonEmptyArray<Log>> = pipe(
      msg.value,
      ArrayFP.filter<Log>((value: Version) => !!value.label),
      NonEmptyArrayFP.fromArray
    );

    // Colors from token package
    const headerStyleID = pipe(
      fontTokens,
      ArrayFP.filter((token) => token.name === "coralHeadingS"),
      (array) => array[0].id,
      (id) => id.replace("S:", "").replace(",", "")
    );
    const paragraphStyleID = pipe(
      fontTokens,
      ArrayFP.filter((token) => token.name === "coralParagraphM"),
      (array) => array[0].id,
      (id) => id.replace("S:", "").replace(",", "")
    );
    const paragraphSmallStyleID = pipe(
      fontTokens,
      ArrayFP.filter((token) => token.name === "coralParagraphS"),
      (array) => array[0].id,
      (id) => id.replace("S:", "").replace(",", "")
    );
    const neutralFillColor = pipe(
      fillTokens,
      ArrayFP.filter((token) => token.name === "coralColorNeutralText"),
      (array) => array[0].id,
      (id) => id.replace("S:", "").replace(",", "")
    );
    const neutralWeakFillColor = pipe(
      fillTokens,
      ArrayFP.filter((token) => token.name === "coralColorNeutralTextWeak"),
      (array) => array[0].id,
      (id) => id.replace("S:", "").replace(",", "")
    );

    // Get the styles from the tokens (async)
    await Promise.all([
      figma.loadFontAsync({
        family: "Source Sans Pro",
        style: "SemiBold",
      }),
      figma.loadFontAsync({
        family: "Source Sans Pro",
        style: "Regular",
      }),
      figma.importStyleByKeyAsync(headerStyleID),
      figma.importStyleByKeyAsync(paragraphStyleID),
      figma.importStyleByKeyAsync(paragraphSmallStyleID),
      figma.importStyleByKeyAsync(neutralFillColor),
      figma.importStyleByKeyAsync(neutralWeakFillColor),
    ]).then((results) => {
      const headerStyle = results[2];
      const paragraphStyle = results[3];
      const paragraphSmallStyle = results[4];
      const neutralTextColor = results[5];
      const neutralWeakTextColor = results[6];

      // Actual element tree construction
      pipe(
        versions,
        OptionFP.fold(
          () => figma.closePlugin(),
          (logs) => {
            // Create or locate changelog page
            const changelogPage = pipe(
              pageNode,
              OptionFP.fromNullable,
              OptionFP.fold(
                () => {
                  const newPage = figma.createPage();
                  newPage.name = CHANGELOG_PAGE_NAME;
                  return newPage;
                },
                (page) => page
              )
            );
            figma.currentPage = changelogPage;

            // Wipeout previous changelog frame
            pipe(
              changelogPage.findAllWithCriteria({ types: ["FRAME"] }),
              ArrayFP.filter((node) => node.name === CHANGELOG_FRAME),
              ArrayFP.map((node) => node.remove())
            );

            // Create the new frame with autolayout
            const logShell = figma.createFrame();
            logShell.layoutMode = "VERTICAL";
            logShell.name = CHANGELOG_FRAME;
            logShell.verticalPadding = 16;
            logShell.horizontalPadding = 16;
            logShell.cornerRadius = 4;
            logShell.itemSpacing = 16;
            logShell.resizeWithoutConstraints(600, 300);
            changelogPage.appendChild(logShell);

            pipe(
              logs,
              ArrayFP.map(async (node) => {
                const date = new Date(node.created_at);
                const hours = date.getHours();
                const minutes = date.getMinutes();

                const logEntry = figma.createFrame();
                logEntry.name = node.created_at;
                logEntry.layoutMode = "VERTICAL";
                logEntry.layoutAlign = "STRETCH";
                logShell.appendChild(logEntry);

                const title = figma.createText();
                title.textStyleId = headerStyle.id;
                title.fillStyleId = neutralTextColor.id;
                title.layoutAlign = "STRETCH";
                title.name = "title";
                title.characters = node.label;
                title.textAutoResize = "WIDTH_AND_HEIGHT";

                const description = figma.createText();
                description.textStyleId = paragraphStyle.id;
                description.fillStyleId = neutralTextColor.id;
                description.layoutAlign = "STRETCH";
                description.name = "description";
                description.characters = node.description;
                description.textAutoResize = "WIDTH_AND_HEIGHT";

                const createdBy = figma.createText();
                createdBy.textStyleId = paragraphSmallStyle.id;
                createdBy.fillStyleId = neutralWeakTextColor.id;
                createdBy.layoutAlign = "STRETCH";
                createdBy.name = "createdBy";
                createdBy.characters = `Created by ${
                  node.user.handle
                } on ${prefixWith0(date.getMonth())}/${prefixWith0(
                  date.getDay()
                )}/${date.getFullYear()} at ${prefixWith0(hours)}:${prefixWith0(
                  minutes
                )}`;
                createdBy.textAutoResize = "WIDTH_AND_HEIGHT";

                const link = figma.createText();
                const URL = `https://www.figma.com/file/${fileKey}/${figma.root.name}?version-id=${node.id}`;
                link.fillStyleId = neutralWeakTextColor.id;
                link.textStyleId = paragraphSmallStyle.id;
                link.layoutAlign = "STRETCH";
                link.name = "linkToVersion";
                link.characters = "Go to version";
                link.textAutoResize = "WIDTH_AND_HEIGHT";
                link.hyperlink = {
                  type: "URL",
                  value: URL,
                };

                logEntry.appendChild(title);
                logEntry.appendChild(description);
                logEntry.appendChild(createdBy);
                logEntry.appendChild(link);
              })
            );

            figma.closePlugin();
          }
        )
      );
    });
  }

  if (msg.type === "cancel") {
    figma.closePlugin();
  }
};

export {};
