figma.showUI(__html__);

const PAGE_NAME = "🔒 optimized icons";

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

function getTShirtSize(size: string) {
  return (
    {
      8: "XS",
      12: "S",
      16: "M",
      24: "L",
    }[parseInt(size)] || size
  );
}

function getNumericSize(size: string) {
  return (
    {
      XS: 8,
      S: 12,
      M: 16,
      L: 24,
    }[size] || parseInt(size)
  );
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

function checksum(node: SceneNode) {
  if ("children" in node) {
    return node.children
      .map((child) =>
        (child as VectorNode).vectorPaths
          .map((vectorPath) => vectorPath.data)
          .join()
      )
      .join();
  }
  return "";
}

function getPublicComponentName(componentName: string) {
  if (componentName.startsWith("_")) {
    return componentName.substring(1);
  }
  return componentName;
}

function getGeneratedComponentName({
  size,
  name,
}: {
  size: number;
  name: string;
}) {
  return `icon/${getTShirtSize(size.toString())}/${name}`;
}

async function sendSVG(nodes: SceneNode[]) {
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
}

function reorganize() {
  const start = new Date();
  console.log("Start reorganizing icons");
  let pageNode: PageNode | undefined = figma.root
    .findAllWithCriteria({
      types: ["PAGE"],
    })
    .find((page) => page.name === PAGE_NAME);
  if (pageNode) {
    const publicComponents: ComponentNode[] = pageNode.findAllWithCriteria({
      types: ["COMPONENT"],
    });
    let sizes: number[] = [];
    publicComponents.forEach((publicComponent) => {
      const [, size] = publicComponent.name.split("/");
      const intSize = getNumericSize(size);
      if (!sizes.includes(intSize)) {
        sizes.push(intSize);
      }
    });
    const sortedSizes: number[] = [...new Set(sizes)].sort((a, b) => a - b);
    const biggestSize = sortedSizes.reverse()[0];
    const componentSets = figma.root.findAllWithCriteria({
      types: ["COMPONENT_SET"],
    });
    const foundComponents = publicComponents.filter((publicComponent) => {
      const [, , name] = publicComponent.name.split("/");
      return componentSets.find((cs) => cs.name === `_${name}`);
    });
    const sortedFoundComponentsNames: string[] = [
      ...new Set(
        foundComponents.map((component) => component.name.split("/")[2])
      ),
    ].sort();
    foundComponents.forEach((publicComponent) => {
      const [prefix, size, name] = publicComponent.name.split("/");
      const privateComponentSet = componentSets.find(
        (cs) => cs.name === `_${name}`
      );
      if (privateComponentSet?.description) {
        publicComponent.description = privateComponentSet.description;
      }
      publicComponent.name = [prefix, getTShirtSize(size), name].join("/");
      publicComponent.x =
        sortedSizes.indexOf(getNumericSize(size)) * (biggestSize + 10);
      publicComponent.y =
        sortedFoundComponentsNames.indexOf(name) * (biggestSize + 10);
      publicComponent.locked = true;
    });
    // Remove icons without any raw version (maybe renamed or deleted icons!)
    const notFoundComponents = publicComponents.filter((publicComponent) => {
      const [, , name] = publicComponent.name.split("/");
      return !componentSets.find((cs) => cs.name === `_${name}`);
    });
    notFoundComponents.forEach((publicComponent) => {
      publicComponent.remove();
    });
  }
  const stop = new Date();
  console.log(
    `Stop reorganizing icons (time elapsed=${
      stop.getTime() - start.getTime()
    }ms)`
  );
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === "cancel") {
    figma.closePlugin();
  }
  if (msg.type === "create-request") {
    if (!figma.currentPage.selection.length) {
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
    let names: string[] = [];
    const sizes: number[] = [];
    // Only icons that we asked to modify
    const components: { [name: string]: { [size: number]: string } } = {};
    for (const { name, size, data } of msg.data) {
      if (!components[name]) {
        components[name] = {};
      }
      if (!sizes[size]) {
        sizes.push(parseInt(size));
      }
      components[name][size] = data;
    }
    let pageNode: PageNode | undefined = figma.root
      .findAllWithCriteria({
        types: ["PAGE"],
      })
      .find((page) => page.name === PAGE_NAME);
    if (!pageNode) {
      pageNode = figma.createPage();
      pageNode.name = PAGE_NAME;
      names = Object.keys(components).map(getPublicComponentName);
    } else {
      // All available icon names in the page
      names = pageNode
        .findAllWithCriteria({ types: ["COMPONENT"] })
        .filter((componentNode) => componentNode.name.startsWith("_"))
        .map((componentNode) => componentNode.name.split("/").reverse()[0]);
      Object.keys(components).map((componentName) => {
        const currentComponentName = getPublicComponentName(componentName);
        if (!names.find((name) => name === currentComponentName)) {
          names.push(currentComponentName);
        }
      });
    }
    Object.entries(components)
      .sort(([componentNameA], [componentNameB]) =>
        componentNameA.localeCompare(componentNameB)
      )
      .forEach(([componentName, componentSizes]) => {
        const name = getPublicComponentName(componentName);
        Object.entries(componentSizes)
          .sort(([csA], [csB]) => parseInt(csA) - parseInt(csB))
          .map(([componentSize, componentData]) => {
            const size = parseInt(componentSize);
            const generatedComponentName = getGeneratedComponentName({
              name,
              size,
            });
            let publicComponent: ComponentNode | undefined = figma.root
              .findAllWithCriteria({
                types: ["COMPONENT"],
              })
              .find((cs) => cs.name === generatedComponentName);
            // Update fill color with the right Talend design token
            const icon = figma.createNodeFromSvg(componentData);
            icon.children.forEach((child) => {
              (child as VectorNode).fillStyleId = msg.styleId;
            });
            // Flatten vectors
            figma.flatten(icon.children, icon);
            if (publicComponent) {
              // Update existing public component if its content has changed
              const child = publicComponent.children[0];
              const beforeCheckSum = checksum(child);
              const afterCheckSum = checksum(icon);
              if (beforeCheckSum !== afterCheckSum) {
                // If content has changed
                publicComponent.insertChild(0, icon);
                if (child) {
                  child.remove();
                }
              } else {
                // Otherwise, delete generated icon
                icon.remove();
              }
            } else {
              // Create a new public component
              publicComponent = figma.createComponent();
              publicComponent.name = generatedComponentName;
              publicComponent.resize(size, size);
              publicComponent.appendChild(icon);
              (pageNode as PageNode).appendChild(publicComponent);
            }
          });
      });
    // Reorganize all SVG in the generated page
    reorganize();
  }
};
