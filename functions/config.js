const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Other options if needed
});
const db = admin.firestore();
const User = db.collection("Users");
const Events = db.collection("Events");
module.exports = {User, Events};