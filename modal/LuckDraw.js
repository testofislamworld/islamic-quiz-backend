const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LuckyDrawSchema = new mongoose.Schema(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    scheduledDate: {
      type: Date,
      required: true
    },
    prizes: [{
      name: {
        type: String,
        required: true
      },
      description: {
        type: String
      },
      quantity: {
        type: Number,
        default: 1
      },
      image: {
        type: String
      }
    }],
    eligibleUsers: [{
      type: Schema.Types.ObjectId,
      ref: "User"
    }],
    winners: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: "User"
      },
      prize: {
        type: String
      },
      selectedAt: {
        type: Date,
        default: Date.now
      }
    }],
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled"
    },
    cancellationReason: {
        type: String,
        default: null
    }
  },
  { timestamps: true }
);

const LuckyDraw = mongoose.model("LuckyDraw", LuckyDrawSchema);

exports.LuckyDraw = LuckyDraw;