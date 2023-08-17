const express = require('express');
const router = express.Router();
const {User, Tenant, Booths, Booth_Tenant, OrgNotif, TenantsNotif} = require("../config");
const cors = require('cors');


// router.post("", async (req, res) => {
//     try {
//         const validType = ['follow', 'invite', 'mangkal', 'accept', 'pay', 'paymenconfirmed'];
//         const type = req.body.type.toLowerCase();
//         if (type){
//             if (!validType.includes(tag.toLowerCase())) {
//                 return res.status(400).json({
//                   error: 'Invalid notif type provided.'
//                 });
//               }
//             else    {
//                 switch (type) {
//                     case 'follow':
//                       // Perform database operation
//                       // Send a JSON response
//                       res.json({ message: 'This is case 1' });
//                       break;
//                     case 'invite':
//                       // Call a function
//                       // Set a custom response header
//                       res.setHeader('X-Custom-Header', 'Hello');
//                       // Send a status code and response
//                       res.status(200).send('This is case 2');
//                       break;
//                     case 'mangkal':
//                       // Render a view using a template engine (e.g., EJS, Pug)
//                       res.render('case3', { value });
//                       break;
//                     case 'accept':
//                     // Render a view using a template engine (e.g., EJS, Pug)
//                     res.render('case3', { value });
//                     break;
//                     case 'pay':
//                       // Render a view using a template engine (e.g., EJS, Pug)
//                       res.render('case3', { value });
//                       break;
//                     case 'paymenconfirmed':
//                     // Render a view using a template engine (e.g., EJS, Pug)
//                     res.render('case3', { value });
//                     break;
//                     default:
//                       // Send a default response
//                       res.send('Unknown case');
//                   }
//             }
//         }
//         else{
//             res.status(500).json({ error: "Internal server error" });
//             console.log("Notification type must be specified") 
//         }
        
//       } catch (error) {
//         res.status(500).json({ error: "Internal server error" });
//         console.log(error)
//       }
//   });


  module.exports = router;