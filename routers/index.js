const express = require("express");
const router = express.Router();

//// ***** FIRST API ROUTES FOR CHECK SERVER RUNNING ON NOT **** //////
router.get("/", (req, res) => res.send("WELCOME TO API"));




module.exports = router;