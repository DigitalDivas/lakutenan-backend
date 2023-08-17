const express = require('express');
const router = express.Router();
const {User, Tenant, Booths, Booth_Tenant, OrgNotif, TenantsNotif} = require("../config");
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

// tenant daftar booth
router.post('/mangkal', cors(corsOptions), async(req, res) =>{
  const { boothId } = req.body; // boothId dan event ini nanti disimpan di variable di sap
  const userRef = User.doc(req.session.user.docId);
  const tenantRef = Tenant.doc(req.session.user.roleId)
  var namaTenant;
  try {
    if(boothId && userRef && tenantRef){
      tenantRef.get().then(doc => {
        namaTenant = doc.data().nama
      })
      var boothRef = Booths.doc(boothId);
      var eventRef;
      var orgRef;
      boothRef.get()
          .then(doc => {
            if (doc.exists) {
              eventRef = doc.data().event;
              if (eventRef) {
                eventRef.get().then(async doc => {
                orgRef = doc.data().organizer;
                if (orgRef) {
                  // add to booth-tenant
                  await Booth_Tenant.add({
                    booth: boothRef,
                    tenant: tenantRef,
                    paid: false, 
                    accepted: false
                  }).then(async (btRef) => {
                    // Post to notif
                    const currentDatetime = new Date();
                    const notifData = {
                      type: "mangkal",
                      foro: orgRef ,
                      fromt: tenantRef, 
                      namaTenant: namaTenant, 
                      boothTenantRef: btRef, 
                      time:currentDatetime
                    }
                    await OrgNotif.add(notifData).then(() => {
                      console.log("Notif has been added.");
                      res.status(200).json( "Request has been successfully sent" ); 
                    }).catch((e) => {
                      res.status(400).json({ error: "Error while requesting booth" });
                      console.log(e)
                    })
                    
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
              else  {
                res.status(400).json({ error: "No event can be found from booth" });
              }
              
            } else {
              console.log('Booth not found');
            }})
      
    } else {
      res.status(500).send('Invalid input');
    }

  } catch (error) {
    res.status(500).json({ error: `${error}` });
    console.log(error)
  }
})

// Export the router
module.exports = router;