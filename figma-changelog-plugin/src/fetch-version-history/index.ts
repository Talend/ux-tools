export const messageName = "get-history-request";

export function handleRequest({ createPage }: { createPage?: boolean }) {
  const { fileKey } = figma;
  figma.ui.postMessage({ type: "get-changelog", fileKey, createPage });
}
