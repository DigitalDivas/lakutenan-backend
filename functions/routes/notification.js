const express = require('express');
const router = express.Router();
const {User, Tenant, Booths, Booth_Tenant, OrgNotif, TenantsNotif} = require("../config");
const cors = require('cors');

// get untuk organizer
router.get('/o/follow', async(req, res) => {
    const user = req.session.user;
    if(!user)   {
        return res.status(403).json("Unauthorized. Must be logged in")
    }
    try{
        if (user.role != "organizer")   {
            return res.status(403).json("Unauthorized. For organizers only")
        }
        OrgNotif.where('type', '==', "follow").get()
            .then(querySnapshot =>{
                if (querySnapshot.empty){
                res.status(400).json("empty")
                } 
                else{
                var result = [];
                querySnapshot.forEach(doc => {
                    result.push(doc.data())
                });
                res.json(result);
                }
                })
    }
    catch(e)    {
        console.log(e)
        return res.status(500).json("Internal server error")
    }
  })



  router.get('/o/mangkal', async(req, res) => {
    const user = req.session.user;
    if(!user)   {
        return res.status(403).json("Unauthorized. Must be logged in")
    }
    try{
        if (user.role != "organizer")   {
            return res.status(403).json("Unauthorized. For organizers only")
        }
        OrgNotif.where('type', '==', "mangkal").get()
            .then(querySnapshot =>{
                if (querySnapshot.empty){
                res.status(400).json("empty")
                } 
                else{
                var result = [];
                querySnapshot.forEach(doc => {
                    result.push(doc.data())
                });
                res.json(result);
                }
                })
    }
    catch(e)    {
        console.log(e)
        return res.status(500).json("Internal server error")
    }
  })


  // get untuk organizer
  router.get('/t/accept', async(req, res) => {
    const user = req.session.user;
    if(!user)   {
        return res.status(403).json("Unauthorized. Must be logged in")
    }
    try{
        if (user.role != "tenant")   {
            return res.status(403).json("Unauthorized. For organizers only")
        }
        TenantsNotif.where('type', '==', "accept").get()
            .then(querySnapshot =>{
                if (querySnapshot.empty){
                res.status(400).json("empty")
                } 
                else{
                var result = [];
                querySnapshot.forEach(doc => {
                    result.push(doc.data())
                });
                res.json(result);
                }
                })
    }
    catch(e)    {
        console.log(e)
        return res.status(500).json("Internal server error")
    }
  })

  router.get('/t/invite', async(req, res) => {
    const user = req.session.user;
    if(!user)   {
        return res.status(403).json("Unauthorized. Must be logged in")
    }
    try{
        if (user.role != "tenant")   {
            return res.status(403).json("Unauthorized. For organizers only")
        }
        TenantsNotif.where('type', '==', "invite").get()
            .then(querySnapshot =>{
                if (querySnapshot.empty){
                res.status(400).json("empty")
                } 
                else{
                var result = [];
                querySnapshot.forEach(doc => {
                    result.push(doc.data())
                });
                res.json(result);
                }
                })
    }
    catch(e)    {
        console.log(e)
        return res.status(500).json("Internal server error")
    }
  })

  


  module.exports = router;