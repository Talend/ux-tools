import * as FetchVersionHistory from "../fetch-version-history";

export const messageName = "add-history";

export async function handleEvent(msg: {
  type: string;
  data: { label: string; description: string };
}) {
  const { data } = msg;
  await Promise.all([
    figma.saveVersionHistoryAsync(data.label, data.description),
  ]).then(() => FetchVersionHistory.handleRequest({ createPage: true }));
}
