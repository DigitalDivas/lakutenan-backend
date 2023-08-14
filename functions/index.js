/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const functions = require('firebase-functions')
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express()
const PORT = 4000


app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus:200
}
app.get('/',cors(corsOptions), (req, res, ) => {
  res.send('anjing!')
})
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

exports.app = functions.https.onRequest(app);
