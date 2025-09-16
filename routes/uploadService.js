const bucket = require("../firebase");

async function uploadFiles(base64Files) {
  if (!base64Files || base64Files.length === 0) {
    throw new Error("No files uploaded");
  }
  const uploadedFiles = [];

  for (let i = 0; i < base64Files.length; i++) {
    const buffer = Buffer.from(base64Files[i], "base64");

    const fileName = `uploads/${Date.now()}_${i}.png`;
    const blob = bucket.file(fileName);

    await new Promise((resolve, reject) => {
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: { contentType: "image/png" },
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
