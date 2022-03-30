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
  let found: SceneNode | undefined;
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

const sendSVG = async (nodes: SceneNode[]) => {
  let styleId;
  const data = [];
  for (const node of nodes) {
    const svgCode = await node.exportAsync({ format: "SVG" });
    data.push({ name: node.parent?.name, size: node.width, data: svgCode });
    if (!styleId) {
      const childWithMatchingStyle = getChildWithMatchingStyle(node);
      if (childWithMatchingStyle && "fillStyleId" in childWithMatchingStyle) {
        styleId = childWithMatchingStyle.fillStyleId.toString();
      }
    }
  }
  figma.ui.postMessage({
    type: "networkRequest",
    data,
    styleId,
  });
};

figma.ui.onmessage = async (msg) => {
  if (msg.type === "cancel") {
    figma.closePlugin();
  }

  if (msg.type === "create-request") {
    if (figma.currentPage.selection.length === 0) {
      return;
    }

    const nodes: SceneNode[] = [];
    for (const node of figma.currentPage.selection) {
      if (node.type === "COMPONENT_SET") {
        for (const childNode of node.children) {
          nodes.push(childNode);
        }
      } else if (node.type === "COMPONENT") {
        nodes.push(node);
      }
    }
    await sendSVG(nodes);
  }

  if (msg.type === "create-svg") {
    const components: { [name: string]: { [size: number]: string } } = {};
    const sizes: number[] = [];
    for (const { name, size, data } of msg.data) {
      if (!components[name]) {
        components[name] = {};
      }
      if (!sizes[size]) {
        sizes.push(size);
      }
      components[name][size] = data;
    }
    let pageNode: PageNode | undefined = figma.root
      .findAllWithCriteria({
        types: ["PAGE"],
      })
      .find((page) => page.name === "🤖 Optimized icons");
    if (!pageNode) {
      pageNode = figma.createPage();
      pageNode.name = "🤖 Optimized icons";
    }
    Object.entries(components)
      .sort(([componentNameA], [componentNameB]) =>
        componentNameA.localeCompare(componentNameB)
      )
      .forEach(([componentName, componentSizes], i) => {
        const components: ComponentNode[] = Object.entries(componentSizes)
          // @ts-ignore
          .sort(([csA], [csB]) => csA - csB)
          .map(([componentSize, componentData], j) => {
            let component: ComponentNode = figma.createComponent();
            const icon = figma.createNodeFromSvg(componentData);
            icon.children.forEach((child) => {
              (child as VectorNode).fillStyleId = msg.styleId;
            });
            const size = parseInt(componentSize);
            component.resize(size, size);
            component.name = "size=" + size;
            component.appendChild(icon);
            (pageNode as PageNode).appendChild(component);
            return component;
          });

        let componentSet: ComponentSetNode | undefined = figma.root
          .findAllWithCriteria({
            types: ["COMPONENT_SET"],
          })
          //@ts-ignore
          .find((cs) => cs.name === componentName.substring(1));
        if (!componentSet) {
          componentSet = figma.combineAsVariants(
            components,
            pageNode as PageNode
          );
          componentSet.name = componentName.substring(1);
          componentSet.y = i * 30;
          componentSet.layoutMode = "HORIZONTAL";
        } else {
          // componentSet.children.forEach((child) => child.remove());

          components.forEach((c, i) => {
            const child = componentSet?.findChild(
              (node) => node.name === c.name
            );
            componentSet?.insertChild(i, c);
            if (child) {
              child.remove();
            }
          });
        }

        /*
        componentSet
          .getPublishStatusAsync()
          .then((publishStatus: PublishStatus) =>
            console.log({ publishStatus })
          );
        */
      });
  }
};
