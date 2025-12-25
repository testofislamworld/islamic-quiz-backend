const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BankAccountSchema = new mongoose.Schema(
  {
    
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    bank_name:{
        type: String,
    },
    account_title:{
        type: String
    },
    iban:{
        type: String
    },
    account_no:{
        type: String
    }

  },
  { timestamps: true }
);

const BankAccount = mongoose.model("BankAccount", BankAccountSchema);

exports.BankAccount = BankAccount;
