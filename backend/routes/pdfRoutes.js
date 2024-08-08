const express = require("express");
const router = express();
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
router.use(express.json());
router.use(cors());
router.use("/files", express.static("files"));

// Define storage configuration for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

// const upload = multer({ storage: storage });

// Import PdfSchema correctly
const PdfSchema = require("../schema/pdfDetails");

// Upload files route
const upload = multer({ dest: "uploads/" });

router.post("/upload-files", upload.single("file"), async (req, res) => {
  console.log(req.file);
  const { title, email } = req.body;
  const fileName = req.file.filename;

  try {
    const existingFile = await PdfSchema.findOne({
      title: title,
      email: email,
    });
    if (existingFile) {
      return res.status(400).json({
        status: "error",
        message: "File already exists for this email.",
      });
    }
    await PdfSchema.create({ title: title, pdf: fileName, email: email });
    res.send({ status: "ok" });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Get files route
router.get("/get-files", async (req, res) => {
  const { email } = req.query; // Retrieve email from query parameters

  try {
    if (!email) {
      return res
        .status(400)
        .json({ status: "error", message: "Email is required" });
    }

    const data = await PdfSchema.find({ email: email });
    if (data.length === 0) {
      return res.status(201).json({
        status: "error",
        message: "No files found for the given email",
      });
    }

    res.send({ status: "ok", data: data });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

router.get("/files/:file", (req, res) => {
  try {
    const file = req.params.file;
    const filePath = path.join(__dirname, "../uploads", file);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found." });
    }
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).json({ error: "Failed to fetch file." });
  }
});

router.delete("/delete-file", async (req, res) => {
  const { filename } = req.body;

  try {
    const file = await PdfSchema.findOne({ pdf: filename });
    if (!file) {
      return res
        .status(404)
        .json({ status: "error", message: "File not found" });
    }

    const filePath = path.join(__dirname, "../uploads", file.pdf);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await PdfSchema.deleteOne({ pdf: filename });

    res.send({ status: "ok" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

module.exports = router;
