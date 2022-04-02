var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
figma.showUI(__html__);
const transformAngleToFigmaTransformation = (value) => {
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
figma.ui.onmessage = (msg) => __awaiter(this, void 0, void 0, function* () {
    if (msg.type === "apply") {
        if (!figma.currentPage.selection.length) {
            return;
        }
        for (const node of figma.currentPage.selection) {
            if ("fillStyleId" in node) {
                // @ts-ignore
                const paintStyle = figma
                    .getLocalPaintStyles()
                    .find((s) => s.id === node.fillStyleId);
                const gradient = paintStyle;
                const newGradientTransform = transformAngleToFigmaTransformation((parseFloat(msg.angle) / 180) * Math.PI);
                // @ts-ignore
                gradient.paints = [
                    Object.assign(Object.assign({}, gradient.paints[0]), { gradientTransform: newGradientTransform }),
                ];
                console.log({
                    figma,
                    paintStyle,
                    gradient,
                });
            }
        }
        figma.viewport.scrollAndZoomIntoView(figma.currentPage.selection);
    }
    if (msg.type === "cancel") {
        figma.closePlugin();
    }
});
