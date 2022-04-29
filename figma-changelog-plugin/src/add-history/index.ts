import * as ChangelogRequest from "../changelog-request";

export const messageName = "add-history";

export async function handleEvent(msg: {
  type: string;
  data: { label: string; description: string };
}) {
  const { data } = msg;
  await Promise.all([
    figma.saveVersionHistoryAsync(data.label, data.description),
  ]).then(() => ChangelogRequest.handleRequest());
}
