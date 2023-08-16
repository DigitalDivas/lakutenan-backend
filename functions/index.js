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
const {User, Events} = require('./config');
const functions = require('firebase-functions')
const express = require('express')
const session = require('express-session');
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
app.use(cors(corsOptions));

// Configure session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true in production for HTTPS
}));


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
app.post("/organizer/register",  cors(corsOptions), async (req, res) => {
  const { email, password } = req.body;
  const customClaims = {
    role: "organizer" // Assign the desired role
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
          const userData = {...(doc.data().userData), "docId" : doc.id}; // Extract the entire user data
          console.log('Document ID:', doc.id, ' => Document data:', userData);
          const hashPassword = userData.hashPassword;
          bcrypt.compare(password, hashPassword, (err, result) => {
            if (err) {
              console.log(err)
              return res.status(401).json({ error: "An error occured" });
            } else if (result === true) {
              req.session.user = userData;
              res.json({ message: 'Login successful' });
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


// LOGOUT ALL USER
app.post('/logout', cors(corsOptions), (req, res) => {
  // Clear the session and associated user data
  try{
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
    console.log("you have logged out")
  }
  catch (error) {
    res.status(500).json({ error: "Unable to log out" });
  }
  
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
module.exports = admin;


const tenantRoute = require('./routes/tenant');
const organizerRoute = require('./routes/organizer');
app.use('/tenant', tenantRoute);
app.use('/organizer', organizerRoute);
exports.app = functions.https.onRequest(app);
