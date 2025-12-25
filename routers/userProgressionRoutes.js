const express = require("express");
const userProgressionController = require("../controllers/userProgressionControllers");
const auth = require("../middleware/auth");
const router = express.Router();




////////////////////////////////
// Get available quizzes for a user
///////////////////////////////
router.route("/available").get(auth, userProgressionController.getUserAvailableQuizzes);



////////////////////////////////////////
// Get a specific quiz only if unlocked
/////////////////////////////////////
router.route("/:quizId").get(auth, userProgressionController.getQuiz);



////////////////////////////////////////////
//// SUBMIT QUIZ AND CHECK PROGRESSION//////
///////////////////////////////////////////

router.route("/:quizId/submit").post( auth, userProgressionController.submitQuiz);



////////////////////////////////
//// Reset User Progression////
///////////////////////////////

router.route("/reset").post( auth, userProgressionController.resetUserProgress);



module.exports = router;
