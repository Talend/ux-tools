export const messageName = "changelog-request";

export function handleRequest() {
  const { fileKey } = figma;
  figma.ui.postMessage({ type: "get-changelog", fileKey });
}
