figma.showUI(__html__);

function matchNeutralIconCriteria(currentNode: SceneNode) {
  if (!("fillStyleId" in currentNode)) {
    return false;
  }
  const style = figma.getStyleById(currentNode.fillStyleId.toString());
  if (!style) {
    return false;
  }
  return style.name === "neutral/icon";
}

function getChildWithMatchingStyle(node: SceneNode) {
  let found;
  function traverse(n: SceneNode) {
    if (matchNeutralIconCriteria(n)) {
      found = n;
    }
    if ("children" in n) {
      n.children.forEach((child) => {
        traverse(child);
      });
    }
  }
  traverse(node);
  return found;
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === "create-request") {
    if (figma.currentPage.selection.length === 0) {
      return;
    }

    for (const node of figma.currentPage.selection) {
      const svgCode = await node.exportAsync({ format: "SVG" });
      let styleId;
      if ("children" in node) {
        const childWithMatchingStyle = getChildWithMatchingStyle(node);
        if (childWithMatchingStyle && "fillStyleId" in childWithMatchingStyle) {
          // @ts-ignore
          styleId = childWithMatchingStyle.fillStyleId.toString();
        }
      }
      figma.ui.postMessage({
        type: "networkRequest",
        data: svgCode,
        size: node.name.split("=")[1].split(",")[0],
        styleId,
      });
    }
  }

  if (msg.type === "create-svg") {
    const nodes: SceneNode[] = [];
    const icon = figma.createNodeFromSvg(msg.data);
    icon.children.forEach((child) => {
      (child as VectorNode).fillStyleId = msg.styleId;
    });
    icon.name = "🤖 " + msg.size;
    icon.x = figma.viewport.center.x;
    icon.y = figma.viewport.center.y;
    figma.currentPage.appendChild(icon);
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  if (msg.type === "cancel") {
    figma.closePlugin();
  }
};
