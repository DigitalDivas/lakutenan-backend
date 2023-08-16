const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://lakutenan-e6d4f.appspot.com/"
  // Other options if needed
});
const db = admin.firestore();
const User = db.collection("Users");
const Events = db.collection("Events");
const Organizer = db.collection("Organizer");
const Tenant = db.collection("Tenant");
const Booths = db.collection("Booths");
module.exports = {db, User, Events, Organizer, Tenant, Booths};
