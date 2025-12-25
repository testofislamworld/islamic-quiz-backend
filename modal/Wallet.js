const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WalletSchema = new mongoose.Schema(
  {
    
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    balance:{
        type: String,
        default: 0
    },
    paid_amount:{
        type: String,
        default: 0
    }
  },
  { timestamps: true }
);

const Wallet = mongoose.model("Wallet", WalletSchema);

exports.Wallet = Wallet;
