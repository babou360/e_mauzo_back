// const bucket = require("../firebase");

// async function uploadFiles(base64Files) {
//   if (!base64Files || base64Files.length === 0) {
//     throw new Error("No files uploaded");
//   }
//   const uploadedFiles = [];

//   for (let i = 0; i < base64Files.length; i++) {
//     const buffer = Buffer.from(base64Files[i], "base64");

//     const fileName = `uploads/${Date.now()}_${i}.png`;
//     const blob = bucket.file(fileName);

//     await new Promise((resolve, reject) => {
//       const blobStream = blob.createWriteStream({
//         resumable: false,
//         metadata: { contentType: "image/png" },
//       });

//       blobStream.on("error", (err) => reject(err));
//       blobStream.on("finish", async () => {
//         await blob.makePublic();
//         const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
//         uploadedFiles.push(publicUrl);
//         resolve();
//       });

//       blobStream.end(buffer);
//     });
//   }

//   return uploadedFiles;
// }

// module.exports = { uploadFiles };



const bucket = require("../firebase");

/**
 * Upload files to Firebase Storage (supports both base64 strings and file objects)
 * @param {Array} files - Array of base64 strings or file objects (e.g. req.files)
 * @returns {Promise<Array>} - Array of uploaded file URLs
 */
async function uploadFiles(files) {
  if (!files || files.length === 0) {
    throw new Error("No files uploaded");
  }

  const uploadedFiles = [];

  for (let i = 0; i < files.length; i++) {
    let buffer, fileName, contentType;

    // ✅ Case 1: Base64 string (from Flutter or other mobile clients)
    if (typeof files[i] === "string") {
      // Support both "data:image/png;base64,..." and raw base64
      const base64Data = files[i].includes("base64,")
        ? files[i].split("base64,")[1]
        : files[i];

      buffer = Buffer.from(base64Data, "base64");
      contentType = "image/png";
      fileName = `uploads/${Date.now()}_${i}.png`;
    }

    // ✅ Case 2: File object (from Next.js via FormData)
    else if (files[i].buffer) {
      buffer = files[i].buffer;
      contentType = files[i].mimetype || "application/octet-stream";
      const originalName = files[i].originalname || `file_${Date.now()}_${i}`;
      fileName = `uploads/${Date.now()}_${originalName}`;
    }

    else {
      throw new Error("Invalid file format: must be base64 string or file object");
    }

    // Upload to Firebase Storage
    const blob = bucket.file(fileName);

    await new Promise((resolve, reject) => {
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: { contentType },
      });

      blobStream.on("error", (err) => reject(err));

      blobStream.on("finish", async () => {
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        uploadedFiles.push(publicUrl);
        resolve();
      });

      blobStream.end(buffer);
    });
  }

  return uploadedFiles;
}

module.exports = { uploadFiles };

