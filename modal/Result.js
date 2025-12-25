const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ResultSchema = new mongoose.Schema(
  {
    quiz_id: {
      type: Schema.Types.ObjectId,
      ref: "Quiz"
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    questions: [
      {
        question: [
          {
            language_id: {
              type: Schema.Types.ObjectId,
              ref: "Language",
              required: true
            },
            value: {
              type: String,
              required: true
            }
          }
        ],
        user_answer: [
          {
            language_id: {
              type: Schema.Types.ObjectId,
              ref: "Language",
              required: true
            },
            value: {
              type: String,
              required: true
            }
          }
        ],
        is_correct: {
          type: Boolean
        }
      }
    ],
    result_status: {
      type: String,
      enum: ["Pass", "Fail"]
    },
    result_percentage: {
      type : Number
    }
  },
  { timestamps: true }
);

const Result = mongoose.model("Result", ResultSchema);

exports.Result = Result;
