const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserProgressionSchema = new mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    completedQuizzes: [
      {
        quiz_id: {
          type: Schema.Types.ObjectId,
          ref: "Quiz",
          required: true
        },
        score: {
          type: Number,
          required: true
        },
        completed: {
          type: Boolean,
          default: false
        },
        completedAt: {
          type: Date,
          default: null
        }
      }
    ],
    unlockedCategories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category"
      }
    ],
    unlockedQuizzes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Quiz"
      }
    ],
    currentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null
    },
    currentQuiz: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      default: null
    },
    // New fields for lucky draw functionality
    luckyDrawParticipation: [
      {
        luckyDraw: {
          type: Schema.Types.ObjectId,
          ref: "LuckyDraw"
        },
        category: {
          type: Schema.Types.ObjectId,
          ref: "Category"
        },
        eligible: {
          type: Boolean,
          default: false
        },
        won: {
          type: Boolean,
          default: false
        },
        prize: {
          type: String,
          default: null
        }
      }
    ],
    // Track if the user has completed all quizzes in a category with 100% score
    categoryCompletions: [
      {
        category: {
          type: Schema.Types.ObjectId,
          ref: "Category"
        },
        completedAt: {
          type: Date,
          default: Date.now
        },
        luckyDrawParticipated: {
          type: Boolean,
          default: false
        },
        luckyDrawWon: {
          type: Boolean,
          default: false
        }
      }
    ]
  },
  { timestamps: true }
);

const UserProgression = mongoose.model(
  "UserProgression",
  UserProgressionSchema
);

exports.UserProgression = UserProgression;
