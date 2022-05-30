#!/usr/bin/env node

import fs from "fs";
import fetch from "node-fetch";
import * as Figma from "figma-js";
import ProgressBar from "progress";

const fsPromises = fs.promises;

const conf = {
  personalAccessToken: process.env.FIGMA_ACCESS_TOKEN,
  fileId: "L1QUr28Y79ydAv05nQVmaA",
  documentId: "2064:17133",
};

if (!conf.personalAccessToken) {
  console.error("You must provide a Personal Access Token from Figma");
  console.error("Start using FIGMA_ACCESS_TOKEN=1234 node lib/index.js");
}

const client = Figma.Client({
  personalAccessToken: conf.personalAccessToken,
});

(async () => {
  async function replaceInFile(
    filename: fs.PathLike,
    searchValue: RegExp,
    replacement: string
  ) {
    try {
      const contents = await fsPromises.readFile(filename, "utf-8");
      const replaced = contents.replace(searchValue, replacement);
      await fsPromises.writeFile(filename, replaced);
    } catch (err) {
      console.error(err);
    }
  }

  const { data: me } = await client.me();
  console.log("Hello, " + me.handle + "!");

  const { data: file } = await client.file(conf.fileId);

  console.log(
    "Last time the file has been modified was " +
      new Intl.DateTimeFormat("en-US").format(Date.parse(file.lastModified))
  );

  const page = file.document.children.find((child) =>
    child.name.includes("🔒")
  );
  if (page && "children" in page) {
    console.log(
      `Page "${page.name}" is found in the file. Let's export icons, now!`
    );
    const icons = page.children
      .filter((child) => child.type === "COMPONENT")
      .filter((child) => child.name.startsWith("icon/")) as Figma.Component[];

    const bar = new ProgressBar(
      ':percent [:bar] downloading ":icon" :current/:total',
      {
        complete: "■",
        incomplete: " ",
        width: 32,
        total: icons.length,
      }
    );

    console.log(
      `${icons.length} icons have been found in this page. Let's export them locally!`
    );
    icons.sort((a, b) => a.name.localeCompare(b.name));

    function sliceIntoChunks(array: Figma.Component[], chunkSize: number) {
      const results = [];
      for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        results.push(chunk);
      }
      return results;
    }
    for (const chunk of sliceIntoChunks(icons, 100)) {
      const { data: image } = await client.fileImages(conf.fileId, {
        ids: chunk.map((icon: Figma.Component) => icon.id),
        format: "svg",
      });

      for await (const [nodeId, imageUrl] of Object.entries(image.images)) {
        const icon = chunk.find((i: Figma.Component) => i.id === nodeId);
        if (icon) {
          await bar.tick({ icon: icon.name });
          const filePathArr = icon.name.split("/");
          filePathArr.pop();
          const dir = "src/" + filePathArr.join("/");
          if (!fs.existsSync(dir)) {
            await fsPromises.mkdir(dir, { recursive: true });
          }
          const filePath = "src/" + icon.name + ".svg";
          const imagePromiseResponse = await fetch(imageUrl);
          const file = await imagePromiseResponse.buffer();
          await fsPromises.writeFile(filePath, file);
          await replaceInFile(filePath, /#202020/gi, "currentColor");
        }
      }
    }
  }
})();
