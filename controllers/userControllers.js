const { User, validate } = require("../modal/User");
const jwt = require("jsonwebtoken");
const tryCatcheHanlder = require("../utils/tryCatch");
const bcrypt = require("bcryptjs");
const { emailVerification } = require("../utils/email");
const { generateCode } = require("../utils/generator-code");
const cloudinary = require("cloudinary").v2;
const { initializeUserProgression } = require("./userProgressionControllers");




const createSendToken = (user, res) => {
  const token = jwt.sign(
    { user_id: user._id, email: user.email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  );
  return res.status(200).json({
    success: true,
    message: "Logined successfully",
    token: {
      token,
      _id: user._id,
      email: user.email,
      username: user.first_name + " " + user.last_name,
      image: user.image,
      role: user.role
    }
  });
};

////////////////////////////////////////
////// SING UP / REGISTER USER 👤 /////
//////////////////////////////////////
exports.signupUser = tryCatcheHanlder(async (req, res, next) => {
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

  const userIsRegistered = await User.findOne({
    email: req.body.email.toLowerCase()
  });

  /// if user exist
  if (userIsRegistered) {
    return res.status(400).json({
      message: "User already exist",
      success: 0
    });
  }

  // Upload to Cloudinary
  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => (error ? reject(error) : resolve(result))
    );

    uploadStream.end(req.file.buffer);
  });

  let bcryptPassword = await bcrypt.hash(req.body.password, 12);

  // if user new then save it to database and allow him to login
  const user = await User.create({
    ...req.body,
    email: req.body.email.toLowerCase(),
    password: bcryptPassword,
    image: result.secure_url
  });

  // Initialize user progression (simulate request with user)
  const progressionReq = { user: { user_id: user._id } };
  const progressionRes = {
    status: function(code) {
      return this;
    },
    json: function(data) {
      return data;
    }
  };
  
  await initializeUserProgression(progressionReq, progressionRes);


  return res.status(200).json({
    message: "User registered successfully",
    success: 1,
    data: user
  });
});

////////////////////////////////////////
////// SING IN / LOGIN USER 👤 ////////
//////////////////////////////////////
exports.signinUser = tryCatcheHanlder(async (req, res, next) => {
  const userData = await User.findOne({
    email: req.body.email.toLowerCase()
  });

  /// if user not exist
  if (!userData) {
    return res.status(400).json({
      message: "User does not exist",
      success: 0
    });
  }

  if (userData.status !== "active") {
    return res.status(400).json({
      message: "Your account is deleted or deactivate. Please contact support",
      success: 0
    });
  }

  let correctPassword = await bcrypt.compare(
    req.body.password,
    userData.password
  );

  if (correctPassword) {
    return createSendToken(userData, res);
  } else {
    return res.status(400).json({
      message: "Email and password are invalid",
      success: 0
    });
  }
});

////////////////////////////////////////
////// GET ALL USER LIST 👤 ///////////
//////////////////////////////////////
exports.allUser = tryCatcheHanlder(async (req, res, next) => {
  const userData = await User.find({
    status: "active"
  });

  return res.status(200).json({
    message: "User list get successfully",
    success: 1,
    data: userData
  });
});

////////////////////////////////////////
////// GET SINGLE USER 👤 /////////////
//////////////////////////////////////
exports.signleUser = tryCatcheHanlder(async (req, res, next) => {
  const userData = await User.findOne({
    _id: req.params.id
  }).select("-password");

  return res.status(200).json({
    message: "User get successfully",
    success: 1,
    data: userData
  });
});

///////////////////////////////////////
////// REMOVE SINGLE USER 👤 /////////
/////////////////////////////////////
exports.removeUser = tryCatcheHanlder(async (req, res, next) => {
  await User.findOneAndUpdate(
    { _id: req.params.id },
    { status: "inactive" },
    {
      runValidators: true
    }
  );

  return res.status(200).json({
    message: "User removed successfully",
    success: 1
  });
});

////////////////////////////////////////
/////////// Update User 👤 ///////////
//////////////////////////////////////
exports.updateUser = tryCatcheHanlder(async (req, res, next) => {
  // Check if file exists first
  if (!req.file) {
    await User.findOneAndUpdate({ _id: req.params.id }, req.body, {
      runValidators: true
    });

    return res.status(200).json({
      success: 1,
      message: "User info updated successfully"
    });
  } else {
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "auto" },
        (error, result) => (error ? reject(error) : resolve(result))
      );

      uploadStream.end(req.file.buffer);
    });

    await User.findOneAndUpdate(
      { _id: req.params.id },
      {
        ...req.body,
        image: result.secure_url
      },
      {
        runValidators: true
      }
    );

    return res.status(200).json({
      success: 1,
      message: "User info updated successfully"
    });
  }
});

////////////////////////////////////////
/////////// FORGOT PASSWORD 👤 ///////////
//////////////////////////////////////
exports.forgotPassword = tryCatcheHanlder(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: 0,
      message: "Email is required"
    });
  }
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(400).json({
      success: 0,
      message: "Your account is inactive. Please contact to support"
    });
  }
  return emailVerification({
    res,
    verification_code: generateCode(),
    user
  });
});

////////////////////////////////////////
///////////   VERIFY CODE 👤 ///////////
//////////////////////////////////////
exports.verifyCode = tryCatcheHanlder(async (req, res, next) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({
      success: 0,
      message: "Email is required"
    });
  }
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(400).json({
      success: 0,
      message: "Your account is inactive. Please contact to support"
    });
  }
  if (user.verification_code !== +code) {
    return res.status(400).json({
      success: 0,
      message: "Invalid Code."
    });
  }
  return res.status(200).json({
    success: 1,
    message: "OTP code successfully verified"
  });
});

////////////////////////////////////////
/////////// Update User Password 👤 ///////////
//////////////////////////////////////
exports.updateUserPassword = tryCatcheHanlder(async (req, res, next) => {
  // Check if user exists first

  const user = await User.findOne({ email: req.body.email.toLowerCase() });

  if (!user) {
    return res.status(400).json({
      success: 0,
      message: "Cannot find the user."
    });
  }

  let bcryptPassword = await bcrypt.hash(req.body.new_password, 12);

  await User.findOneAndUpdate(
    { email: req.body.email },
    {
      password: bcryptPassword
    },
    {
      runValidators: true
    }
  );

  return res.status(200).json({
    success: 1,
    message: "User password updated successfully"
  });


});


/////////////////////////////////////////////////////
/////////// GET STAT BY MONTH OF USER 👤 ///////////
///////////////////////////////////////////////////
exports.getStatByMonthUser = tryCatcheHanlder(async (req, res, next) => {
  try {
    // Get the current year or use the provided year from query params
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    
    // Aggregate users by month for the specified year
    const monthlyStats = await User.aggregate([
      {
        $match: {
          // Filter users created in the specified year
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Create an array of all months with their respective user counts
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const result = Array.from({ length: 12 }, (_, i) => {
      const monthData = monthlyStats.find(stat => stat._id === i + 1);
      return {
        month: months[i],
        monthNumber: i + 1,
        count: monthData ? monthData.count : 0
      };
    });
    
    return res.status(200).json({
      success: 1,
      data: result,
      message: "Monthly user statistics retrieved successfully"
    });
    
  } catch (error) {
    return res.status(500).json({
      success: 0,
      message: "Error retrieving monthly statistics",
      error: error.message
    });
  }
});