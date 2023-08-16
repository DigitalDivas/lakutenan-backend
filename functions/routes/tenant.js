const express = require('express');
const router = express.Router();
const {User, Tenant, Booths, Booth_Tenant} = require("../config");
const cors = require('cors');
// Define route handlers
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus:200
}
router.use(cors(corsOptions));

async function checkTenantFirstTime(userRef) {

  Tenant.where('user', '==', userRef).get()
  .then(querySnapshot => {
      if (querySnapshot.empty) {
      return true;
      } 
      else {
      return false;
      }
  })
  .catch(error => {
      console.error('Error getting Organizer:', error);
  });
}

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
          if (!checkTenantFirstTime(userRef)){
              const customErrorCode = 400401
              res.status(404).json({
                  errorCode: customErrorCode,
                  message: "You have a profile already"
                });
          }
          else {
              var { nama, lokasi, tag, link, deskripsi } = req.body;
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
  const { boothId } = req.body;
  const userRef = User.doc(req.session.user.docId);

  try {
    if(boothId && userRef){
      var boothRef = Booths.doc(boothId);
      var tenantRef;
      // console.log(userRef)
      // console.log(req.session.user.docId)
      
      Tenant.where('user', '==', userRef).get()
      .then(querySnapshot =>{
        if (querySnapshot.empty){
          res.status(400).json("empty")
        } 
        else{
          querySnapshot.forEach(doc => {
            tenantRef = Tenant.doc(doc.id)
            // console.log(tenantRef)
          })

          Booth_Tenant.add({
            booth: boothRef,
            tenant: tenantRef,
            paid: false
          })

          res.status(200).json({message : "successfully enrolled"});
        }
      })
    
      
      // // get current data
      // boothRef.get().then(docSnapshot =>{
      //     if (docSnapshot.exists) {
      //       // console.log(docSnapshot.data());
      //       terdaftar = docSnapshot.data().terdaftar;
      //       // console.log(terdaftarSaatIni);
      //       terdaftar.push(userRef);
      //       // console.log(terdaftarSaatIni);
      //       // res.status(200).json(terdaftarSaatIni);
      //     } else {
      //       return res.status(401).json({ error: "No booth found with the specified id" });
      //     }
      // })

    } else {
      res.status(401).send('Unauthorized');
    }

  } catch (error) {
    res.status(500).json({ error: `${error}` });
    console.log(error)
  }
})

// Export the router
module.exports = router;