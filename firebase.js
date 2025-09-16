// firebase.js
const admin = require("firebase-admin");
const serviceAccount = require("./service_account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "pregnancy-f6ebe.appspot.com" // Replace with your Firebase storage bucket
});

const bucket = admin.storage().bucket();

module.exports = bucket;
