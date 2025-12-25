const express = require("express");
const categoryController = require("../controllers/categoryControllers");
const auth = require("../middleware/auth");
const router = express.Router();


const multer = require("multer");

// Set up multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


/////////////////////////////////////////////
///////// CREATE CATEGORY /////////////////////
///////////////////////////////////////////

router.route("/").post(auth, upload.single("image"),categoryController.createCategory);
 


/////////////////////////////////////////////
///////// UPDATE CATEGORY /////////////////////
///////////////////////////////////////////

router.route("/:id").put(auth, upload.single("image"),categoryController.updateCategory);


/////////////////////////////////////////////
///////// GET ALL CATEGORY ///////////////////
///////////////////////////////////////////

router.route("/").get(auth, categoryController.getAllCategory);

/////////////////////////////////////////////
///////// GET SINGLE CATEGORY /////////////////
///////////////////////////////////////////

router.route("/single/:id").get(auth, categoryController.getSingleCategory);

/////////////////////////////////////////////
///////// REMOVE CATEGORY /////////////////
///////////////////////////////////////////

router.route("/:id").delete(auth, categoryController.removeCategory);


/////////////////////////////////////////////
///////// GET AVAILABLE CATEGORY WITH STATUS LOCKED AND UNLOCKED/////////////////
///////////////////////////////////////////
router.route("/available").get( auth, categoryController.getUserAvailableCategories);

/////////////////////////////////////////////
///////// GET QUIZ BY CATEGORY WITH STATUS LOCKED AND UNLOCKED/////////////////
///////////////////////////////////////////
router.route("/:categoryId/quizzes").get(auth, categoryController.getQuizzesByCategory);

module.exports = router;

