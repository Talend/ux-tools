figma.showUI(__html__);

const transformAngleToFigmaTransformation = (value): Transform => {
  const angle = value - Math.PI / 2;
  const xc = 0.5;
  const yc = 0.5;
  const dxc = xc - (Math.cos(angle) * xc + Math.sin(angle) * yc);
  const dyc = yc - (-Math.sin(angle) * xc + Math.cos(angle) * yc);
  return [
    [Math.cos(angle), Math.sin(angle), dxc],
    [-Math.sin(angle), Math.cos(angle), dyc],
  ];
};

figma.ui.onmessage = async (msg) => {
  if (msg.type === "apply") {
    if (!figma.currentPage.selection.length) {
      return;
    }
    for (const node of figma.currentPage.selection) {
      const newGradientTransform = transformAngleToFigmaTransformation(
        (parseFloat(msg.angle) / 180) * Math.PI
      );
      if ("fillStyleId" in node && node.fillStyleId) {
        // it's a global style (aka design-token)
        const paintStyle = figma
          .getLocalPaintStyles()
          .find((s) => s.id === node.fillStyleId);
        const gradient = paintStyle as PaintStyle;
        gradient.paints = [
          // @ts-ignore
          { ...gradient.paints[0], gradientTransform: newGradientTransform },
        ];
      } else {
        // it's a local style
        if ("fills" in node && node.fills) {
          const gradient = node.fills[0];
          node.fills = [
            {
              ...gradient,
              gradientTransform: newGradientTransform,
            },
          ];
        }
      }
    }
  }
  if (msg.type === "cancel") {
    figma.closePlugin();
  }
};
