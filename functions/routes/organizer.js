const express = require('express');
const router = express.Router();
// Define the Events collection reference
const {User, Events, Organizer, Booths, TenantsNotif, Booth_Tenant} = require('../config');
const cors = require('cors')
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const admin = require("firebase-admin");
// const admin = require('../index');
// Define route handlers
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus:200
}
const bucket = admin.storage().bucket(); // Firebase Cloud Storage bucket


// api to get the details of a particular event using doc id
router.get('/event/:eventId', async (req, res) => {
    const eventId = req.params.eventId;
    try {
        const docRef = Events.doc(eventId);
        docRef.get()
        .then((docSnapshot) => {
            if (docSnapshot.exists) {
                console.log(docSnapshot.data());
                return res.status(200).json({...(docSnapshot.data()), "docId" : docSnapshot.id});
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
// router.put('/edit-event/:eventId', async (req, res) => {
//     const eventId = req.params.eventId;
//     const user = req.session.user;
//     const newData = req.body;
//     console.log(eventId);

//     if (user) {
//         const userId = "/Users/" + req.session.user.docId;
//         try {
//             const eventDetailsSnapshot = await Events.doc(eventId).get();

//             if (!eventDetailsSnapshot.exists) {
//                 return res.status(401).json({ error: "No event found with the specified id" });
//             } 
            
//             const organizerId = eventDetailsSnapshot.data().organizer;
//             console.log(organizerId);
//             console.log(userId);


//             if (organizerId === userId) {
//                 console.log("boleh edit");
//                 await Events.doc(eventId).update(newData);

//                 return res.json({ message: "Event details updated successfully" });
//             } else {
//                 return res.status(401).json({ error: "Only the organizer has permission to update event details" });
//             }    
//         } catch (error) {
//             console.error('Error updating event details:', error);
//             return res.status(500).json({ error: "An error occurred while updating event details" });
//         }
//     } else {
//         return res.status(401).json({ error: "Log In to update event details" });
//     }
// });

// api to edit the booth capacity
// router.put('/edit-booth/:boothId', async (req, res) => {
//     const boothId = req.params.boothId;
//     console.log(boothId);
//     const user = req.session.user;
//     const newData = req.body;

//     if (user) {
//         const userId = "/Users/" + req.session.user.docId;
//         console.log("user id: " + userId);
//         try {
//             const boothDetailsSnapshot = await Booths.doc(boothId).get();
//             if (!boothDetailsSnapshot.exists) {
//                 return res.status(401).json({ error: "No booth found with the specified id" });
//             } 
//             const eventId = boothDetailsSnapshot.data().event.id;
//             console.log("event id: " + eventId);

//             const eventDetailsSnapshot = await Events.doc(eventId).get();
//             if (!eventDetailsSnapshot.exists) {
//                 return res.status(401).json({ error: "No event found with the specified id" });
//             } 
            
//             const organizerId = eventDetailsSnapshot.data().organizer;
//             console.log("organizer id: " + organizerId);


//             if (organizerId === userId) {
//                 console.log("boleh edit");
//                 await Booths.doc(boothId).update(newData);

//                 return res.json({ message: "Booth capacity updated successfully" });
//             } else {
//                 return res.status(401).json({ error: "Only the organizer has permission to update booth capacity" });
//             }    
//         } catch (error) {
//             console.error('Error updating booth capacity:', error);
//             return res.status(500).json({ error: "An error occurred while updating booth capacity" });
//         }
//     } else {
//         return res.status(401).json({ error: "Log In to update booth capacity" });
//     }
// });


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
            // var isOrganizerFirstTime = false;
            Organizer.where('user', '==', userRef).get()
                .then(async querySnapshot => {
                    if (querySnapshot.empty) {
                        const { nama } = req.body;
                    var fotoKtp = req.file; 
                    if (nama && fotoKtp)    {
                        var organizerData = {
                            nama: nama,
                            user: userRef,
                            followerCount: 0,
                            followers : []
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
                        fotoKtp = imageUrl;
                        organizerData = {...organizerData, fotoKtp : fotoKtp}
                        await Organizer.add( organizerData ).then(async () =>{
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
                        } 
                    else    {
                        const customErrorCode = 400401;
                        res.status(404).json({
                            errorCode: customErrorCode,
                            message: "You have a profile already"
                        });
                    }
                    })
                    .catch(error => {
                        console.error('Error getting Organizer:', error);
                        return res.status(401).send("Error");
                    });
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

// post event utk organizer
router.post('/post', cors(corsOptions), async(req, res) =>{
    const {instagram , judul , kategori , link , lokasi , panduan } = req.body
    
    try {
        
        datetime = new Date();
        const user = req.session.user;
        if (!user)   {
            return res.status(403).json({ error: "Unauthorized"});
        }
        else {
            if( instagram && judul && kategori && link && lokasi && panduan)   { 
                if (user.role = 'organizer' && user.docId)    {
                        const userRef = User.doc(user.docId);
                    Organizer.where('user', '==', userRef).get()
                        .then(querySnapshot =>{
                            if (querySnapshot.empty){
                            return res.status(403).json("Not registered as Organizer")
                            } 
                            else{
                            querySnapshot.forEach( doc => {
                                const orgRef = Organizer.doc(doc.id);
                                const followers = doc.data().followers
                                if (orgRef) {
                                    const eventData = {
                                        datetime: datetime,
                                        instagram: instagram,
                                        judul: judul,
                                        kategori: kategori,
                                        link: link,
                                        lokasi: lokasi,
                                        organizer: orgRef,
                                        panduan: panduan
                                    }
                                     Events.add({eventData}).then((eventRef) => {
                                        // const notifData = {
                                        //     type: "invite",
                                        //     fromo: userRef, 
                                        //     eventRef: eventRef, 
                                        //     time:datetime
                                        // }
                                        followers.forEach((follower) => {
                                            const notifData = {
                                                type: "invite",
                                                fort: follower,
                                                fromo: userRef, 
                                                eventRef: eventRef, 
                                                time:datetime
                                            }
                                            console.log(follower)
                                            TenantsNotif.add(notifData);
                                        })

                                    }).then(() => {
                                       res.status(200).json({ message : "Event has been broadcasted successfully"}) 
                                    })
                                    
                                }
                                else{
                                    return res.status(400).json("organizer not found")  
                                }
                            })
                            }
                            })
                } 
                    else    {
                        return res.status(401).json({ error: "Unauthorized. Organizer user only"});
                    }
            
            }
            else {
                return res.status(401).json({ error: "data not found"})
            }
           
        }
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
})

// post booth untuk organizer
router.post('/add-booth/:eventId', cors(corsOptions), async(req, res)=>{
    const eventId = req.params.eventId
    const {nama, ukuran, kapasitas_total, harga, fasilitas} = req.body

    try {
        if (eventId && nama && ukuran && harga){
            let eventReference = Events.doc(eventId)
            const boothData = {
                nama: nama,
                ukuran: ukuran,
                kapasitas_total: kapasitas_total,
                terdaftar : [],
                harga: harga,
                fasilitas: fasilitas,
                event: eventReference
            }
            Booths.add(boothData);
            res.status(200).json({ message : "Booth created successfully"})
        } else{
            res.status(401).json({ error: "data not found"})
        }
    } catch (error) {
        res.status(500).json({ error: `${error}` }); 
    }
})

router.get('/get-booth/:eventId', cors(corsOptions), async(req, res) =>{
    const eventId = req.params.eventId
    try {
        if (eventId){
            // Create a reference to the specific document you want to search with
            var eventRef = Events.doc(eventId);
            Booths.where("event", "==", eventRef).get()
            .then(querySnapshot => {
                // console.log(querySnapshot);
                if (querySnapshot.empty) {
                    return res.status(401).json({ error: "No booths available" });
                } 
                else {
                    const array = [];
                    querySnapshot.forEach(doc => {
                        array.push({...(doc.data()), "docId" : doc.id});
                    })
                    return res.status(200).json(array);
                }
            })
            .catch(error => {
                res.status(404).json({ error: `${error}`})
            });
        } else{
            res.status(404).json({ error: "parameter not found"})
        }
    } catch (error) {
        res.status(500).json({ error: `${error}` }); 
    }
})


// organizer acc mou tenant 
router.post('/acc/:boothTenantId', cors(corsOptions), async(req, res) =>{
    const user = req.session.user;
    if (!user)  {
        return res.status(403).json({ error: "Unauthorized" });
    }
    else if (user.role != "organizer") {
        return res.status(403).json({ error: "Unauthorized. For Organizer only" });
    }
    const boothTenantId   =  req.params.boothTenantId;; // boothId dan event ini nanti disimpan di variable di sap
    const userRef = User.doc(req.session.user.docId);
    try {
      if(boothTenantId && userRef){
        var orgRef;
        var boothTenantRef;
        var boothRef;
        var tenantRef;
        var eventRef;
        const btRef = Booth_Tenant.doc(boothTenantId)
        const currentDatetime = new Date()
        var tenantRef;
        var terdaftar;
        var recipientRef;
        Organizer.where('user', '==', userRef).get()
          .then(querySnapshot =>{
            if (querySnapshot.empty){
              return res.status(401).json("Unauthorized. You are not registered as organizer")
            } 
            else{
              querySnapshot.forEach(async doc => {
                namaTenant = doc.data().nama;
                boothTenantRef = Booth_Tenant.doc(boothTenantId);
                boothTenantRef.update({accepted: true}).then(() => {
                    boothTenantRef.get()
                .then(async (docSnapshot) => {
                  if (docSnapshot.empty){
                    return res.status(400).json("Booth cannot be found")
                  } 
                  else  {
                    tenantRef = docSnapshot.data().tenant;
                    orgRef = docSnapshot.data().organizer;
                    boothRef = docSnapshot.data().booth;
                    tenantRef.get().then((doct) => {
                        if (doct.exists) {
                            recipientRef = doct.data().user;
                            boothRef.get().then(async (docb) => {
                        if (docb.exists) {
                            eventRef = docb.data().event;
                            terdaftar = docb.data().terdaftar;
                            if (terdaftar.includes(tenantRef))  {
                                return res.status(400).json("Tenant has been accepted")
                            }
                            terdaftar.push(tenantRef)
                            boothRef.update({terdaftar: terdaftar}).then(async () => {
                                const notifData = {
                                type: "accept",
                                fort: recipientRef ,
                                fromo: userRef, 
                                eventRef: eventRef, 
                                boothTenantRef: btRef, 
                                time:currentDatetime
                            }
                            await TenantsNotif.add(notifData).then(() => {
                                console.log("Notif has been added.");
                                return res.status(200).json( "Request has been successfully sent" ); 
                            }).catch((e) => {
                                res.status(400).json({ error: "Error accepting" });
                                console.log(e)
                            })
                            })
                            
                        } else {
                            return res.status(400).json({ error: "No booth found with the specified id" });
                        }
                    })

                        } else {
                            return res.status(401).json({ error: "No tenant found with the specified id" });
                        }
                    })
                    
                    
                  }
                }).catch((e) =>{
                  return res.status(400).json("Problem fetching booth")
                })
                })
                
        })
          }
        })
      } else {
        res.status(500).send('Invalid input');
      }
  
    } catch (error) {
      res.status(500).json({ error: `${error}` });
      console.log(error)
    }
  })


  // organizer acc mou tenant 


module.exports = router;
