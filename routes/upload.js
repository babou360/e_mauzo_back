const multer = require("multer");
const bucket = require("../firebase");
const express = require('express')
const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() });

// single file upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    const fileName = `uploads/${Date.now()}_${req.file.originalname}`;
    const blob = bucket.file(fileName);

    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: { contentType: req.file.mimetype },
    });

    blobStream.on("error", (err) => {
      res.status(500).send("Upload error.");
    });

    blobStream.on("finish", async () => {
      await blob.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      res.status(200).json({
        message: "File uploaded successfully",
        url: publicUrl,
      });
    });

    blobStream.end(req.file.buffer);
  } catch (err) {
    res.status(500).send("Server error.");
  }
});

// multiple files upload 
router.post("/multi-upload", upload.array("files"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      const fileName = `uploads/${Date.now()}_${file.originalname}`;
      const blob = bucket.file(fileName);

      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: { contentType: file.mimetype },
      });

      // Wrap each file upload in a promise to await all uploads
      await new Promise((resolve, reject) => {
        blobStream.on("error", (err) => reject(err));
        blobStream.on("finish", async () => {
          await blob.makePublic();
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          uploadedFiles.push(publicUrl);
          resolve();
        });

        blobStream.end(file.buffer);
      });
    }

    res.status(200).json({
      message: "Files uploaded successfully",
      files: uploadedFiles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error.");
  }
});


module.exports = router
