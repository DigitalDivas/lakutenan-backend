const express = require('express');
const router = express.Router();
const {User, Tenant, Booths, Booth_Tenant, Organizer, OrgNotif} = require("../config.js");
const cors = require('cors');
// Define route handlers
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus:200
}
router.use(cors(corsOptions));

// Session middleware setupH GET API FOR TENANT ONLY
router.get("/tenant-only", async (req, res) => {
    try {
      const user = req.session.user;
        
      if (user) {
        const userRole = user.role 
        // User is authenticated
        if (userRole === "tenant") {
          res.status(200).json({ message: "Welcome, tenant!" });
        } else {
          res.status(403).json({ error: "Unauthorized" });
        }
      } else {
        res.status(401).send('Unauthorized');
      }
      
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
      console.log(error)
    }
  });

/* Post profile pertama kali ke database Tenant
*  di post if and only if user nya selesai isi profile fieldsnya
*/
router.post("/profile/create",  cors(corsOptions), async (req, res) => {
  try {
      const user = req.session.user;
      console.log(user)
      if (user) {
        const userRole = user.role 
        const userRef = User.doc(user.docId)
        // User is authenticated
        if (userRole === "tenant") {
          Tenant.where('user', '==', userRef).get()
            .then(async querySnapshot => {
                if (querySnapshot.empty) {
                  var { nama, lokasi, tag, kontak, link, deskripsi } = req.body;
                  if (nama && lokasi && tag && link && deskripsi )    {
                      const validTag = ['makanan & minuman', 'pakaian', 'jasa', 'souvenir', 'kosmetik'];
                      if (!validTag.includes(tag.toLowerCase())) {
                        return res.status(400).json({
                          error: 'Invalid status value provided.'
                        });
                      }
                      else  {
                        tag = tag.toLowerCase();
                        var tenantData = {
                          nama: nama,
                          lokasi: lokasi,
                          tag: tag,
                          kontak: kontak, 
                          link: link,
                          deskripsi: deskripsi,
                          countFollowings: 0,
                          followings : [],
                          user: userRef
                      }
                      await Tenant.add( tenantData ).then(async () =>{
                          console.log("Tenant data stored in Firestore.");
                          res.status(201).json("Your data has been successfully saved");  
                      }).catch((e) => {
                          console.error("Error creating profile:", error);
                          res.status(500).json({ error: error.message }); 
                      })
                      }
                      
                  }
                  else {
                      res.status(500).send("Input must not be empty")
                  }
                } 
                else  {
                  const customErrorCode = 400401
                  res.status(404).json({
                      errorCode: customErrorCode,
                      message: "You have a profile already"
                    });
                }
            })
            .catch(error => {
                console.error('Error getting Organizer:', error);
            });
        } else {
          res.status(403).json({ error: "Unauthorized. This page is for Event Tenant users" });
        }
      } else {
        res.status(401).send('Unauthorized');
      }
      
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
      console.log(error)
    }
});

// tenant daftar booth
router.post('/mangkal', cors(corsOptions), async(req, res) =>{
  const user = req.session.user;
  if (!user)  {
    return res.status(403).json({ error: "Unauthorized" });
  }
  else if (user.role != "tenant") {
    return res.status(403).json({ error: "Unauthorized. For Tenants only" });
  }
  const { boothId } = req.body; // boothId dan event ini nanti disimpan di variable di sap
  const userRef = User.doc(req.session.user.docId);
  var recipientRef;
  var namaTenant;
  var orgRef;
  var eventRef;
  try {
    if(boothId && userRef){
      var tenantRef;
      Tenant.where('user', '==', userRef).get()
        .then(querySnapshot =>{
          if (querySnapshot.empty){
            return res.status(401).json("Unauthorized. You are not registered as tenant")
          } 
          else{
            querySnapshot.forEach(async doc => {
              namaTenant = doc.data().nama;
              tenantRef = Tenant.doc(doc.id)
              boothRef = Booths.doc(boothId)
              await boothRef.get()
                      .then(async (docSnapshot) => {
                          if (docSnapshot.exists) {
                              eventRef = docSnapshot.data().event;
                              if (eventRef)  {
                                eventRef.get().then(async doct => {
                                      orgRef = doct.data().organizer;
                                      console.log(orgRef)
                                      if (orgRef) {
                                        // add to booth-tenant
                                        await Booth_Tenant.add({
                                          booth: boothRef,
                                          tenant: tenantRef,
                                          organizer:orgRef,
                                          paid: false, 
                                          accepted: false
                                        }).then(async (btRef) => {
                                          orgRef.get().then(async (doco) => {
                                            if (doco.exists) {
                                                recipientRef = doco.data().user;
                                                const currentDatetime = new Date();
                                                const notifData = {
                                                  type: "mangkal",
                                                  foro: recipientRef ,
                                                  fromt: userRef, 
                                                  namaTenant: namaTenant, 
                                                  boothTenantRef: btRef, 
                                                  time:currentDatetime
                                                }
                                                await OrgNotif.add(notifData).then(() => {
                                                  console.log("Notif has been added.");
                                                  return res.status(200).json( "Request has been successfully sent" ); 
                                                }).catch((e) => {
                                                  res.status(400).json({ error: "Error while requesting booth" });
                                                  console.log(e)
                                                })
                                            } else {
                                                return res.status(401).json({ error: "No organizer found with the specified id" });
                                            }
                                        })
                                          // Post to notif
                                          
                                          
                                        }).catch((e) => {
                                          res.status(400).json({ error: "There is an error adding when adding the booth" });
                                          console.log(e)
                                        })
                                      }
                                      else {
                                        res.status(400).json({ error: "No organizer can be found from event" });
                                      }
                                  })
                              }
                              else {
                                return res.status(401).json({ error: "No tenant found with the specified booth" });
                              }
                          } else {
                              return res.status(401).json({ error: "No booth found with the specified id" });
                          }
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

// api tenant follow organizer
router.put('/follow/:organizerId', async (req, res) => {
  const organizerId = req.params.organizerId;
  console.log(organizerId);
  const user = req.session.user;


  if (user) {
      if (user.role != 'tenant') {
          return res.status(401).json({ error: "Only tenant can follow organizer" });
      }

      const userRef = User.doc(req.session.user.docId);
      console.log("org id: " + organizerId);

      // tenant
      let tenantRef;
      let tenantFollowings;
      let tenantCountFollowings;
      let namaTenant;
      let organizerRef;
      let recipientRef;
      try {
          const tenantQuerySnapshot = await Tenant.where('user', '==', userRef).get();
      
          if (tenantQuerySnapshot.empty) {
              return res.status(401).json({ error: "Complete your tenant profile first" });
          } else {
              tenantQuerySnapshot.forEach(doc => {
                  tenantRef = Tenant.doc(doc.id);
                  tenantFollowings = doc.data().followings;
                  tenantCountFollowings = doc.data().countFollowings;
                  namaTenant = doc.data().nama;
              });
          }
      } catch (error) {
          console.error('Error getting documents:', error);
          return res.status(500).json({ error: "An error occurred while retrieving tenant data" });
      }

      // organizer
      organizerRef = Organizer.doc(organizerId);
      const organizerSnapshot = await organizerRef.get();
      if (!organizerSnapshot.exists) {
          return res.status(404).json({ error: "No organizer found with the specified id" });
      } 
      else {
        recipientRef = organizerSnapshot.data().user;
      }

      let organizerFollowers = organizerSnapshot.data().followers;
      let organizerFollowersCount = organizerSnapshot.data().followerCount;

      // cek udah follow belum
      if (follower(tenantRef, organizerFollowers)) {
          return res.status(500).json({ error: "You already followed this organizer" });
      }

      console.log("nyampe sini")

      // add tenant to ogranizer's followers 
      const addToFollowers = organizerRef.get().then(async (docSnapshot) => {
        if (docSnapshot.exists) {
          const followers = docSnapshot.data().followers;
          // const doc = await t.get(organizerRef);
          // const organizerData = doc.data();
          
          // Append tenantRef to the existing followers array
          const updatedFollowers = [...followers, tenantRef];
          
          // Update the followers field with the updated array
          await organizerRef.update({ followers: updatedFollowers });
        } else {
            return res.status(401).json({ error: "No organizer found with the specified id" });
        }
    })
    // (async t => {
    //       const doc = await t.get(organizerRef);
    //       const organizerData = doc.data();
          
    //       // Append tenantRef to the existing followers array
    //       const updatedFollowers = [...organizerData.followers, tenantRef];
          
    //       // Update the followers field with the updated array
    //       t.update(organizerRef, { followers: updatedFollowers });
    //   });

      // add organizer to tenant's following
      const addToFollowing = tenantRef.get().then(async (docSnapshot) => {
        if (docSnapshot.exists) {
          const followings = docSnapshot.data().followings;
          // const doc = await t.get(organizerRef);
          // const organizerData = doc.data();
          
          // Append tenantRef to the existing followers array
          const updatedFollowings = [...followings, organizerRef];
          
          // Update the followers field with the updated array
          await tenantRef.update({ followings: updatedFollowings });
        }
        else {
          return res.status(401).json({ error: "No tenant found with the specified id" });
      }
          // const doc = await t.get(tenantRef);
          // const tenantData = doc.data();
          
          // // Append organizerRef to the existing followers array
          // const updatedFollowing = [...tenantData.followings, organizerRef];
          

          // // Update the followings field with the updated array
          // t.update(tenantRef, { followings: updatedFollowing });
      });

      // handle notification
      const currentDatetime = new Date()
      const notifData = {
        type: "follow",
        foro: recipientRef ,
        fromt: userRef, 
        namaTenant: namaTenant, 
        time:currentDatetime
      }
      const pushNotif = OrgNotif.add(notifData).catch((e) => {
        console.log(e);
        return res.status(400).json({ error: "Error while following event" });
      })

      try {
          await addToFollowers;
          await addToFollowing;
          await Tenant.doc(tenantRef.id).update({countFollowings: tenantCountFollowings + 1});
          await Organizer.doc(organizerRef.id).update({followerCount: organizerFollowersCount + 1});
          await pushNotif;
          return res.status(200).json({ result: `Followed.`, message: `You are now following ${organizerId}`});
      } catch (err) {
          console.error(err);
          return res.status(500).json({ result: `Error: ${err.message}` });
      }
  } 
  else {
      return res.status(401).json({ error: "Log In to follow organizer" });
  }
});

// router.put('/follow/:organizerId', async (req, res) => {
//     const organizerId = req.params.organizerId;
//     const user = req.session.user;

//     if (user) {
//         if (user.role !== 'tenant') {
//             return res.status(401).json({ error: "Only tenants can follow organizers" });
//         }

//         const userRef = User.doc(req.session.user.docId);
//         const organizerRef = Organizer.doc(organizerId);

//         try {
//             const tenantQuerySnapshot = await Tenant.where('user', '==', userRef).get();

//             if (tenantQuerySnapshot.empty) {
//                 return res.status(401).json({ error: "Complete your tenant profile first" });
//             }

//             const tenantDoc = tenantQuerySnapshot.docs[0];
//             const tenantRef = tenantDoc.ref;
//             const tenantData = tenantDoc.data();

//             if (follower(tenantRef, tenantData.followings)) {
//                 return res.status(500).json({ error: "You already followed this organizer" });
//             }

//             // Run the transactions
//             const addToFollowers = admin.firestore().runTransaction(async t => {
//                 const organizerDoc = await t.get(organizerRef);
//                 const organizerData = organizerDoc.data();
//                 const updatedFollowers = [...organizerData.followers, tenantRef];
//                 t.update(organizerRef, { followers: updatedFollowers });
//             });

//             const addToFollowing = admin.firestore().runTransaction(async t => {
//                 const updatedFollowings = [...tenantData.followings, organizerRef];
//                 t.update(tenantRef, { followings: updatedFollowings });
//             });

//             await Promise.all([addToFollowers, addToFollowing]);
//             await tenantRef.update({ countFollowings: tenantData.countFollowings + 1 });
//             await organizerRef.update({ followerCount: organizerData.followerCount + 1 });

//             return res.status(200).json({ result: "Followed." });
//         } catch (err) {
//             console.error(err);
//             return res.status(500).json({ result: `Error: ${err.message}` });
//         }
//     } else {
//         return res.status(401).json({ error: "Log In to follow organizer" });
//     }
// });

// tenant bayar booth
// router.post('/bayar/:boothTenantId', cors(corsOptions), async(req, res) =>{
//   const boothTenantId  = req.params.boothTenantId; // boothId dan event ini nanti disimpan di variable di sap
//   const userRef = User.doc(req.session.user.docId);
//   try {
//     if(boothTenantId && userRef){
//       var orgRef;
//       var boothTenantRef;
//       var namaTenant;
//       const btRef = Booth_Tenant.doc(boothTenantId)
//       const currentDatetime = new Date()
//       var tenantRef;
//       Tenant.where('user', '==', userRef).get()
//         .then(querySnapshot =>{
//           if (querySnapshot.empty){
//             return res.status(401).json("Unauthorized. You are not registered as tenant")
//           } 
//           else{
//             querySnapshot.forEach(async doc => {
//               namaTenant = doc.data().nama;
//               tenantRef = Tenant.doc(doc.id);
//               boothTenantRef = Booth_Tenant.doc(boothTenantId);
//               boothTenantRef.get()
//               .then(async (docSnapshot) => {
//                 if (docSnapshot.empty){
//                   return res.status(400).json("Booth cannot be found")
//                 } 
//                 else  {
//                 orgRef = docSnapshot.data().organizer;
//                 const notifData = {
//                   type: "pay",
//                   foro: orgRef ,
//                   fromt: tenantRef, 
//                   namaTenant: namaTenant, 
//                   boothTenantRef: btRef, 
//                   time:currentDatetime
//                 }
//                 await OrgNotif.add(notifData).then(() => {
//                   console.log("Notif has been added.");
//                   return res.status(200).json( "Request has been successfully sent" ); 
//                 }).catch((e) => {
//                   res.status(400).json({ error: "Error payment" });
//                   console.log(e)
//                 })
//                 }
//               }).catch((e) =>{
//                 return res.status(400).json("Problem fetching booth")
//               })
//       })
//         }

//       })
//     } else {
//       res.status(500).send('Invalid input');
//     }

//   } catch (error) {
//     res.status(500).json({ error: `${error}` });
//     console.log(error)
//   }
// })

// function to check followers
function follower(tenantRef, listFollowers) {
    var i;
    for (i = 0; i < listFollowers.length; i++) {
        if (listFollowers[i].id === tenantRef.id) {
            console.log("inside follower func");
            console.log(listFollowers[i].id);
            console.log(tenantRef.id);
            return true;
        }
    }

    return false;
}


// Export the router
module.exports = router;