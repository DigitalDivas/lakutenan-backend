const express = require('express');
const router = express.Router();
// Define the Events collection reference
const {User, Events} = require('../config');

router.get('/event/:eventId', async (req, res) => {
    const eventId = req.params.eventId;
    try {
        Events.where('id', '==', parseInt(eventId)).get()
        .then(querySnapshot => {
            console.log(querySnapshot);
            if (querySnapshot.empty) {
                return res.status(401).json({ error: "No event found with the specified id" });
            } 
            else {
                querySnapshot.forEach(doc => {
                    // const judul = doc.data().judul;
                    // const lokasi = doc.data().lokasi;
                    // const datetime = doc.data().datetime.toDate();
                    // const panduan = doc.data().panduan;
                    // const organizer = doc.data().organizer;
                    // const link = doc.data().link;
                    // const instagram = doc.data().instagram;

                    // console.log("Judul: " + judul);
                    // console.log("Lokasi: " + lokasi);
                    // console.log("Datetime: " + datetime);
                    // console.log("Panduan: " + panduan);
                    // console.log("Organizer: " + organizer);
                    // console.log("Link: " + link);
                    // console.log("Instagram: " + instagram);
                    console.log(doc.data());
                    return res.status(200).json(doc.data())

                })
            }
        })
        .catch(error => {
            console.error('Error getting documents:', error);
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(401).send("Error");
    }
});

module.exports = router;
