const express = require('express');
const router = express.Router();
const { User, Events, Tenant } = require("../config");
const cors = require('cors')

// Define route handlers
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus:200
}
router.use(cors(corsOptions));

router.get('/event/:category', async (req, res) => {
    const category = req.params.category;

    try {
        Events.where('kategori', '==', category).get()
        .then(querySnapshot => {
            console.log(querySnapshot);
            if (querySnapshot.empty) {
                return res.status(401).json({ error: "No event available" });
            } 
            else {
                const array = [];
                querySnapshot.forEach(doc => {
                    // console.log(doc.data());
                    array.push(doc.data())
                })
                return res.status(200).json(array)
            }
        })
        .catch(error => {
            console.error('Error getting documents: ', error);
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(401).send("Error");
    }
})

router.get('/tenant/:category', async (req, res) => {
    const category = req.params.category;

    try {
        Tenant.where('tag', '==', category).get()
        .then(querySnapshot => {
            console.log(querySnapshot);
            if (querySnapshot.empty) {
                return res.status(401).json({ error: "No tenants available" });
            } 
            else {
                const array = [];
                querySnapshot.forEach(doc => {
                    console.log(doc.data());
                    array.push(doc.data())
                })
                return res.status(200).json(array)
            }
        })
        .catch(error => {
            console.error('Error getting documents: ', error);
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(401).send("Error");
    }
})

// Export the router
module.exports = router;