const { Category, validate } = require("../modal/Category");
const tryCatcheHanlder = require("../utils/tryCatch");
const cloudinary = require("cloudinary").v2;
const {UserProgression} = require('../modal/UserProgression');
const {Quiz} = require('../modal/Quiz');

////////////////////////////////////////
/////////// Create Category 👤 ///////////
//////////////////////////////////////
exports.createCategory = tryCatcheHanlder(async (req, res, next) => {
  // Check if file exists first
  if (!req.file) {
    return res.status(400).json({
      success: 0,
      message: "No image file uploaded"
    });
  }

  const { error } = validate(req.body);

  if (error) {
    return res.status(400).json({
      message: "Invalid data",
      error: error
    });
  }

  const parsedBody = JSON.parse(JSON.stringify(req.body));

  const categoryExited = await Category.findOne({
    "name.value": parsedBody.name[0].value
  });

  /// if category exist
  if (categoryExited) {
    return res
      .status(400)
      .json({ success: 0, message: "Category already existed." });
  }

  // Upload to Cloudinary
  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => (error ? reject(error) : resolve(result))
    );

    uploadStream.end(req.file.buffer);
  });

  // if user new then save it to database

  const category = await Category.create({
    name: parsedBody.name,
    description: parsedBody.description,
    image: result.secure_url
  });

  return res.status(200).json({
    success: 1,
    data: category,
    message: "Category is added successfully"
  });
});

////////////////////////////////////////
/////////// GET all Category 👤 ///////////
//////////////////////////////////////
exports.getAllCategory = tryCatcheHanlder(async (req, res, next) => {
  const category = await Category.find();

  return res.status(200).json({
    success: 1,
    data: category,
    total: category.length,
    message: "Get all category list."
  });
});

////////////////////////////////////////
/////////// GET single Category 👤 ///////////
//////////////////////////////////////
exports.getSingleCategory = tryCatcheHanlder(async (req, res, next) => {
  const category = await Category.findOne({
    _id: req.params.id
  });

  return res
    .status(200)
    .json({ success: 1, data: category, message: "Get all catagory list." });
});

////////////////////////////////////////
/////////// REMOVE Category 👤 ///////////
//////////////////////////////////////
exports.removeCategory = tryCatcheHanlder(async (req, res, next) => {
  const category = await Category.deleteOne({
    _id: req.params.id
  });

  return res
    .status(200)
    .json({ success: 1, message: "Category removed successfully." });
});

////////////////////////////////////////
/////////// Update Category 👤 ///////////
//////////////////////////////////////
exports.updateCategory = tryCatcheHanlder(async (req, res, next) => {
  // Check if file exists first
  if (!req.file) {
    const parsedBody = JSON.parse(JSON.stringify(req.body));

    await Category.findOneAndUpdate(
      { _id: req.params.id },
      { name: parsedBody.name, description: parsedBody.description },
      {
        runValidators: true
      }
    );

    return res.status(200).json({
      success: 1,
      message: "Category is updated successfully"
    });
  } else {
    const parsedBody = JSON.parse(JSON.stringify(req.body));

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "auto" },
        (error, result) => (error ? reject(error) : resolve(result))
      );

      uploadStream.end(req.file.buffer);
    });

    await Category.findOneAndUpdate(
      { _id: req.params.id },
      {
        name: parsedBody.name,
        description: parsedBody.description,
        image: result.secure_url
      },
      {
        runValidators: true
      }
    );

    return res.status(200).json({
      success: 1,
      message: "Category is updated successfully"
    });
  }
});




////////////////////////////////////////
// Get available categories for a user
////////////////////////////////////////
exports.getUserAvailableCategories = async (req, res) => {
  try {
    const userId = req.user.user_id; // Make sure this matches your JWT middleware
    
    // Find user progression
    const userProgression = await UserProgression.findOne({ user_id: userId })
      .populate('unlockedCategories')
      .populate('currentCategory');
    
    if (!userProgression) {
      return res.status(404).json({ message: "User progression not found" });
    }
    
    // Get all categories
    const allCategories = await Category.find().sort({ createdAt: 1 });
    
    // Map categories with their status (locked, unlocked)
    const categoriesWithStatus = allCategories.map(category => {
      // Check if category is unlocked
      const isUnlocked = userProgression.unlockedCategories.some(
        uc => uc._id.toString() === category._id.toString()
      );
      
      // Check if all quizzes in this category are completed
      const isCompleted = async () => {
        // Get all quizzes for this category
        const categoryQuizzes = await Quiz.find({ quiz_category: category._id });
        
        // If no quizzes in category, it's not completed
        if (categoryQuizzes.length === 0) return false;
        
        // Check if all quizzes are completed with perfect score
        const completedQuizIds = userProgression.completedQuizzes
          .filter(cq => cq.score === 100)
          .map(cq => cq.quiz_id.toString());
        
        return categoryQuizzes.every(quiz => 
          completedQuizIds.includes(quiz._id.toString())
        );
      };
      
      // Get the first quiz in this category 
      const getFirstQuizInCategory = async () => {
        const firstQuiz = await Quiz.findOne({ quiz_category: category._id })
          .sort({ createdAt: 1 })
          .select('_id title');
        return firstQuiz;
      };
      
      return {
        _id: category._id,
        name: category.name,
        description: category.description,
        image: category.image,
        status: isUnlocked ? 'unlocked' : 'locked',
        isCompleted: isCompleted(),
        firstQuiz: getFirstQuizInCategory(),
        isCurrent: userProgression.currentCategory && 
                   userProgression.currentCategory._id.toString() === category._id.toString()
      };
    });
    
    // Resolve all promises in the category data
    const resolvedCategories = await Promise.all(
      categoriesWithStatus.map(async (category) => {
        return {
          ...category,
          isCompleted: await category.isCompleted,
          firstQuiz: await category.firstQuiz
        };
      })
    );
    
    return res.status(200).json({
      currentCategory: userProgression.currentCategory,
      categories: resolvedCategories
    });
  } catch (error) {
    console.error("Error getting user available categories:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


////////////////////////////////////////
// Get quizzes by category for a user
////////////////////////////////////////
exports.getQuizzesByCategory = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const categoryId = req.params.categoryId;
    
    // Find user progression
    const userProgression = await UserProgression.findOne({ user_id: userId });
    
    if (!userProgression) {
      return res.status(404).json({ message: "User progression not found" });
    }
    
    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    // Check if category is unlocked for the user
    const isCategoryUnlocked = userProgression.unlockedCategories.some(
      uc => uc.toString() === categoryId
    );
    
    if (!isCategoryUnlocked) {
      return res.status(403).json({ 
        message: "This category is locked",
        status: "locked",
        category
      });
    }
    
    // Get all quizzes for this category
    const quizzes = await Quiz.find({ quiz_category: categoryId })
      .sort({ createdAt: 1 });
    
    // Map quizzes with their status
    const quizzesWithStatus = quizzes.map(quiz => {
      const isUnlocked = userProgression.unlockedQuizzes.some(
        uq => uq.toString() === quiz._id.toString()
      );
      
      const completedQuiz = userProgression.completedQuizzes.find(
        cq => cq.quiz_id.toString() === quiz._id.toString()
      );
      
      return {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        image: quiz.image,
        video: quiz.video,
        status: completedQuiz ? 'completed' : isUnlocked ? 'unlocked' : 'locked',
        score: completedQuiz ? completedQuiz.score : null,
        isCurrent: userProgression.currentQuiz && 
                  userProgression.currentQuiz.toString() === quiz._id.toString()
      };
    });
    
    return res.status(200).json({
      category,
      quizzes: quizzesWithStatus,
      status: "unlocked"
    });
  } catch (error) {
    console.error("Error getting quizzes by category:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};