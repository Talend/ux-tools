import path from "path";
import express from "express";
import { UploadedFile } from "express-fileupload";
import shell from "shelljs";

const router = express.Router();

router.get("/", async (req, res) => {
  await res.send(`
      <form id="form" method="post" action="/process/24" enctype="multipart/form-data">
          <label for="size">Size</label>
          <select id="size" name="size" onchange="change(this.value);">
            <option value="24">24</option>
            <option value="16">16</option>
            <option value="12">12</option>
          </select>
          <label for="file">Icon</label>
          <input type="file" name="file" accept=".svg"/>
          <button type="submit">Submit</button>
      </form>
      <script>
        function change(value) { 
            document.getElementById('form').action = '/process/' + value; 
        }
      </script>
    `);
});

router.post("/process/:size", async (req, res) => {
  try {
    if (!req.files) {
      res.send({
        status: false,
        message: "No file uploaded",
      });
    } else {
      const file = req.files.file;
      const size = req.params.size || "24";
      const folderName = Date.now();
      const fileName = (file as UploadedFile).name.replace("svg", ".svg");
      const filePath = path.join(__dirname, "..") + "/public/" + folderName;
      if ("mv" in file) {
        await file.mv(filePath + "/" + fileName);
      }
      const exec = await shell.exec(
        `sh ${__dirname}/scripts/process.sh ${filePath} ${fileName} ${size}`
      );
      if (exec.code !== 0) {
        const errorMsg = "Error when processing the file";
        shell.echo(errorMsg);
        shell.echo(exec.stderr);
        shell.exit(1);
        return res.status(500).send(errorMsg);
      }
      return res.redirect(`/${folderName}/${fileName}`);
    }
  } catch (err) {
    console.error("Error during the processing", err);
    return res.status(500).send(err);
  }
});

router.get("/:file", (req, res) => {
  res.send("Get the file " + req.params.file);
});

export default router;
