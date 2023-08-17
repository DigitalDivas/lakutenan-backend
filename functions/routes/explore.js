const express = require('express');
const router = express.Router();
const { User, Events, Tenant } = require("../config.js");

router.get('/event/:lokasi', async (req, res) => {
    const lokasi = req.params.lokasi;

    try {
        Events.where('lokasi', '==', lokasi).get()
        .then(querySnapshot => {
            console.log(querySnapshot);
            if (querySnapshot.empty) {
                return res.status(401).json({ error: "No event available" });
            } 
            else {
                const array = [];
                querySnapshot.forEach(doc => {
                    // console.log(doc.data());
                    array.push({...(doc.data()), "docId" : doc.id})
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
                    // console.log(doc.data());
                    // console.log(doc.data());
                    // console.log(doc.data().userID);
                    array.push({...(doc.data()), "docId" : doc.id});
                })
                return res.status(200).json(array);
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