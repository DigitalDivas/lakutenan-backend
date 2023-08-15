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

const bcrypt = require('bcrypt');
const User = require("./config");
const functions = require('firebase-functions')
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express()
const PORT = 4000
const admin = require("firebase-admin");
const { query } = require("express");
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus:200
}
// SIGN UP TENANT
app.post("/tenant/register",  cors(corsOptions), async (req, res) => {
  const { email, password } = req.body;
  const customClaims = {
    role: "tenant" // Assign the desired role
  };

  let createdUser;
  let hashPassword;

  admin.auth().createUser({
    email: email,
    password: password,
    emailVerified: false,
    disabled: false
  })
  .then((userRecord) => {
    // User created successfully
    createdUser = userRecord;

    // Assign custom claims to the user to define their role
    return admin.auth().setCustomUserClaims(userRecord.uid, customClaims);
  })
  .then(async () => {
    console.log("User created with role successfully.");
    saltRounds = 10;
    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) {
        console.log(err)
        return res.status(401).json({error: err})
      } else {
        hashPassword = hash;
        const userData = {
          email: email,
          hashPassword: hashPassword, 
          role: customClaims.role, 
        };
      await User.add({ userData });
      console.log("User data stored in Firestore.");
      res.status(201).json( "User created successfully" ); 
      }
    });
    // Store user data in Firestore
  })
  .catch((error) => {
    console.error("Error creating user:", error);
    res.status(500).json({ error: error.message }); 
  });
});


// SIGN UP EVENT
app.post("/event/register",  cors(corsOptions), async (req, res) => {
  const { email, password } = req.body;
  const customClaims = {
    role: "event" // Assign the desired role
  };

  let createdUser;
  let hashPassword;

  admin.auth().createUser({
    email: email,
    password: password,
    emailVerified: false,
    disabled: false
  })
  .then((userRecord) => {
    // User created successfully
    createdUser = userRecord;

    // Assign custom claims to the user to define their role
    return admin.auth().setCustomUserClaims(userRecord.uid, customClaims);
  })
  .then(async () => {
    console.log("User created with role successfully.");
    saltRounds = 10;
    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) {
        console.log(err);
        return res.status(401).json({error: err})
      } else {
        hashPassword = hash;
        const userData = {
          email: email,
          hashPassword: hashPassword, 
          role: customClaims.role, 
        };
      await User.add({ userData });
      console.log("User data stored in Firestore.");
      res.status(201).json( "User created successfully" ); 
      }
    });
    // Store user data in Firestore
  })
  .catch((error) => {
    console.error("Error creating user:", error);
    res.status(500).json({ error: error.message }); 
  });
});

// LOGIN ALL USER
app.post("/login", cors(corsOptions), async (req, res) => {
  const { email, password } = req.body;

  try {
    User.where('userData.email', '==', email).get()
    .then(querySnapshot => {
      if (querySnapshot.empty) {
        return res.status(401).json({ error: "No user found with the specified email" });
      } 
      else {
        querySnapshot.forEach(doc => {
          const userData = doc.data().userData; // Extract the entire user data
          console.log('Document ID:', doc.id, ' => Document data:', userData);
          const hashPassword = userData.hashPassword;
          bcrypt.compare(password, hashPassword, (err, result) => {
            if (err) {
              console.log(err)
              return res.status(401).json({ error: "An error occured" });
            } else if (result === true) {
              res.status(200).json({ message: "Successfully logged in" });
            } else {
              return res.status(401).json({ error: "Incorrect email or password" });
            }
          });
        });
      }
    })
    .catch(error => {
      console.error('Error getting documents:', error);
    });

  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).send("Authentication failed");
  }
});

// INI BELUM BISA
app.get("/tenant-only", async (req, res) => {
  const user = admin.auth().get

  if (!user) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    // const userDoc = User.get()
    // const userDoc = await firestore.collection("User").doc(user.uid).get();
    const userDoc = User.doc(user.uid).get();
    const userRole = userDoc.data().role;

    if (userRole === "tenant") {
      res.status(200).json({ message: "Welcome, tenant!" });
    } else {
      res.status(403).json({ error: "Unauthorized" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

exports.app = functions.https.onRequest(app);
