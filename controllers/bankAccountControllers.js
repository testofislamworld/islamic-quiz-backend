const { BankAccount } = require("../modal/BankAccount");
const tryCatchHandler = require("../utils/tryCatch");

// Helper function for validation
const isEmpty = (value) => !value || value.trim() === "";

// Create Bank Account
exports.createBankAccount = tryCatchHandler(async (req, res) => {
  const { bank_name, account_title, iban, account_no } = req.body;

  if ([bank_name, account_title, iban, account_no].some(isEmpty)) {
    return res.status(400).json({
      success: 0,
      message: "All fields are required",
    });
  }

  const existingAccount = await BankAccount.findOne({ user_id: req.user.user_id });

  if (existingAccount) {
    return res.status(400).json({
      success: 0,
      message: "A bank account for this user already exists",
    });
  }

  const newAccount = await BankAccount.create({
    ...req.body,
    user_id: req.user.user_id,
  });

  return res.status(201).json({
    success: 1,
    data: newAccount,
    message: "Bank account created successfully",
  });
});

// Get All Bank Accounts
exports.getAllAccounts = tryCatchHandler(async (req, res) => {
  const accounts = await BankAccount.find().populate("user_id", "-password");

  return res.status(200).json({
    success: 1,
    data: accounts,
    message: "Fetched all user bank accounts",
  });
});

// Get Single Bank Account by ID
exports.getSingleBankAccount = tryCatchHandler(async (req, res) => {
  const account = await BankAccount.findById(req.params.id).populate("user_id", "-password");

  if (!account) {
    return res.status(404).json({
      success: 0,
      message: "Bank account not found",
    });
  }

  return res.status(200).json({
    success: 1,
    data: account,
    message: "Bank account fetched successfully",
  });
});

// Get Logged-in User's Bank Account
exports.getUserBankAccount = tryCatchHandler(async (req, res) => {
  const account = await BankAccount.findOne({ user_id: req.user.user_id }).populate("user_id", "-password");

  if (!account) {
    return res.status(404).json({
      success: 0,
      message: "Bank account not found for the user",
    });
  }

  return res.status(200).json({
    success: 1,
    data: account,
    message: "User bank account fetched successfully",
  });
});

// Get  User's Bank Account
exports.getUsersBankAccount = tryCatchHandler(async (req, res) => {
  const account = await BankAccount.findOne({ user_id: req.params.user_id }).populate("user_id", "-password");

  if (!account) {
    return res.status(404).json({
      success: 0,
      message: "Bank account not found for the user",
    });
  }

  return res.status(200).json({
    success: 1,
    data: account,
    message: "User bank account fetched successfully",
  });
});


// Update Bank Account
exports.updateBankAccount = tryCatchHandler(async (req, res) => {
  const account = await BankAccount.findOne({ user_id: req.user.user_id });

  if (!account) {
    return res.status(404).json({
      success: 0,
      message: "Bank account does not exist",
    });
  }

  const updatedAccount = await BankAccount.findOneAndUpdate(
    { user_id: req.user.user_id },
    req.body,
    { new: true, runValidators: true }
  );

  return res.status(200).json({
    success: 1,
    data: updatedAccount,
    message: "Bank account updated successfully",
  });
});
