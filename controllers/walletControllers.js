const { Wallet } = require("../modal/Wallet");
const tryCatchHandler = require("../utils/tryCatch");

////////////////////////////////////////
/////////// Create Wallet 👤 ///////////
//////////////////////////////////////
exports.createWallet = tryCatchHandler(async (req, res) => {
  const existingWallet = await Wallet.findOne({ user_id: req.user.user_id });

  if (existingWallet) {
    return res.status(400).json({
      success: 0,
      message: "A wallet for this user already exists",
    });
  }

  const wallet = await Wallet.create({
    ...req.body,
    user_id: req.user.user_id,
  });

  return res.status(201).json({
    success: 1,
    data: wallet,
    message: "Wallet created successfully",
  });
});

////////////////////////////////////////
/////////// Get All Wallets 👤 /////////
//////////////////////////////////////
exports.getAllWallets = tryCatchHandler(async (req, res) => {
  const wallets = await Wallet.find().populate("user_id", "-password");

  return res.status(200).json({
    success: 1,
    data: wallets,
    message: "Fetched all wallets successfully",
  });
});

////////////////////////////////////////
/////////// Get Single Wallet 👤 ///////
//////////////////////////////////////
exports.getSingleWallet = tryCatchHandler(async (req, res) => {
  const wallet = await Wallet.findById(req.params.id).populate("user_id", "-password");

  if (!wallet) {
    return res.status(404).json({
      success: 0,
      message: "Wallet not found",
    });
  }

  return res.status(200).json({
    success: 1,
    data: wallet,
    message: "Wallet fetched successfully",
  });
});

////////////////////////////////////////
/////////// Get User's Wallet 👤 ///////
//////////////////////////////////////
exports.getUserWallet = tryCatchHandler(async (req, res) => {
  const wallet = await Wallet.findOne({ user_id: req.user.user_id }).populate("user_id", "-password");

  if (!wallet) {
    return res.status(404).json({
      success: 0,
      message: "Wallet not found for this user",
    });
  }

  return res.status(200).json({
    success: 1,
    data: wallet,
    message: "User wallet fetched successfully",
  });
});

////////////////////////////////////////
/////////// Update Wallet 👤 ///////////
//////////////////////////////////////
exports.updateWallet = tryCatchHandler(async (req, res) => {
  const existingWallet = await Wallet.findById(req.params.id);

  if (!existingWallet) {
    return res.status(404).json({
      success: 0,
      message: "Wallet not found",
    });
  }

  const updatedWallet = await Wallet.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  return res.status(200).json({
    success: 1,
    data: updatedWallet,
    message: "Wallet updated successfully",
  });
});
