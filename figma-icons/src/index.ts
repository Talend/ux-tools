import fs from "fs";
import fetch from "node-fetch";
import * as Figma from "figma-js";
import ProgressBar from "progress";
import FormData from "form-data";

const fsPromises = fs.promises;

const conf = {
  personalAccessToken: process.env.FIGMA_ACCESS_TOKEN,
  fileId: "L1QUr28Y79ydAv05nQVmaA",
  documentId: "901:264",
};

if (!conf.personalAccessToken) {
    console.error('You must provide a Personal Access Token from Figma');
    console.error('Start using FIGMA_ACCESS_TOKEN=1234 node lib/index.js');
}

const client = Figma.Client({
  personalAccessToken: conf.personalAccessToken,
});

function isNumeric(str: string) {
  return !isNaN(Number(str)) && !isNaN(parseFloat(str));
}

(async () => {
  const { data: me } = await client.me();
  console.log("Hello, " + me.handle + "!");

  console.log("Let's retrieve your icons...");
  const { data: file } = await client.file(conf.fileId);

  console.log(
    "Last time the file has been modified was " +
      new Intl.DateTimeFormat("en-US").format(Date.parse(file.lastModified))
  );

  const page = file.document.children.find((child) => child.name.includes("🕹"));
  if (page && "children" in page) {
    const icons = page.children
      .filter((child) => child.type === "COMPONENT_SET")
      .filter((child) => !child.name.includes(" "))
      .filter((child) => {
        return (child as Figma.ComponentSet).children.some((c) =>
          ["8", "12", "16", "24"].some((size) => c.name.endsWith(size))
        );
      }) as Figma.ComponentSet[];
    if (!fs.existsSync("figma")) {
      await fsPromises.mkdir("figma");
    }

    const bar = new ProgressBar(
      ':percent [:bar] downloading ":icon" :current/:total',
      {
        complete: "■",
        incomplete: " ",
        width: 32,
        total: icons.length,
      }
    );

    icons
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (icon, i) => {
        await new Promise((r) => setTimeout(r, i * 10000));
        await bar.tick({ icon: icon.name });
        await fsPromises.mkdir("figma/" + icon.name, { recursive: true });
        const childrenMatchingASize = icon.children.filter((c) =>
          isNumeric(c.name.split("=")[1])
        );
        childrenMatchingASize.map(async (childMatchingASize, j) => {
          await new Promise((r) => setTimeout(r, j * 1000));
          const size = childMatchingASize.name.split("=")[1];
          const dir = "figma/" + icon.name + "/" + size;
          const filePath = dir + "/" + icon.name + ".svg";
          const { data: image } = await client.fileImages(conf.fileId, {
            ids: [childMatchingASize.id || ""],
            format: "svg",
          });
          if (!fs.existsSync(dir)) {
            await fsPromises.mkdir(dir, { recursive: true });
          }
          const imageUrl = Object.values(image.images)[0];
          const imagePromiseResponse = await fetch(imageUrl);
          const fileBefore = await imagePromiseResponse.buffer();
          await fsPromises.writeFile(filePath, fileBefore);
          const fileReadyToGo = await fsPromises.readFile(filePath);
          const formData = new FormData();
          formData.append("file", fileReadyToGo);
          const response = await fetch(
            `https://svg-optimizer.tools.dev.datapwn.com/process/${size}`,
            {
              method: "POST",
              body: formData,
            }
          );
          const fileAfter = await response.buffer();
          await fsPromises.writeFile(filePath, fileAfter);
        });
      });
  }
})();
