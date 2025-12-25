const {UserProgression} = require('../modal/UserProgression');
const { Quiz } = require('../modal/Quiz');
const {Category} = require('../modal/Category');
const {LuckyDraw} = require('../modal/LuckDraw');

// Initialize user progression when user registers
exports.initializeUserProgression = async (req, res) => {
  try {

    const userId = req.user.user_id; // Assuming this comes from JWT auth middleware
    
    // Check if user already has progression
    const existingProgression = await UserProgression.findOne({ user_id: userId });
    if (existingProgression) {
      return res.status(400).json({ message: "User progression already initialized" });
    }
  
    // Find first category
    const firstCategory = await Category.findOne().sort({ createdAt: 1 });
    if (!firstCategory) {
      return res.status(404).json({ message: "No categories found" });
    }
    
  
    // Find first quiz in first category
    const firstQuiz = await Quiz.findOne({ quiz_category: firstCategory._id }).sort({ createdAt: 1 });
  
    if (!firstQuiz) {
      return res.status(404).json({ message: "No quizzes found in the first category" });
    }
    

    // Create user progression with first quiz unlocked
    const newProgression = new UserProgression({
      user_id: userId,
      unlockedCategories: [firstCategory._id],
      unlockedQuizzes: [firstQuiz._id],
      currentCategory: firstCategory._id,
      currentQuiz: firstQuiz._id,
      completedQuizzes: [],
      luckyDrawParticipation: [],
      categoryCompletions: []

    });
    
    await newProgression.save();
    
    
    return res.status(201).json({
      message: "User progression initialized successfully",
      progression: newProgression
    });
  } catch (error) {
    console.error("Error initializing user progression:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get available quizzes for a user
exports.getUserAvailableQuizzes = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const userProgression = await UserProgression.findOne({ user_id: userId })
      .populate('unlockedQuizzes')
      .populate('completedQuizzes.quiz_id')
      .populate('currentQuiz')
      .populate('currentCategory');
    
    if (!userProgression) {
      return res.status(400).json({ success: 0, message: "User progression not found" });
    }
    
    // Get all quizzes
    const allQuizzes = await Quiz.find()
      .populate('quiz_category');
    
    // Map quizzes with their status (locked, unlocked, completed)
    const quizzesWithStatus = allQuizzes.map(quiz => {
      const isUnlocked = userProgression.unlockedQuizzes.some(uq => uq._id.toString() === quiz._id.toString());
      const completedQuiz = userProgression.completedQuizzes.find(cq => cq.quiz_id._id.toString() === quiz._id.toString());
    

      return {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.quiz_category,
        questions: quiz.questions,
        status: completedQuiz?.completed ? 'completed' : isUnlocked ? 'unlocked' : 'locked',
        score: completedQuiz ? completedQuiz.score : null
      };
    });
    
    return res.status(200).json({
      currentCategory: userProgression.currentCategory,
      currentQuiz: userProgression.currentQuiz,
      quizzes: quizzesWithStatus
    });
  } catch (error) {
    console.error("Error getting user available quizzes:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a specific quiz only if unlocked
exports.getQuiz = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const quizId = req.params.quizId;
    
    // Check if the quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    // Check if the quiz is unlocked for the user
    const userProgression = await UserProgression.findOne({ user_id: userId });
    if (!userProgression) {
      return res.status(404).json({ message: "User progression not found" });
    }
    
    const isUnlocked = userProgression.unlockedQuizzes.some(
      uq => uq.toString() === quizId
    );
    
    if (!isUnlocked) {
      return res.status(403).json({ message: "This quiz is locked" });
    }
    
    // Don't send correct answers to front-end
    const quizWithoutAnswers = {
      _id: quiz._id,
      quiz_category: quiz.quiz_category,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions,
      image: quiz.image,
      video: quiz.video,
      questions: quiz.questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options
        // Removed correct_answer
      }))
    };
    
    return res.status(200).json(quizWithoutAnswers);
  } catch (error) {
    console.error("Error getting quiz:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Submit quiz answers and update progression
// exports.submitQuiz = async (req, res) => {
//   try {
//     const userId = req.user.user_id;
//     const quizId = req.params.quizId;
//     const { answers } = req.body; // Expected format: [{ questionId: '...', answerId: '...' }]
    
//     // Validate quiz exists
//     const quiz = await Quiz.findById(quizId);
//     if (!quiz) {
//       return res.status(200).json({ success: 0, message: "Quiz not found" });
//     }
    
//     // Check if user has access to this quiz
//     const userProgression = await UserProgression.findOne({ user_id: userId });
//     if (!userProgression) {
//       return resstatus(200).json({ success: 0, message: "User progression not found" });
//     }
    
//     const isUnlocked = userProgression.unlockedQuizzes.some(
//       uq => uq.toString() === quizId
//     );
    
//     if (!isUnlocked) {
//       return res.status(200).json({ success: 0, message: "This quiz is locked" });
//     }
    
//     // Check if already completed with 100%
//     const existingCompletion = userProgression.completedQuizzes.find(
//       cq => cq.quiz_id.toString() === quizId && cq.score === 100
//     );
    
//     if (existingCompletion) {
//       return res.status(200).json({ success: 0, message: "Quiz already completed with 100% score" });
//     }
    
//     // Calculate score
//     let correctAnswers = 0;
//     const totalQuestions = quiz.questions.length;
    
//     answers.forEach(answer => {
//       // console.log(answer, "item===")
//       // Find the question in the quiz
//       const question = quiz.questions.find(q => q._id.toString() === answer.questionId);
//       if (!question) return;
      
//       // Check if the answer is correct
//       const correctAnswer = question.correct_answer.find(
//         ca => ca.value.toString() === answer.answer
//       );
      
    
//       if (correctAnswer) {
//         correctAnswers++;
//       }
//     });
    
//     const score = Math.round((correctAnswers / totalQuestions) * 100);
//     const isPerfectScore = score === 100;
    
//     // Update user progression
//     const completedQuizIndex = userProgression.completedQuizzes.findIndex(
//       cq => cq.quiz_id.toString() === quizId
//     );
    
//     if (completedQuizIndex >= 0) {
//       // Update existing record
//       userProgression.completedQuizzes[completedQuizIndex].score = score;
//       userProgression.completedQuizzes[completedQuizIndex].completed = isPerfectScore;
//       if (isPerfectScore) {
//         userProgression.completedQuizzes[completedQuizIndex].completedAt = new Date();
//       }
//     } else {
//       // Add new completion record
//       userProgression.completedQuizzes.push({
//         quiz_id: quizId,
//         score: score,
//         completed: isPerfectScore,
//         completedAt: isPerfectScore ? new Date() : null
//       });
//     }
    
//     // If perfect score, unlock next quiz
//     if (isPerfectScore) {
//       await unlockNextQuiz(userProgression, quiz);
//     }

//     console.log(userProgression ,"userProgression")
    
//     await userProgression.save();
    
//     return res.status(200).json({
//       message: "Quiz submitted successfully",
//       score,
//       isPerfectScore,
//       correctAnswers,
//       totalQuestions
//     });
//   } catch (error) {
//     console.error("Error submitting quiz:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
exports.submitQuiz = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const quizId = req.params.quizId;
    const { answers } = req.body; // Expected format: [{ questionId: '...', answerId: '...' }]
    
    // Validate quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(200).json({ success: 0, message: "Quiz not found" });
    }
    
    // Check if user has access to this quiz
    const userProgression = await UserProgression.findOne({ user_id: userId });
    if (!userProgression) {
      return res.status(200).json({ success: 0, message: "User progression not found" });
    }
    
    const isUnlocked = userProgression.unlockedQuizzes.some(
      uq => uq.toString() === quizId
    );
    
    if (!isUnlocked) {
      return res.status(200).json({ success: 0, message: "This quiz is locked" });
    }
    
    // Check if already completed with 100%
    const existingCompletion = userProgression.completedQuizzes.find(
      cq => cq.quiz_id.toString() === quizId && cq.score === 100
    );
    
    if (existingCompletion) {
      return res.status(200).json({ success: 0, message: "Quiz already completed with 100% score" });
    }
    
    // Calculate score
    let correctAnswers = 0;
    const totalQuestions = quiz.questions.length;
    
    answers.forEach(answer => {
      // Find the question in the quiz
      const question = quiz.questions.find(q => q._id.toString() === answer.questionId);
      if (!question) return;
      
      // Check if the answer is correct
      const correctAnswer = question.correct_answer.find(
        ca => ca.value.toString() === answer.answer
      );
      
      if (correctAnswer) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const isPerfectScore = score === 100  ? true : false;

    
    // Update user progression
    const completedQuizIndex = userProgression.completedQuizzes.findIndex(
      cq => cq.quiz_id.toString() === quizId
    );
    
    if (completedQuizIndex >= 0) {
      // Update existing record
      userProgression.completedQuizzes[completedQuizIndex].score = score;
      userProgression.completedQuizzes[completedQuizIndex].completed = isPerfectScore;
      if (isPerfectScore) {
        userProgression.completedQuizzes[completedQuizIndex].completedAt = new Date();
      }
    } else {
      // Add new completion record
      userProgression.completedQuizzes.push({
        quiz_id: quizId,
        score: score,
        completed: isPerfectScore,
        completedAt: isPerfectScore ? new Date() : null
      });
    }
    
    // If perfect score, check if all quizzes in the category are completed with 100%
    let allCategoryQuizzesCompleted = false;
    let categoryId = null;
    
    if (isPerfectScore) {
      categoryId = quiz.quiz_category;
      
      // Get all quizzes in this category
      const quizzesInCategory = await Quiz.find({ quiz_category: categoryId });
      const quizIdsInCategory = quizzesInCategory.map(q => q._id.toString());
      
      // Check if user has completed all quizzes in this category with 100%
      allCategoryQuizzesCompleted = quizIdsInCategory.every(qId => {
        const completion = userProgression.completedQuizzes.find(
          cq => cq.quiz_id.toString() === qId
        );
        return completion && completion.score === 100 && completion.completed;
      });
      
      // If all quizzes in category are NOT completed with 100%, unlock next quiz in SAME category
      if (!allCategoryQuizzesCompleted) {
        // Find next quiz in same category
        const quizzesInSameCategory = await Quiz.find({ 
          quiz_category: categoryId 
        }).sort({ order: 1 });
        
        // Find current quiz's index
        const currentQuizIndex = quizzesInSameCategory.findIndex(
          q => q._id.toString() === quizId
        );
        
        // If there is a next quiz in this category
        if (currentQuizIndex >= 0 && currentQuizIndex < quizzesInSameCategory.length - 1) {
          const nextQuiz = quizzesInSameCategory[currentQuizIndex + 1];
          
          // Check if it's not already unlocked
          const isNextQuizUnlocked = userProgression.unlockedQuizzes.some(
            uq => uq.toString() === nextQuiz._id.toString()
          );
          
          if (!isNextQuizUnlocked) {
            userProgression.unlockedQuizzes.push(nextQuiz._id);
            userProgression.currentQuiz = nextQuiz._id;
          }
        }
      } 
      // If all quizzes in category completed with 100%
      else {
        // Check if user already has this category in categoryCompletions
        const existingCategoryCompletion = userProgression.categoryCompletions?.find(
          cc => cc.category.toString() === categoryId.toString()
        );
        
        if (!existingCategoryCompletion) {
          // Add this category to completions
          if (!userProgression.categoryCompletions) {
            userProgression.categoryCompletions = [];
          }
          
          userProgression.categoryCompletions.push({
            category: categoryId,
            completedAt: new Date(),
            luckyDrawParticipated: false,
            luckyDrawWon: false
          });
          
          // Find upcoming lucky draws for this category
          const upcomingLuckyDraw = await LuckyDraw.findOne({
            category: categoryId,
            status: "scheduled",
            scheduledDate: { $gte: new Date() }
          });
          
          // Add user to eligible users for upcoming lucky draws
          if (upcomingLuckyDraw) {
            // Check if user ID is already in eligibleUsers array
            const userIdStr = userId.toString();
            const isUserEligible = upcomingLuckyDraw.eligibleUsers.some(
              eligibleId => eligibleId.toString() === userIdStr
            );
            
            if (!isUserEligible) {
              upcomingLuckyDraw.eligibleUsers.push(userId);
              await upcomingLuckyDraw.save();
              
              // Update luckyDrawParticipation in UserProgression
              userProgression.luckyDrawParticipation.push({
                luckyDraw: upcomingLuckyDraw._id,
                category: categoryId,
                eligible: true,
                won: false,
                prize: null
              });
            }
          }
        }
        
        // Note: We don't unlock next category here
        // Next category is unlocked only when user wins a prize in the lucky draw
        // That should be handled in the lucky draw controller
      }
    }
    
    await userProgression.save();
    
    // Prepare response data
    const responseData = {
      message: "Quiz submitted successfully",
      score,
      isPerfectScore,
      correctAnswers,
      totalQuestions
    };
    
    // Add lucky draw information if all category quizzes completed
    if (allCategoryQuizzesCompleted && categoryId) {
      const upcomingLuckyDraw = await LuckyDraw.findOne({
        category: categoryId,
        status: "scheduled",
        scheduledDate: { $gte: new Date() }
      });
      
      if (upcomingLuckyDraw) {
        responseData.luckyDraw = {
          message: "Congratulations! You've completed all quizzes in this category with 100% score and are eligible for the upcoming lucky draw!",
          drawName: upcomingLuckyDraw.name,
          drawDate: upcomingLuckyDraw.scheduledDate
        };
      } else {
        responseData.luckyDraw = {
          message: "Congratulations! You've completed all quizzes in this category with 100% score! You'll be eligible for the next lucky draw when it's scheduled."
        };
      }
    }
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to unlock the next quiz
async function unlockNextQuiz(userProgression, currentQuiz) {
  try {
    const currentCategoryId = currentQuiz.quiz_category;
    
    // Find next quiz in current category
    const nextQuiz = await Quiz.findOne({
      quiz_category: currentCategoryId,
      _id: { $gt: currentQuiz._id }
    }).sort({ _id: 1 });
    
    if (nextQuiz) {
      console.log(nextQuiz, "nextQuiz======");
      // Unlock next quiz in same category
      if (!userProgression.unlockedQuizzes.includes(nextQuiz._id)) {
        userProgression.unlockedQuizzes.push(nextQuiz._id);
      }
      userProgression.currentQuiz = nextQuiz._id;
    } else {
      // User completed all quizzes in the current category
      // Now we need to find the next category with at least one quiz
      
      // Get current category
      const currentCategory = await Category.findById(currentCategoryId);
      
      // Find all categories created after the current one
      const laterCategories = await Category.find({
        createdAt: { $gt: currentCategory.createdAt }
      }).sort({ createdAt: 1 });
      
      console.log(`Found ${laterCategories.length} categories after the current one`);
      
      // Look through each category until we find one with quizzes
      let foundNextQuiz = false;
      
      for (const nextCategory of laterCategories) {
        // Check if this category has any quizzes
        const firstQuizOfNextCategory = await Quiz.findOne({
          quiz_category: nextCategory._id
        }).sort({ createdAt: 1 });
        
        console.log(
          nextCategory.name || nextCategory._id, 
          firstQuizOfNextCategory ? "has quizzes" : "has no quizzes"
        );
        
        if (firstQuizOfNextCategory) {
          // We found a category with quizzes!
          console.log("Found next quiz in category:", nextCategory._id);
          
          if (!userProgression.unlockedCategories.includes(nextCategory._id)) {
            userProgression.unlockedCategories.push(nextCategory._id);
          }
          
          if (!userProgression.unlockedQuizzes.includes(firstQuizOfNextCategory._id)) {
            userProgression.unlockedQuizzes.push(firstQuizOfNextCategory._id);
          }
          
          userProgression.currentCategory = nextCategory._id;
          userProgression.currentQuiz = firstQuizOfNextCategory._id;
          foundNextQuiz = true;
          break; // Exit the loop since we found a quiz
        }
      }
      
      if (!foundNextQuiz) {
        console.log("No more quizzes found in any category");
        // User has completed all quizzes in all categories
        userProgression.currentQuiz = null;
      }
    }
  } catch (error) {
    console.error("Error unlocking next quiz:", error);
    throw error;
  }
}

// Reset user progress (for testing)
exports.resetUserProgress = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    // Delete existing progression
    await UserProgression.findOneAndDelete({ user_id: userId });
    
    // Reinitialize user progression
    await this.initializeUserProgression(req, res);
  } catch (error) {
    console.error("Error resetting user progress:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

