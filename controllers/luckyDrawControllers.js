const { LuckyDraw } = require("../modal/LuckDraw");
const { UserProgression } = require("../modal/UserProgression");
const { Category } = require("../modal/Category");
const { Quiz } = require("../modal/Quiz");
const tryCatchHandler = require("../utils/tryCatch");
const cloudinary = require("cloudinary").v2;

// Admin: Create a new lucky draw for a category
exports.createLuckyDraw = tryCatchHandler(async (req, res) => {
  const { categoryId, name, description, scheduledDate, prizes } = req.body;


  const luckydrawName = await LuckyDraw.findOne({ name: name });
  if (luckydrawName  !== null) {
    return res.status(400).json({
      success: 0,
      message: "Lucky Draw with this name already exist"
    });
  }

  // Validate category exists
  const category = await Category.findOne({ _id: categoryId });
  if (!category) {
    return res.status(400).json({
      success: 0,
      message: "Category not found"
    });
  }

  const luckyDrawExisted = await LuckyDraw.findOne({ category: categoryId });

  if (luckyDrawExisted !== null) {
    if (luckyDrawExisted.status === "scheduled") {
      return res.status(400).json({
        success: 0,
        message: "Lucky Draw for this Category is already scheduled"
      });
    }
  }

  // Create new lucky draw
  const luckyDraw = new LuckyDraw({
    category: categoryId,
    name,
    description,
    scheduledDate: new Date(scheduledDate),
    prizes,
    eligibleUsers: [],
    winners: [],
    status: "scheduled"
  });

  await luckyDraw.save();

  // Find all eligible users for this category
  await updateEligibleUsers(luckyDraw._id, categoryId);

  return res.status(201).json({
    success: 1,
    message: "Lucky draw created successfully",
    data: luckyDraw
  });
});

//////////////////////////////////////////////
/////////// Add Image To Prize 👤 ///////////
////////////////////////////////////////////
exports.addImageToPrize = tryCatchHandler(async (req, res, next) => {
  const file = req.file;
  const fileType = file.mimetype.startsWith("image") ? "image" : "video";

  const luckydrawExited = await LuckyDraw.findOne({
    _id: req.body.luckydraw_id
  });

  /// if luckydrawExited exist
  if (luckydrawExited === null) {
    return res
      .status(400)
      .json({ success: 0, message: "Invalid luckydraw id." });
  }

  // Upload to Cloudinary
  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: fileType },
      (error, result) => (error ? reject(error) : resolve(result))
    );

    uploadStream.end(req.file.buffer);
  });

  let arr = luckydrawExited.prizes;
  arr[0].image = result.secure_url;

  await LuckyDraw.findOneAndUpdate(
    { _id: req.body.luckydraw_id },
    {
      prizes: arr
    },
    {
      runValidators: true
    }
  );
  return res.status(200).json({
    success: 1,
    message: "Image added in luckydraw successfully"
  });
});

// Admin: Get all lucky draws
exports.getAllLuckyDraws = tryCatchHandler(async (req, res) => {
  const luckyDraws = await LuckyDraw.find()
    .populate("category", "name")
    .populate("eligibleUsers", "first_name last_name email")
    .populate("winners.user", "first_name last_name email");

  return res.status(200).json({
    success: 1,
    message: "Lucky draws retrieved successfully",
    data: luckyDraws
  });
});

// Admin: Get lucky draw by ID
exports.getLuckyDrawById = tryCatchHandler(async (req, res) => {
  const { id } = req.params;

  const luckyDraw = await LuckyDraw.findById(id)
    .populate("category", "name")
    .populate("eligibleUsers", "first_name last_name email")
    .populate("winners.user", "first_name last_name email");

  if (!luckyDraw) {
    return res.status(404).json({
      success: 0,
      message: "Lucky draw not found"
    });
  }

  return res.status(200).json({
    success: 1,
    message: "Lucky draw retrieved successfully",
    data: luckyDraw
  });
});

// Admin: Update lucky draw
exports.updateLuckyDraw = tryCatchHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, scheduledDate, prizes, status } = req.body;

  const luckyDraw = await LuckyDraw.findById(id);
  if (!luckyDraw) {
    return res.status(404).json({
      success: 0,
      message: "Lucky draw not found"
    });
  }

  // Don't allow updating completed draws
  if (luckyDraw.status === "completed" && status !== "completed") {
    return res.status(400).json({
      success: 0,
      message: "Cannot update a completed lucky draw"
    });
  }

  // Update fields
  if (name) luckyDraw.name = name;
  if (description) luckyDraw.description = description;
  if (scheduledDate) luckyDraw.scheduledDate = new Date(scheduledDate);
  if (prizes) luckyDraw.prizes = prizes;
  if (status) luckyDraw.status = status;

  await luckyDraw.save();

  return res.status(200).json({
    success: 1,
    message: "Lucky draw updated successfully",
    data: luckyDraw
  });
});

// Admin: Execute lucky draw - select winners
// exports.executeLuckyDraw = tryCatchHandler(async (req, res) => {
//   const { id } = req.params;

//   const luckyDraw = await LuckyDraw.findById(id).populate(
//     "eligibleUsers",
//     "first_name last_name email"
//   );

//   if (!luckyDraw) {
//     return res.status(404).json({
//       success: 0,
//       message: "Lucky draw not found"
//     });
//   }

//   if (luckyDraw.status === "completed") {
//     return res.status(400).json({
//       success: 0,
//       message: "Lucky draw already completed"
//     });
//   }

//   if (luckyDraw.status === "cancelled") {
//     return res.status(400).json({
//       success: 0,
//       message: "Cannot execute a cancelled lucky draw"
//     });
//   }

//   if (luckyDraw.eligibleUsers.length === 0) {
//     return res.status(400).json({
//       success: 0,
//       message: "No eligible users for this lucky draw"
//     });
//   }

//   // Select winners for each prize
//   const winners = [];
//   const totalPrizes = luckyDraw.prizes.reduce(
//     (sum, prize) => sum + prize.quantity,
//     0
//   );

//   // Make sure we have enough eligible users
//   if (luckyDraw.eligibleUsers.length < totalPrizes) {
//     return res.status(400).json({
//       success: 0,
//       message: "Not enough eligible users for the number of prizes"
//     });
//   }

//   // Create a pool of eligible users (to avoid selecting the same user twice)
//   let userPool = [...luckyDraw.eligibleUsers];

//   // Select winners for each prize
//   for (const prize of luckyDraw.prizes) {
//     for (let i = 0; i < prize.quantity; i++) {
//       if (userPool.length === 0) break;

//       // Select a random user from the pool
//       const randomIndex = Math.floor(Math.random() * userPool.length);
//       const winningUser = userPool[randomIndex];

//       // Remove the user from the pool
//       userPool.splice(randomIndex, 1);

//       // Add to winners
//       winners.push({
//         user: winningUser._id,
//         prize: prize.name,
//         selectedAt: new Date()
//       });

//       // Update user progression to mark they won
//       await UserProgression.findOneAndUpdate(
//         { user_id: winningUser._id },
//         {
//           $push: {
//             luckyDrawParticipation: {
//               luckyDraw: luckyDraw._id,
//               category: luckyDraw.category,
//               eligible: true,
//               won: true,
//               prize: prize.name
//             }
//           },
//           $set: {
//             "categoryCompletions.$[elem].luckyDrawWon": true
//           }
//         },
//         {
//           arrayFilters: [{ "elem.category": luckyDraw.category }],
//           new: true
//         }
//       );

//       // Unlock the next category for this user
//       await unlockNextCategoryForUser(winningUser._id, luckyDraw.category);
//     }
//   }

//   // Update the lucky draw with winners
//   luckyDraw.winners = winners;
//   luckyDraw.status = "completed";
//   await luckyDraw.save();

//   // Update non-winning users
//   const winnerIds = winners.map((w) => w.user.toString());
//   for (const user of luckyDraw.eligibleUsers) {
//     if (!winnerIds.includes(user._id.toString())) {
//       await UserProgression.findOneAndUpdate(
//         { user_id: user._id },
//         {
//           $push: {
//             luckyDrawParticipation: {
//               luckyDraw: luckyDraw._id,
//               category: luckyDraw.category,
//               eligible: true,
//               won: false
//             }
//           }
//         }
//       );
//     }
//   }

//   return res.status(200).json({
//     success: 1,
//     message: "Lucky draw executed successfully",
//     data: {
//       winners: await LuckyDraw.findById(id)
//         .populate("winners.user", "first_name last_name email")
//         .then((draw) => draw.winners)
//     }
//   });
// });

exports.executeLuckyDraw = tryCatchHandler(async (req, res) => {
  const { id } = req.params;

  const luckyDraw = await LuckyDraw.findById(id).populate(
    "eligibleUsers",
    "first_name last_name email"
  );

   console.log(luckyDraw.eligibleUsers.length, "luckyDraw")

  if (!luckyDraw) {
    return res.status(404).json({
      success: 0,
      message: "Lucky draw not found"
    });
  }

  if (luckyDraw.status === "completed") {
    return res.status(400).json({
      success: 0,
      message: "Lucky draw already completed"
    });
  }

  if (luckyDraw.status === "cancelled") {
    return res.status(400).json({
      success: 0,
      message: "Cannot execute a cancelled lucky draw"
    });
  }

  if (luckyDraw.eligibleUsers.length === 0) {
    return res.status(400).json({
      success: 0,
      message: "No eligible users for this lucky draw"
    });
  }

  // Select winners for each prize
  const winners = [];
  const totalPrizes = luckyDraw.prizes.reduce(
    (sum, prize) => sum + prize.quantity,
    0
  );

  // Make sure we have enough eligible users
  if (luckyDraw.eligibleUsers.length < totalPrizes) {
    return res.status(400).json({
      success: 0,
      message: "Not enough eligible users for the number of prizes"
    });
  }

  // Create a pool of eligible users (to avoid selecting the same user twice)
  let userPool = [...luckyDraw.eligibleUsers];

  // Select winners for each prize
  for (const prize of luckyDraw.prizes) {
    for (let i = 0; i < prize.quantity; i++) {
      if (userPool.length === 0) break;

      // Select a random user from the pool
      const randomIndex = Math.floor(Math.random() * userPool.length);
      const winningUser = userPool[randomIndex];

      // Remove the user from the pool
      userPool.splice(randomIndex, 1);

      // Add to winners
      winners.push({
        user: winningUser._id,
        prize: prize.name,
        selectedAt: new Date()
      });

      // Update user progression to mark they won
      await UserProgression.findOneAndUpdate(
        {
          user_id: winningUser._id,
          "luckyDrawParticipation.luckyDraw": luckyDraw._id
        },
        {
          $set: {
            "luckyDrawParticipation.$.won": true,
            "luckyDrawParticipation.$.prize": prize.name,
            "categoryCompletions.$[elem].luckyDrawWon": true
          }
        },
        {
          arrayFilters: [{ "elem.category": luckyDraw.category }],
          new: true
        }
      );

      // Unlock the next category for this user
      await unlockNextCategoryForUser(winningUser._id, luckyDraw.category);
    }
  }

  // Update non-winning users
  const winnerIds = winners.map((w) => w.user.toString());

  const nextMonth = new Date();
  // Set to next month's 30th
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // Update the lucky draw with winners

  luckyDraw.winners = [...luckyDraw.winners, ...winners];
  luckyDraw.status = "scheduled";
  luckyDraw.scheduledDate = nextMonth;
  luckyDraw.eligibleUsers = luckyDraw.eligibleUsers.filter(
    (user) => !winnerIds.includes(user._id.toString())
  );
  await luckyDraw.save();

  for (const user of luckyDraw.eligibleUsers) {
    if (!winnerIds.includes(user._id.toString())) {
      await UserProgression.findOneAndUpdate(
        {
          user_id: user._id,
          "luckyDrawParticipation.luckyDraw": luckyDraw._id
        },
        {
          $set: {
            "luckyDrawParticipation.$.won": false
          }
        },
        {
          new: true
        }
      );
    }
  }

  return res.status(200).json({
    success: 1,
    message: "Lucky draw executed successfully",
    data: {
      winners: await LuckyDraw.findById(id)
        .populate("winners.user", "first_name last_name email")
        .then((draw) => draw.winners)
    }
  });
});

// User: Get their lucky draw participation history
exports.getUserLuckyDrawHistory = tryCatchHandler(async (req, res) => {
  const userId = req.user.user_id;

  const userProgression = await UserProgression.findOne({ user_id: userId })
    .populate({
      path: "luckyDrawParticipation.luckyDraw",
      select: "name description scheduledDate status"
    })
    .populate("luckyDrawParticipation.category", "name");

  if (!userProgression) {
    return res.status(404).json({
      success: 0,
      message: "User progression not found"
    });
  }

  return res.status(200).json({
    success: 1,
    message: "User lucky draw history retrieved successfully",
    data: userProgression.luckyDrawParticipation
  });
});

// User: Get upcoming lucky draws they are eligible for
exports.getUserUpcomingLuckyDraws = tryCatchHandler(async (req, res) => {
  const userId = req.user.user_id;

  const userProgression = await UserProgression.findOne({ user_id: userId });
  if (!userProgression) {
    return res.status(404).json({
      success: 0,
      message: "User progression not found"
    });
  }

  // Get the categories the user has completed with 100% in all quizzes
  const completedCategories = userProgression.categoryCompletions
    .filter((cc) => !cc.luckyDrawWon)
    .map((cc) => cc.category);

  // Find upcoming lucky draws for those categories
  const upcomingDraws = await LuckyDraw.find({
    category: { $in: completedCategories },
    status: "scheduled",
    scheduledDate: { $gte: new Date() }
  }).populate("category", "name");

  return res.status(200).json({
    success: 1,
    message: "Upcoming lucky draws retrieved successfully",
    data: upcomingDraws
  });
});

// Helper functions

// Update eligible users for a lucky draw
async function updateEligibleUsers(luckyDrawId, categoryId) {
  try {
    // Find all quizzes in this category
    const quizzesInCategory = await Quiz.find({ quiz_category: categoryId });
    const quizIds = quizzesInCategory.map((q) => q._id);

    if (quizIds.length === 0) {
      console.log("No quizzes found in this category");
      return;
    }

    // Find users who have completed all quizzes in this category with 100% score
    const userProgressions = await UserProgression.find({
      completedQuizzes: {
        $all: quizIds.map((id) => ({
          $elemMatch: {
            quiz_id: id,
            score: 100,
            completed: true
          }
        }))
      }
    });

    const eligibleUserIds = userProgressions.map((up) => up.user_id);

    // Update the lucky draw with eligible users
    await LuckyDraw.findByIdAndUpdate(luckyDrawId, {
      $set: { eligibleUsers: eligibleUserIds }
    });

    // Update user progression records
    for (const userProgressionDoc of userProgressions) {
      // Check if user already has this category in categoryCompletions
      const categoryCompletion = userProgressionDoc.categoryCompletions?.find(
        (cc) => cc.category.toString() === categoryId.toString()
      );

      if (!categoryCompletion) {
        // Add this category to completions
        await UserProgression.findByIdAndUpdate(userProgressionDoc._id, {
          $push: {
            categoryCompletions: {
              category: categoryId,
              completedAt: new Date(),
              luckyDrawParticipated: false,
              luckyDrawWon: false
            }
          }
        });
      }
    }

    return eligibleUserIds;
  } catch (error) {
    console.error("Error updating eligible users:", error);
    throw error;
  }
}

// Unlock the next category for a winning user
async function unlockNextCategoryForUser(userId, currentCategoryId) {
  try {
    // Get user progression
    const userProgression = await UserProgression.findOne({ user_id: userId });
    if (!userProgression) {
      console.error("User progression not found for user:", userId);
      return;
    }

    // Get current category
    const currentCategory = await Category.findById(currentCategoryId);
    if (!currentCategory) {
      console.error("Category not found:", currentCategoryId);
      return;
    }

    // Find next category by creation date
    const nextCategory = await Category.findOne({
      createdAt: { $gt: currentCategory.createdAt }
    }).sort({ createdAt: 1 });

    if (!nextCategory) {
      console.log("No next category found - user has completed all categories");
      return;
    }

    // Find first quiz in next category
    const firstQuizOfNextCategory = await Quiz.findOne({
      quiz_category: nextCategory._id
    }).sort({ createdAt: 1 });

    if (!firstQuizOfNextCategory) {
      console.log("No quizzes found in next category:", nextCategory._id);
      return;
    }

    // Update user progression to unlock next category and its first quiz
    if (!userProgression.unlockedCategories.includes(nextCategory._id)) {
      userProgression.unlockedCategories.push(nextCategory._id);
    }

    if (
      !userProgression.unlockedQuizzes.includes(firstQuizOfNextCategory._id)
    ) {
      userProgression.unlockedQuizzes.push(firstQuizOfNextCategory._id);
    }

    userProgression.currentCategory = nextCategory._id;
    userProgression.currentQuiz = firstQuizOfNextCategory._id;

    await userProgression.save();

    console.log(
      `Unlocked next category ${nextCategory._id} and quiz ${firstQuizOfNextCategory._id} for user ${userId}`
    );
    return true;
  } catch (error) {
    console.error("Error unlocking next category for user:", error);
    throw error;
  }
}

// Scheduled job to automatically execute lucky draws on scheduled date
exports.runScheduledLuckyDraws = async () => {
  try {
    // Find all scheduled lucky draws that are due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const scheduledDraws = await LuckyDraw.find({
      status: "scheduled",
      scheduledDate: {
        $gte: today,
        $lt: tomorrow
      }
    });

    console.log(
      `Found ${scheduledDraws.length} lucky draws scheduled for today`
    );

    for (const draw of scheduledDraws) {
      console.log(`Executing lucky draw: ${draw._id}`);

      // Update eligible users before executing
      await updateEligibleUsers(draw._id, draw.category);

      // Re-fetch the draw with updated eligible users
      const updatedDraw = await LuckyDraw.findById(draw._id).populate(
        "eligibleUsers"
      );

      // Execute draw logic (similar to executeLuckyDraw controller)
      if (updatedDraw.eligibleUsers.length === 0) {
        console.log(`No eligible users for lucky draw ${draw._id}`);
        continue;
      }

      // Select winners for each prize
      const winners = [];
      let userPool = [...updatedDraw.eligibleUsers];

      for (const prize of updatedDraw.prizes) {
        for (let i = 0; i < prize.quantity; i++) {
          if (userPool.length === 0) break;

          const randomIndex = Math.floor(Math.random() * userPool.length);
          const winningUser = userPool[randomIndex];

          userPool.splice(randomIndex, 1);

          winners.push({
            user: winningUser._id,
            prize: prize.name,
            selectedAt: new Date()
          });

          // Update user progression
          await UserProgression.findOneAndUpdate(
            { user_id: winningUser._id },
            {
              $push: {
                luckyDrawParticipation: {
                  luckyDraw: updatedDraw._id,
                  category: updatedDraw.category,
                  eligible: true,
                  won: true,
                  prize: prize.name
                }
              },
              $set: {
                "categoryCompletions.$[elem].luckyDrawWon": true
              }
            },
            {
              arrayFilters: [{ "elem.category": updatedDraw.category }],
              new: true
            }
          );

          // Unlock next category
          await unlockNextCategoryForUser(
            winningUser._id,
            updatedDraw.category
          );
        }
      }

      // Update the lucky draw
      updatedDraw.winners = winners;
      updatedDraw.status = "completed";
      await updatedDraw.save();

      // Update non-winners
      const winnerIds = winners.map((w) => w.user.toString());
      for (const user of updatedDraw.eligibleUsers) {
        if (!winnerIds.includes(user._id.toString())) {
          await UserProgression.findOneAndUpdate(
            { user_id: user._id },
            {
              $push: {
                luckyDrawParticipation: {
                  luckyDraw: updatedDraw._id,
                  category: updatedDraw.category,
                  eligible: true,
                  won: false
                }
              }
            }
          );
        }
      }

      console.log(
        `Completed lucky draw ${draw._id} with ${winners.length} winners`
      );
    }

    return {
      success: true,
      message: `Processed ${scheduledDraws.length} scheduled lucky draws`
    };
  } catch (error) {
    console.error("Error running scheduled lucky draws:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Get eligible users for a specific lucky draw
exports.getEligibleUsers = tryCatchHandler(async (req, res) => {
  const { id } = req.params;

  const luckyDraw = await LuckyDraw.findById(id).populate(
    "eligibleUsers",
    "first_name last_name email image"
  );

  if (!luckyDraw) {
    return res.status(404).json({
      success: 0,
      message: "Lucky draw not found"
    });
  }

  return res.status(200).json({
    success: 1,
    message: "Eligible users retrieved successfully",
    data: luckyDraw.eligibleUsers
  });
});

// Cancel a scheduled lucky draw
exports.cancelLuckyDraw = tryCatchHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const luckyDraw = await LuckyDraw.findById(id);
  if (!luckyDraw) {
    return res.status(404).json({
      success: 0,
      message: "Lucky draw not found"
    });
  }

  if (luckyDraw.status === "completed") {
    return res.status(400).json({
      success: 0,
      message: "Cannot cancel a completed lucky draw"
    });
  }

  if (luckyDraw.status === "cancelled") {
    return res.status(400).json({
      success: 0,
      message: "Lucky draw already cancelled"
    });
  }

  luckyDraw.status = "cancelled";
  luckyDraw.cancellationReason = reason || "Cancelled by administrator";
  await luckyDraw.save();

  return res.status(200).json({
    success: 1,
    message: "Lucky draw cancelled successfully",
    data: luckyDraw
  });
});


// Reschedule a lucky draw
exports.rescheduleLuckyDraw = tryCatchHandler(async (req, res) => {
  const { id } = req.params;
  const { newDate } = req.body;

  if (!newDate) {
    return res.status(400).json({
      success: 0,
      message: "New date is required"
    });
  }

  const luckyDraw = await LuckyDraw.findById(id);
  if (!luckyDraw) {
    return res.status(404).json({
      success: 0,
      message: "Lucky draw not found"
    });
  }

  if (luckyDraw.status === "completed") {
    return res.status(400).json({
      success: 0,
      message: "Cannot reschedule a completed lucky draw"
    });
  }

  if (luckyDraw.status === "cancelled") {
    return res.status(400).json({
      success: 0,
      message: "Cannot reschedule a cancelled lucky draw"
    });
  }

  const newScheduledDate = new Date(newDate);
  if (isNaN(newScheduledDate.getTime())) {
    return res.status(400).json({
      success: 0,
      message: "Invalid date format"
    });
  }

  luckyDraw.scheduledDate = newScheduledDate;
  await luckyDraw.save();

  return res.status(200).json({
    success: 1,
    message: "Lucky draw rescheduled successfully",
    data: luckyDraw
  });
});

// Get winners of a completed lucky draw
exports.getLuckyDrawWinners = tryCatchHandler(async (req, res) => {
  const { id } = req.params;

  const luckyDraw = await LuckyDraw.findById(id).populate(
    "winners.user",
    "first_name last_name email image"
  );

  if (!luckyDraw) {
    return res.status(404).json({
      success: 0,
      message: "Lucky draw not found"
    });
  }

  if (luckyDraw.status !== "completed") {
    return res.status(400).json({
      success: 0,
      message: "Lucky draw has not been completed yet"
    });
  }

  return res.status(200).json({
    success: 1,
    message: "Lucky draw winners retrieved successfully",
    data: {
      drawName: luckyDraw.name,
      drawDate: luckyDraw.scheduledDate,
      executionDate: luckyDraw.updatedAt,
      winners: luckyDraw.winners
    }
  });
});

// Get statistics for lucky draws
exports.getLuckyDrawStats = tryCatchHandler(async (req, res) => {
  const { year, month, categoryId } = req.query;
  const matchStage = {};

  // Build date filters
  if (year) {
    const yearInt = parseInt(year);
    if (month) {
      const monthInt = parseInt(month);
      matchStage.scheduledDate = {
        $gte: new Date(yearInt, monthInt - 1, 1),
        $lte: new Date(yearInt, monthInt, 0, 23, 59, 59, 999)
      };
    } else {
      matchStage.scheduledDate = {
        $gte: new Date(yearInt, 0, 1),
        $lte: new Date(yearInt, 11, 31, 23, 59, 59, 999)
      };
    }
  }

  // Filter by category if provided
  if (categoryId) {
    matchStage.category = new mongoose.Types.ObjectId(categoryId);
  }

  // Run aggregate stats in parallel
  const [totalDraws, completedDraws, cancelledDraws, scheduledDraws] =
    await Promise.all([
      LuckyDraw.countDocuments(matchStage),
      LuckyDraw.countDocuments({ ...matchStage, status: "completed" }),
      LuckyDraw.countDocuments({ ...matchStage, status: "cancelled" }),
      LuckyDraw.countDocuments({ ...matchStage, status: "scheduled" })
    ]);

  const winnersAggregation = await LuckyDraw.aggregate([
    { $match: { ...matchStage, status: "completed" } },
    { $project: { winnerCount: { $size: "$winners" } } },
    { $group: { _id: null, count: { $sum: "$winnerCount" } } }
  ]);

  const totalWinners =
    winnersAggregation.length > 0 ? winnersAggregation[0].count : 0;

  // Winners by category (only when categoryId is not provided)
  let winnersByCategory = [];
  if (!categoryId) {
    const categories = await Category.find();
    const drawsByCategory = await Promise.all(
      categories.map((category) =>
        LuckyDraw.find({
          ...matchStage,
          category: category._id,
          status: "completed"
        }).select("winners")
      )
    );

    winnersByCategory = categories.map((category, index) => {
      const draws = drawsByCategory[index];
      const winnersCount = draws.reduce(
        (sum, draw) => sum + (draw.winners?.length || 0),
        0
      );

      return {
        category: category.name || category._id,
        drawsCount: draws.length,
        winnersCount
      };
    });
  }

  // Monthly stats
  let monthlyStats = [];
  if (year) {
    const yearInt = parseInt(year);
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];

    for (let i = 0; i < 12; i++) {
      const startDate = new Date(yearInt, i, 1);
      const endDate = new Date(yearInt, i + 1, 0, 23, 59, 59, 999);

      const monthQuery = {
        scheduledDate: { $gte: startDate, $lte: endDate }
      };
      if (categoryId) {
        monthQuery.category = new mongoose.Types.ObjectId(categoryId);
      }

      const [drawsCount, completed, scheduled, cancelled, draws] =
        await Promise.all([
          LuckyDraw.countDocuments(monthQuery),
          LuckyDraw.countDocuments({ ...monthQuery, status: "completed" }),
          LuckyDraw.countDocuments({ ...monthQuery, status: "scheduled" }),
          LuckyDraw.countDocuments({ ...monthQuery, status: "cancelled" }),
          LuckyDraw.find({ ...monthQuery, status: "completed" }).select(
            "winners"
          )
        ]);

      const winnersCount = draws.reduce(
        (sum, draw) => sum + (draw.winners?.length || 0),
        0
      );

      monthlyStats.push({
        month: months[i],
        monthNumber: i + 1,
        drawsCount,
        completedDraws: completed,
        scheduledDraws: scheduled,
        cancelledDraws: cancelled,
        winnersCount
      });
    }
  }

  // Final response
  return res.status(200).json({
    success: 1,
    message: "Lucky draw statistics retrieved successfully",
    data: {
      total: {
        draws: totalDraws,
        completed: completedDraws,
        cancelled: cancelledDraws,
        scheduled: scheduledDraws,
        winners: totalWinners
      },
      winnersByCategory:
        winnersByCategory.length > 0 ? winnersByCategory : undefined,
      monthlyStats: monthlyStats.length > 0 ? monthlyStats : undefined
    }
  });
});

// Get detailed statistics for top winners
exports.getWinnerStatistics = tryCatchHandler(async (req, res) => {
  try {
    // Specify the number of top winners to retrieve (default: 3)
    const limit = parseInt(req.query.limit) || 3;
    console.log("WROLING===")
    // Get all completed lucky draws
    const completedDraws = await LuckyDraw.find({ status: "scheduled" })
      .populate('winners.user', 'first_name last_name email profileImage')
      .populate('category', 'name');
      
    // Calculate user win statistics
    const userWinStats = {};
    
    completedDraws.forEach(draw => {
      draw.winners.forEach(winner => {
        const userId = winner.user._id.toString();
        
        if (!userWinStats[userId]) {
          userWinStats[userId] = {
            user: {
              _id: winner.user._id,
              name: winner.user.first_name + " " + winner.user.last_name,
              email: winner.user.email,
              profileImage: winner.user.profileImage || null
            },
            totalWins: 0,
            categoriesWon: new Set(),
            prizes: [],
            firstWin: null,
            lastWin: null
          };
        }
        
        const stats = userWinStats[userId];
        stats.totalWins += 1;
        stats.categoriesWon.add(draw.category.name);
        
        const winData = {
          drawId: draw._id,
          drawName: draw.name,
          category: draw.category.name,
          prize: winner.prize,
          selectedAt: winner.selectedAt
        };
        
        stats.prizes.push(winData);
        
        // Track first and last win dates
        if (!stats.firstWin || winner.selectedAt < stats.firstWin) {
          stats.firstWin = winner.selectedAt;
        }
        
        if (!stats.lastWin || winner.selectedAt > stats.lastWin) {
          stats.lastWin = winner.selectedAt;
        }
      });
    });
    
    // Convert to array and prepare for output
    const winnersArray = Object.values(userWinStats).map(stats => ({
      user: stats.user,
      totalWins: stats.totalWins,
      uniqueCategories: Array.from(stats.categoriesWon),
      uniqueCategoryCount: stats.categoriesWon.size,
      prizes: stats.prizes.sort((a, b) => b.selectedAt - a.selectedAt),
      firstWin: stats.firstWin,
      lastWin: stats.lastWin,
      winningStreak: calculateWinningStreak(stats.prizes),
      averageTimeBetweenWins: calculateAverageTimeBetweenWins(stats.prizes)
    }));
    
    // Sort by total wins (descending)
    const sortedWinners = winnersArray.sort((a, b) => b.totalWins - a.totalWins);
    
    // Get top winners based on limit
    const topWinners = sortedWinners.slice(0, limit);
    
    // Calculate overall statistics
    const totalDrawsCompleted = completedDraws.length;
    const totalPrizesAwarded = completedDraws.reduce((sum, draw) => 
      sum + draw.winners.length, 0);
    
    return res.status(200).json({
      success: 1,
      message: "Winner statistics retrieved successfully",
      data: {
        topWinners,
        stats: {
          totalDrawsCompleted,
          totalPrizesAwarded,
          totalWinners: Object.keys(userWinStats).length,
          topWinner: topWinners.length > 0 ? {
            name: topWinners[0].user.name,
            wins: topWinners[0].totalWins
          } : null
        }
      }
    });
  } catch (error) {
    console.error("Error retrieving winner statistics:", error);
    return res.status(500).json({
      success: 0,
      message: "Error retrieving winner statistics",
      error: error.message
    });
  }
});

////// Helper function to calculate winning streak (consecutive wins)
function calculateWinningStreak(prizes) {
  if (prizes.length <= 1) return prizes.length;
  
  // Sort prizes by date
  const sortedPrizes = [...prizes].sort((a, b) => a.selectedAt - b.selectedAt);
  
  // Define what counts as a "streak" (e.g., wins within 30 days)
  const streakThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  
  let currentStreak = 1;
  let maxStreak = 1;
  
  for (let i = 1; i < sortedPrizes.length; i++) {
    const timeDiff = sortedPrizes[i].selectedAt - sortedPrizes[i-1].selectedAt;
    
    if (timeDiff <= streakThreshold) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  return maxStreak;
}

// Helper function to calculate average time between wins
function calculateAverageTimeBetweenWins(prizes) {
  if (prizes.length <= 1) return null;
  
  // Sort prizes by date
  const sortedPrizes = [...prizes].sort((a, b) => a.selectedAt - b.selectedAt);
  
  let totalTimeDiff = 0;
  
  for (let i = 1; i < sortedPrizes.length; i++) {
    const timeDiff = sortedPrizes[i].selectedAt - sortedPrizes[i-1].selectedAt;
    totalTimeDiff += timeDiff;
  }
  
  // Return average time difference in days
  return Math.round(totalTimeDiff / (sortedPrizes.length - 1) / (24 * 60 * 60 * 1000));
}

//////////////////////////////////////



////////////////////////////////////////
/////////// REMOVE Lucky Draw 👤 ///////////
//////////////////////////////////////
exports.removeLuckyDraw = tryCatchHandler(async (req, res, next) => {
  const result = await LuckyDraw.deleteOne({
    _id: req.params.id
  });

  return res
    .status(200)
    .json({ success: 1, message: "LuckDraw delete successfully." });
});

