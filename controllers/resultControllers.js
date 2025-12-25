const { Result } = require("../modal/Result");
const { Quiz } = require("../modal/Quiz");
const { Language } = require("../modal/Language");
const tryCatcheHanlder = require("../utils/tryCatch");

////////////////////////////////////////
/////////// Create Result 👤 ///////////
//////////////////////////////////////

exports.createResult = tryCatcheHanlder(async (req, res, next) => {
  const { quiz_id, language_id, questions } = req.body;

  // Fetch the quiz
  const quiz = await Quiz.findById(quiz_id);
  if (!quiz) {
    return res.status(404).json({ success: 0, message: "Quiz not found" });
  }

  console.log(req.body);

  // Process questions
  const questionArr = questions.map((q, index) => {
    // Find the correct answer for this question with matching language_id
    const correctAnswerObj = quiz.questions[index].correct_answer.find(
      item => item.language_id.toString() === language_id.toString()
    );
    
    // Get correct answer value if found
    const correctAnswer = correctAnswerObj ? correctAnswerObj.value : "";
    
    // Get user's answer for this language
    const userAnswerObj = q.user_answer.find(
      ans => ans.language_id.toString() === language_id.toString()
    );
    
    const userAnswer = userAnswerObj ? userAnswerObj.value : "";
    
    // Compare user answer with correct answer
    const isCorrect = userAnswer === correctAnswer;

    return {
      question: q.question.map(ques => ({
        language_id: ques.language_id,
        value: ques.value
      })),
      user_answer: q.user_answer.map(ans => ({
        language_id: ans.language_id,
        value: ans.value || "" // Ensure it doesn't become undefined
      })),
      is_correct: isCorrect
    };
  });

  console.log(questionArr, "questionArr=====");
  
  // Determine pass/fail status
  const correctCount = questionArr.filter(q => q.is_correct).length;
   
  const result_status = (correctCount / questionArr.length) * 100 >= 60 ? "Pass" : "Fail";

  // Create result entry
  const result = await Result.create({
    quiz_id,
    user_id: req.user.user_id,
    questions: questionArr,
    result_status,
    result_percentage:  (correctCount / questionArr.length) * 100
  });

  return res.status(200).json({
    success: 1,
    data: result,
    correctCount: correctCount,
    wrongCount: questionArr.filter(q => q.is_correct === false).length,
    percentage: (correctCount / questionArr.length) * 100    + "%",
    message: "Result added successfully"
  });
});



////////////////////////////////////////
/////////// GET all Result 👤 ///////////
//////////////////////////////////////
exports.getAllResult = tryCatcheHanlder(async (req, res, next) => {
  const result = await Result.find();

  return res
    .status(200)
    .json({ success: 1, data: result, message: "Get all result list." });
});

////////////////////////////////////////
/////////// GET single Result 👤 ///////////
//////////////////////////////////////
exports.getSingleResult = tryCatcheHanlder(async (req, res, next) => {
  const result = await Result.findOne({
    _id: req.params.id
  });

  return res.status(200).json({
    success: 1,
    data: result,
    message: "Get result data successfully."
  });
});

////////////////////////////////////////
/////////// GET all Result of USER 👤 ///////////
//////////////////////////////////////
// exports.getUserResult = tryCatcheHanlder(async (req, res, next) => {
//    console.log( "req user=========")
    
//   // const result = await Result.find({
//   //   user_id: req.user.user_id
//   // });

//   return res.status(200).json({
//     success: 1,
//     // data: result,
//     message: "Get all result list of user."
//   });
// });

exports.getUserResults = tryCatcheHanlder(async (req, res, next) => {
   console.log("req user=========", req.user)
    
  const result = await Result.find({
    user_id: req.user.user_id
  });

  return res.status(200).json({
    success: 1,
    data: result,
    message: "Get all result list of user."
  });
});

////////////////////////////////////////
/////////// REMOVE Result 👤 ///////////
//////////////////////////////////////
exports.removeResult = tryCatcheHanlder(async (req, res, next) => {
  const result = await Result.deleteOne({
    _id: req.params.id
  });

  return res
    .status(200)
    .json({ success: 1, message: "Result remove successfully." });
});


