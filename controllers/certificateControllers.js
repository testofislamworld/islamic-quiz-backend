const { Certificate } = require("../modal/Certificate");
const { Quiz } = require("../modal/Quiz");
const tryCatchHandler = require("../utils/tryCatch");

////////////////////////////////////////
/////////// Create Certificate 👤 ///////////
//////////////////////////////////////
exports.createCertificate = tryCatchHandler(async (req, res) => {
  const existingCertificate = await Certificate.findOne({ $and: [ { user_id: req.user.user_id }, { quiz_id: req.body.quiz }] });

  if (existingCertificate) {
    return res.status(400).json({
      success: 0,
      message: "You have already got certificate for this quiz.",
    });
  }

  const getQuiz = await Quiz.findOne({ _id: req.body.quiz });

  // Generate certificate ID
  const currentYear = new Date().getFullYear();
  
  // Find the latest certificate for the current year
  const latestCertificate = await Certificate.findOne(
    { certificate_id: { $regex: `CERT-${currentYear}-` } },
    {},
    { sort: { certificate_id: -1 } }
  );
  
  let nextNumber = 1;
  
  if (latestCertificate) {
    // Extract the number part from the latest certificate
    const parts = latestCertificate.certificate_id.split('-');
    const lastNumberStr = parts[2];
    const lastNumber = parseInt(lastNumberStr);
    
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }
  
  // Format the certificate ID with padding zeros (e.g., 001, 010, 100)
  const paddedNumber = String(nextNumber).padStart(3, '0');
  const certificateId = `CERT-${currentYear}-${paddedNumber}`;

  const certificate = await Certificate.create({
    user_id: req.user.user_id,
    quiz_category: getQuiz.quiz_category,
    quiz_id: getQuiz._id,
    certificate_id: certificateId,
    score: 100
  });

  return res.status(200).json({
    success: 1,
    data: certificate,
    message: "Certificate created successfully",
  });
});

////////////////////////////////////////
/////////// Get All Certificates 👤 /////////
//////////////////////////////////////
exports.getAllCertificates = tryCatchHandler(async (req, res) => {
  const Certificates = await Certificate.find().populate("user_id quiz_category quiz_id", "first_name last_name email dob gender name title image");

  return res.status(200).json({
    success: 1,
    data: Certificates,
    message: "Fetched all Certificates successfully",
  });
});

////////////////////////////////////////
/////////// Get Single Certificate 👤 ///////
//////////////////////////////////////
exports.getSingleCertificate = tryCatchHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id).populate("user_id quiz_category quiz_id", "first_name last_name email dob gender name title image");

  if (!certificate) {
    return res.status(404).json({
      success: 0,
      message: "Certificate not found",
    });
  }

  return res.status(200).json({
    success: 1,
    data: certificate,
    message: "Certificate fetched successfully",
  });
});

////////////////////////////////////////
/////////// Get User's Certificate 👤 ///////
//////////////////////////////////////
exports.getUserCertificate = tryCatchHandler(async (req, res) => {
  const certificate = await Certificate.find({ user_id: req.user.user_id }).populate("user_id quiz_category quiz_id", "first_name last_name email dob gender name title");

  if (!certificate) {
    return res.status(404).json({
      success: 0,
      message: "Certificate not found for this user",
    });
  }

  return res.status(200).json({
    success: 1,
    data: certificate,
    message: "User Certificate fetched successfully",
  });
});

