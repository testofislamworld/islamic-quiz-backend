const express = require("express");
const certificateController = require("../controllers/certificateControllers");
const auth = require("../middleware/auth");
const router = express.Router();

/////////////////////////////////////////////
///////// CREATE Certificate /////////////////////
///////////////////////////////////////////

router.route("/").post(auth, certificateController.createCertificate);

/////////////////////////////////////////////
///////// GET ALL Certificate ///////////////////
///////////////////////////////////////////

router.route("/").get(auth, certificateController.getAllCertificates);

/////////////////////////////////////////////
///////// GET SINGLE certificate DETAIL /////////////////
///////////////////////////////////////////

router.route("/single/:id").get(auth, certificateController.getSingleCertificate);

/////////////////////////////////////////////
///////// GET SINGLE User certificate /////////////////
///////////////////////////////////////////

router.route("/all-user-certificate").get(auth, certificateController.getUserCertificate);


module.exports = router;
