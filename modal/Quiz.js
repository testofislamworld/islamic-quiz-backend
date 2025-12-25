const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const Schema = mongoose.Schema;

const QuizSchema = new mongoose.Schema(
  {
    quiz_category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true // Added required if category is mandatory
    },
    image:{
      type: String,
      default: null
    },
    video:{
      type: String,
      default: null
    },
    title: [
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
    description: [
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
        options: [
          {
            // Simplified options structure
            language_id: {
              type: Schema.Types.ObjectId,
              ref: "Language",
              required: true
            },
            values: [
              {
                // Changed to values to store multiple options per language
                type: String,
                required: true
              }
            ]
          }
        ],
        correct_answer: [
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
        ]
      }
    ]
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", QuizSchema);

function validateQuiz(quiz) {
  const schema = Joi.object({
    quiz_category: Joi.objectId().required(),
    title: Joi.array()
      .items(
        Joi.object({
          // Added Joi.object() wrapper
          language_id: Joi.objectId().required(),
          value: Joi.string().required()
        })
      )
      .min(1),
    description: Joi.array().items(
      Joi.object({
        language_id: Joi.objectId().required(),
        value: Joi.string().required()
      })
    ),
    questions: Joi.array()
      .items(
        Joi.object({
          question: Joi.array()
            .items(
              Joi.object({
                language_id: Joi.objectId().required(),
                value: Joi.string().required()
              })
            )
            .min(1),
          options: Joi.array()
            .items(
              Joi.object({
                language_id: Joi.objectId().required(),
                values: Joi.array().items(Joi.string().required()).min(2) // At least 2 options
              })
            )
            .min(1),
          correct_answer: Joi.array()
            .items(
              // Fixed typo from 'oi' to 'Joi'
              Joi.object({
                language_id: Joi.objectId().required(),
                value: Joi.string().required()
              })
            )
            .min(1)
        })
      )
      .min(1),
    image: Joi.string(),
    video: Joi.string()
  });

  return schema.validate(quiz);
}

exports.Quiz = Quiz;
exports.validate = validateQuiz;
