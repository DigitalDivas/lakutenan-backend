const express = require('express');
const router = express.Router();
const User = require("../config");
const cors = require('cors')
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

// method post
router.post('/', (req, res) => {
  
});

// Export the router
module.exports = router;