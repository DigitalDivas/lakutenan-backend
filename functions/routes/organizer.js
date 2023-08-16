const express = require('express');
const router = express.Router();
// Define the Events collection reference
const {User, Events, Organizer} = require('../config');
const cors = require('cors')
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const admin = require('../index');
// Define route handlers
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus:200
}
const bucket = admin.storage().bucket(); // Firebase Cloud Storage bucket

// api to get the details of a particular event pake id
// router.get('/event/:eventId', async (req, res) => {
//     const eventId = req.params.eventId;
//     try {
//         Events.where('id', '==', parseInt(eventId)).get()
//         .then(querySnapshot => {
//             console.log(querySnapshot);
//             if (querySnapshot.empty) {
//                 return res.status(401).json({ error: "No event found with the specified id" });
//             } 
//             else {
//                 querySnapshot.forEach(doc => {
//                     console.log(doc.data());
//                     return res.status(200).json(doc.data())

//                 })
//             }
//         })
//         .catch(error => {
//             console.error('Error getting documents:', error);
//         });
//     } catch (error) {
//         console.error("Error:", error);
//         res.status(401).send("Error");
//     }
// });

// api to get the details of a particular event pake doc id
router.get('/event/:eventId', async (req, res) => {
    const eventId = req.params.eventId;
    try {
        const docRef = Events.doc(eventId);
        docRef.get()
        .then((docSnapshot) => {
            if (docSnapshot.exists) {
                console.log(docSnapshot.data());
                return res.status(200).json(docSnapshot.data());
            } else {
                return res.status(401).json({ error: "No event found with the specified id" });
            }
        })
        .catch((error) => {
            console.error('Error retrieving document:', error);
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(401).send("Error");
    }
});

// api to edit the details of a particular event
router.put('/edit-event/:eventId', async (req, res) => {
    const eventId = req.params.eventId;
    const user = req.session.user;
    const userId = req.session.user.docId;
    const newData = req.body;
    console.log(eventId);

    if (user) {
        try {
            const eventDetailsSnapshot = await Events.doc(eventId).get();

            if (!eventDetailsSnapshot.exists) {
                return res.status(401).json({ error: "No event found with the specified id" });
            } 
            
            const organizerId = eventDetailsSnapshot.data().organizer.id;

            if (organizerId === userId) {
                console.log("boleh edit");
                await Events.doc(eventId).update(newData);

                return res.json({ message: "Event details updated successfully" });
            } else {
                return res.status(401).json({ error: "Only the organizer has permission to update event details" });
            }    
        } catch (error) {
            console.error('Error updating event details:', error);
            return res.status(500).json({ error: "An error occurred while updating event details" });
        }
    } else {
        return res.status(401).json({ error: "Log In to update event details" });
    }
});


/* Post profile pertama kali ke database Organizer
*  di post if and only if user nya selesai isi profile fieldsnya
*/
router.post("/profile/create",  cors(corsOptions), upload.single('fotoKtp'), async (req, res) => {
    try {
        const user = req.session.user;
        console.log(user)
        if (user) {
          const userRole = user.role 
          const userRef = User.doc(user.docId)
          // User is authenticated
          if (userRole === "organizer") {
            const { nama } = req.body;
            var fotoKtp = req.file;
            if (nama && fotoKtp)    {
                var organizerData = {
                    nama: nama,
                    user: userRef,
                }
                // Upload the image to Firebase Cloud Storage
                const uniqueId = user.email + "KTP";// Replace with your method of generating a unique ID
                const imageFileName = `${uniqueId}.jpg`; // Change the file extension as needed
                const file = bucket.file(`organizer/ktp/${imageFileName}`);
                await file.save(fotoKtp.buffer, {
                    metadata: { contentType: 'image/jpeg' }, // Set the appropriate content type
                }).then(async () => {
                    console.log("successfully saved image");
                    // Get the image URL
                    const imageUrl = await file.getSignedUrl({ action: 'read', expires: '01-01-2030'}).catch((e) => {
                        console.log(e);
                        res.status(500).send("Cannot");
                    });
                    // console.log(imageUrl);
                    fotoKtp = imageUrl;
                    organizerData = {...organizerData, fotoKtp : fotoKtp}
                    await Organizer.add({ organizerData }).then(async () =>{
                        console.log("Organizer data stored in Firestore.");
                        res.status(201).json("Your data has been successfully saved");  
                    }).catch((e) => {
                        console.error("Error creating profile:", error);
                        res.status(500).json({ error: error.message }); 
                    })
                }).catch((e) => {
                    console.log(e);
                    res.status(500).send("Unable to save image")
                });


            }
            else {
                res.status(500).send("Input must not be empty")
            }
          } else {
            res.status(403).json({ error: "Unauthorized. This page is for Event Organizer users" });
          }
        } else {
          res.status(401).send('Unauthorized');
        }
        
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
        console.log(error)
      }
  });


module.exports = router;
