import * as OptionFP from "fp-ts/Option";
import * as NonEmptyArrayFP from "fp-ts/NonEmptyArray";
import { pipe } from "fp-ts/function";
import * as ArrayFP from "fp-ts/Array";

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

function prefixWith0(value: number) {
  return value >= 10 ? value : `0${value}`;
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
          logShell.itemSpacing = 16;
          logShell.resizeWithoutConstraints(480, 300);
          changelogPage.appendChild(logShell);

          pipe(
            logs,
            ArrayFP.map(async (version) => {
              const date = new Date(version.created_at);
              const hours = date.getHours();
              const minutes = date.getMinutes();

              const logEntry = figma.createFrame();
              logEntry.name = version.created_at;
              logEntry.layoutMode = "VERTICAL";
              logEntry.layoutAlign = "STRETCH";
              logEntry.locked = true;
              logShell.appendChild(logEntry);

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
              createdBy.characters = `Created by ${
                version.user.handle
              } on ${prefixWith0(date.getMonth())}/${prefixWith0(
                date.getDay()
              )}/${date.getFullYear()} at ${prefixWith0(hours)}:${prefixWith0(
                minutes
              )}`;
              createdBy.textAutoResize = "WIDTH_AND_HEIGHT";
              createdBy.locked = true;

              const link = figma.createText();
              const URL = `https://www.figma.com/file/${fileKey}/${figma.root.name.replace(
                " ",
                "-"
              )}?version-id=${version.id}`;
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
              link.locked = true;

              logEntry.appendChild(title);
              logEntry.appendChild(description);
              logEntry.appendChild(createdBy);
              logEntry.appendChild(link);
            })
          );

          figma.viewport.scrollAndZoomIntoView([logShell]);

          figma.ui.postMessage({ type: "page-created" });
        }
      )
    );
  });
}
