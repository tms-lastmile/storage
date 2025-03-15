import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT
const API_KEY = process.env.API_KEY

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const checkApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(403).json({ message: "Forbidden: Invalid API Key" });
  }
  next();
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

app.post("/upload", checkApiKey, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/file/${req.file.filename}`;
  console.log(`File uploaded: ${req.file.filename} (${fileUrl})`);

  res.json({
    message: "File uploaded successfully",
    filename: req.file.filename,
    url: fileUrl,
  });
});

app.get("/files", checkApiKey, async (req, res) => {
  try {
    const files = await fs.promises.readdir(uploadDir);
    const fileUrls = files.map(file => ({
      filename: file,
      url: `${req.protocol}://${req.get("host")}/file/${file}`,
    }));

    res.json({ files: fileUrls });
  } catch (err) {
    res.status(500).json({ message: "Failed to read directory", error: err.message });
  }
});

app.get("/file/:filename", checkApiKey, (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: "File not found" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});