import express from "express";
import fileUpload from "express-fileupload";
import cors from "cors";
import compression from "compression";
import bodyParser from "body-parser";
import morgan from "morgan";
import config from "config";

import routes from "./routes";

const port: number = config.get("server.port");
const host: string = config.get("server.host");


const MAX_FILE_SIZE_MB = 5;

const app = express();

app.use(
  fileUpload({
    debug: true,
    createParentPath: true,
    limits: {
      fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 * 1024,
    },
    safeFileNames: true,
  })
);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(compression());
app.use(express.static("public"));

app.use("/", routes);

app.listen(port, host, () =>
  console.log(`Server is running on ${host}:${port}`)
);
