import * as OptionFP from "fp-ts/Option";
import * as NonEmptyArrayFP from "fp-ts/NonEmptyArray";
import { pipe } from "fp-ts/function";
import * as ArrayFP from "fp-ts/Array";
import * as StringFP from "fp-ts/string";

import { format } from "date-fns";
import * as Tokens from "../tokens";

export type Version = {
  created_at: string;
  id: string;
  description?: string;
  label?: string;
  user: { handle: string; img_url: string; id: string };
};

const CHANGELOG_PAGE_NAME = "📒 Changelog";
const CHANGELOG_FRAME = "Changelog";

export const messageName = "set-history";

function getDateUTC(date: string): string {
  return pipe(date, StringFP.split("T"), (array) => {
    const dateDay = array[0].split("-");
    const JSDate = new Date(
      parseFloat(dateDay[0]),
      parseFloat(dateDay[1]) - 1,
      parseFloat(dateDay[2])
    );

    return format(JSDate, "dd LLL yyyy");
  });
}

export async function handleEvent(msg: {
  type: string;
  historyLogs: Version[];
}) {
  const { fileKey } = figma;
  const pageNode: PageNode | undefined = figma.root
    .findAllWithCriteria({
      types: ["PAGE"],
    })
    .find((page) => page.name === CHANGELOG_PAGE_NAME);

  const versions: OptionFP.Option<NonEmptyArrayFP.NonEmptyArray<Version>> =
    pipe(
      msg.historyLogs,
      ArrayFP.filter<Version>((value: Version) => !!value.label),
      NonEmptyArrayFP.fromArray
    );

  // Colors and styles from token package
  const headerStyleID = pipe(
    Tokens.fontTokens,
    ArrayFP.filter((token) => token.name === "coralHeadingS"),
    (array) => array[0].id,
    (id) => id.replace("S:", "").replace(",", "")
  );
  const paragraphStyleID = pipe(
    Tokens.fontTokens,
    ArrayFP.filter((token) => token.name === "coralParagraphM"),
    (array) => array[0].id,
    (id) => id.replace("S:", "").replace(",", "")
  );
  const paragraphSmallStyleID = pipe(
    Tokens.fontTokens,
    ArrayFP.filter((token) => token.name === "coralParagraphS"),
    (array) => array[0].id,
    (id) => id.replace("S:", "").replace(",", "")
  );
  const neutralFillColor = pipe(
    Tokens.fillTokens,
    ArrayFP.filter((token) => token.name === "coralColorNeutralText"),
    (array) => array[0].id,
    (id) => id.replace("S:", "").replace(",", "")
  );
  const neutralWeakFillColor = pipe(
    Tokens.fillTokens,
    ArrayFP.filter((token) => token.name === "coralColorNeutralTextWeak"),
    (array) => array[0].id,
    (id) => id.replace("S:", "").replace(",", "")
  );
  const accentFillColor = pipe(
    Tokens.fillTokens,
    ArrayFP.filter((token) => token.name === "coralColorAccentText"),
    (array) => array[0].id,
    (id) => id.replace("S:", "").replace(",", "")
  );
  const paragraphSmallBoldStyleID = pipe(
    Tokens.fontTokens,
    ArrayFP.filter((token) => token.name === "coralParagraphSBold"),
    (array) => array[0].id,
    (id) => id.replace("S:", "").replace(",", "")
  );
  const borderWeakStyleID = pipe(
    Tokens.fillTokens,
    ArrayFP.filter((token) => token.name === "coralColorNeutralBorderWeak"),
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
    figma.importStyleByKeyAsync(accentFillColor),
    figma.importStyleByKeyAsync(paragraphSmallBoldStyleID),
    figma.importStyleByKeyAsync(borderWeakStyleID),
  ]).then((results) => {
    const [
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      __,
      headerStyle,
      paragraphStyle,
      paragraphSmallStyle,
      neutralTextColor,
      neutralWeakTextColor,
      accentTextColor,
      paragraphSmallStyleBold,
      borderWeakColor,
    ] = results;

    // Actual element tree construction
    pipe(
      versions,
      OptionFP.fold(
        () => {
          figma.ui.postMessage({ type: "page-created" });
          figma.closePlugin();
        },
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
          logShell.itemSpacing = 0;
          logShell.resizeWithoutConstraints(480, 300);
          changelogPage.appendChild(logShell);

          pipe(
            logs,
            ArrayFP.map(async (version) => {
              const date = getDateUTC(version.created_at);

              const shell = figma.createFrame();
              shell.name = version.created_at;
              shell.layoutMode = "HORIZONTAL";
              shell.layoutAlign = "STRETCH";
              shell.primaryAxisSizingMode = "FIXED";
              shell.counterAxisSizingMode = "AUTO";
              shell.locked = true;
              shell.itemSpacing = 8;
              shell.counterAxisAlignItems = "MIN";
              shell.primaryAxisAlignItems = "MIN";
              logShell.appendChild(shell);

              /* const logEntry = figma.createFrame();
              logEntry.name = version.created_at;
              logEntry.layoutMode = "VERTICAL";
              logEntry.layoutAlign = "STRETCH";
              logEntry.locked = true;
              logShell.appendChild(logEntry); */

              const timeStamp = figma.createText();
              timeStamp.textStyleId = paragraphSmallStyleBold.id;
              timeStamp.fillStyleId = neutralWeakTextColor.id;
              timeStamp.name = "timestamp";
              timeStamp.characters = date;
              timeStamp.textAutoResize = "WIDTH_AND_HEIGHT";
              timeStamp.locked = true;
              timeStamp.resizeWithoutConstraints(65, 18);
              shell.appendChild(timeStamp);

              const decoration = figma.createFrame();
              decoration.name = "decoration";
              decoration.layoutMode = "VERTICAL";
              decoration.locked = true;
              decoration.itemSpacing = 0;
              decoration.layoutAlign = "STRETCH";
              decoration.primaryAxisSizingMode = "FIXED";
              decoration.counterAxisSizingMode = "AUTO";
              decoration.counterAxisAlignItems = "CENTER";
              decoration.primaryAxisAlignItems = "MIN";
              shell.appendChild(decoration);

              const line1 = figma.createLine();
              line1.name = "line";
              line1.fillStyleId = accentTextColor.id;
              line1.resizeWithoutConstraints(4, 0);
              line1.rotation = 90;
              line1.strokeStyleId = borderWeakColor.id;
              decoration.appendChild(line1);

              const dot = figma.createEllipse();
              dot.name = "dot";
              dot.fillStyleId = accentTextColor.id;
              dot.resizeWithoutConstraints(12, 12);
              decoration.appendChild(dot);

              const line = figma.createLine();
              line.name = "line";
              line.fillStyleId = accentTextColor.id;
              line.resizeWithoutConstraints(1, 0);
              // line.layoutAlign = "STRETCH";
              line.layoutGrow = 1;
              line.rotation = 90;
              line.strokeStyleId = borderWeakColor.id;
              decoration.appendChild(line);

              const data = figma.createFrame();
              data.name = "data";
              data.layoutMode = "VERTICAL";
              data.layoutGrow = 1;
              data.locked = true;
              data.itemSpacing = 4;
              data.paddingBottom = 32;
              // data.primaryAxisSizingMode = "FIXED";
              // data.counterAxisSizingMode = "AUTO";
              shell.appendChild(data);

              const title = figma.createText();
              title.textStyleId = headerStyle.id;
              title.fillStyleId = neutralTextColor.id;
              title.layoutAlign = "STRETCH";
              title.name = "title";
              title.characters = version.label || "New version";
              title.textAutoResize = "WIDTH_AND_HEIGHT";
              title.locked = true;

              const description = figma.createText();
              description.textStyleId = paragraphStyle.id;
              description.fillStyleId = neutralTextColor.id;
              description.layoutAlign = "STRETCH";
              description.name = "description";
              description.characters =
                version.description || "No description provided";
              description.textAutoResize = "WIDTH_AND_HEIGHT";
              description.locked = true;

              const createdBy = figma.createText();
              createdBy.textStyleId = paragraphSmallStyle.id;
              createdBy.fillStyleId = neutralWeakTextColor.id;
              createdBy.layoutAlign = "STRETCH";
              createdBy.name = "createdBy";
              createdBy.characters = `Created by ${version.user.handle}`;
              createdBy.textAutoResize = "WIDTH_AND_HEIGHT";
              createdBy.locked = true;

              const link = figma.createText();
              const URL = `https://www.figma.com/file/${fileKey}/${figma.root.name.replace(
                " ",
                "-"
              )}?version-id=${version.id}`;
              link.fillStyleId = accentTextColor.id;
              link.textStyleId = paragraphSmallStyleBold.id;
              link.layoutAlign = "STRETCH";
              link.name = "linkToVersion";
              link.characters = `Go to version "${version.label}"`;
              link.textAutoResize = "WIDTH_AND_HEIGHT";
              link.hyperlink = {
                type: "URL",
                value: URL,
              };
              link.locked = true;

              data.appendChild(title);
              data.appendChild(description);
              data.appendChild(createdBy);
              data.appendChild(link);
            })
          );

          figma.viewport.scrollAndZoomIntoView([logShell]);

          figma.ui.postMessage({ type: "page-created" });
        }
      )
    );
  });
}
