const { Quiz, validate } = require("../modal/Quiz");
const tryCatcheHanlder = require("../utils/tryCatch");
const cloudinary = require("cloudinary").v2;

////////////////////////////////////////
///////// Shuffle Helper 🔀 ///////////
//////////////////////////////////////
function shuffleArray(array) {
  const shuffled = [...array]; // Create a copy to avoid mutating original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
////////////////////////////////////////
/////////// Create Quiz 👤 ///////////
//////////////////////////////////////
exports.createQuiz = tryCatcheHanlder(async (req, res, next) => {


  const quizExited = await Quiz.find({
    $and: [
      { "title.value": req.body.title[0].value }, // Match the 'value' in the title array
      { quiz_category: req.body.quiz_category } // Match the quiz_category
    ]
  });

  /// if quiz exist
  if (quizExited.length > 0) {
    return res
      .status(400)
      .json({ success: 0, message: "Quiz is already existed" });
  }

  const quiz = new Quiz(req.body);
  await quiz.save();
  return res
    .status(200)
    .json({ success: 1, data: quiz, message: "Quiz is added successfully" });
});

////////////////////////////////////////
/////////// Add Image To Quiz 👤 ///////////
//////////////////////////////////////
exports.addImageToQuiz = tryCatcheHanlder(async (req, res, next) => {


  const file = req.file;
  const fileType = file.mimetype.startsWith("image") ? "image" : "video";

  const quizExited = await Quiz.findOne({ _id: req.body.quiz_id });

  /// if quiz exist
  if (quizExited === null) {
    return res
      .status(400)
      .json({ success: 0, message: "Invalid quiz id." });
  }

  // Upload to Cloudinary
  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: fileType },
      (error, result) => (error ? reject(error) : resolve(result))
    );

    uploadStream.end(req.file.buffer);
  });


  let quiz = await Quiz.findOneAndUpdate(
    { _id: req.body.quiz_id },
    {
      image: fileType === "image" ? result.secure_url : null,
      video: fileType === "video" ? result.secure_url : null
    },
    {
      runValidators: true
    }
  );
  return res
    .status(200)
    .json({ success: 1, data: quiz, message: "Quiz with image/video added successfully" });

});

////////////////////////////////////////
/////////// GET all Quiz 👤 ///////////
//////////////////////////////////////
exports.getAllQuiz = tryCatcheHanlder(async (req, res, next) => {
  const quiz = await Quiz.find().populate("quiz_category");

  // Shuffle questions for each quiz
  const shuffledQuiz = quiz.map(q => {
    const quizObj = q.toObject(); // Convert to plain object
    if (quizObj.questions && quizObj.questions.length > 0) {
      quizObj.questions = shuffleArray(quizObj.questions);
    }
    return quizObj;
  });

  return res
    .status(200)
    .json({ 
      success: 1, 
      data: shuffledQuiz, 
      total: shuffledQuiz.length, 
      message: "Get all quiz list." 
    });
});
////////////////////////////////////////
/////////// GET single Quiz 👤 ///////////
//////////////////////////////////////
exports.getSingleQuiz = tryCatcheHanlder(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id).populate("quiz_category");
  
  if (!quiz) {
    return res.status(404).json({ 
      success: 0, 
      message: "Quiz not found" 
    });
  }

  const quizObj = quiz.toObject();
  if (quizObj.questions && quizObj.questions.length > 0) {
    quizObj.questions = shuffleArray(quizObj.questions);
  }

  return res
    .status(200)
    .json({ 
      success: 1, 
      data: quizObj, 
      message: "Quiz retrieved successfully" 
    });
});

////////////////////////////////////////
/////////// GET all Quiz of Category 👤 ///////////
//////////////////////////////////////
exports.getAllCategoryQuiz = tryCatcheHanlder(async (req, res, next) => {
  const quizes = await Quiz.find({
    quiz_category: req.params.category_id
  }).populate("quiz_category");

  return res
    .status(200)
    .json({ success: 1, data: quizes, total: quizes.length, message: "Get all quiz of category." });
});

////////////////////////////////////////
/////////// REMOVE Quiz 👤 ///////////
//////////////////////////////////////
exports.romveQuiz = tryCatcheHanlder(async (req, res, next) => {
  const quiz = await Quiz.deleteOne({
    _id: req.params.id
  });

  return res
    .status(200)
    .json({ success: 1, message: "Quiz remove successfully." });
});



////////////////////////////////////////
/////////// Update Quiz 👤 ///////////
//////////////////////////////////////
exports.updateQuiz = tryCatcheHanlder(async (req, res, next) => {
  // Validate if the quiz exists first
  const quizExists = await Quiz.findById(req.params.id);
  
  // If quiz doesn't exist
  if (!quizExists) {
    return res
      .status(404)
      .json({ success: 0, message: "Quiz not found" });
  }

  // Check if updated title and category already exist for another quiz
  if (req.body.title && req.body.quiz_category) {
    const duplicateQuiz = await Quiz.findOne({
      $and: [
        { "title.value": req.body.title[0].value }, // Match the 'value' in the title array
        { quiz_category: req.body.quiz_category }, // Match the quiz_category
        { _id: { $ne: req.params.id } } // Exclude the current quiz
      ]
    });

    // If duplicate found
    if (duplicateQuiz) {
      return res
        .status(400)
        .json({ success: 0, message: "Quiz with this title and category already exists" });
    }
  }

  // Update the quiz
  const updatedQuiz = await Quiz.findByIdAndUpdate(
    req.params.id,
    req.body,
    { 
      new: true, // Return the updated document
      runValidators: true // Run model validators
    }
  ).populate("quiz_category");

  return res
    .status(200)
    .json({ 
      success: 1, 
      data: updatedQuiz, 
      message: "Quiz updated successfully" 
    });
});