const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const Schema = mongoose.Schema;
const CategorySchema = new mongoose.Schema(
  {
    name: [
      {
        language_id: {
          type: Schema.Types.ObjectId,
          ref: "Language"
        },
        value: {
          type: String
        }
      }
    ],
    description:[
      {
        language_id: {
          type: Schema.Types.ObjectId,
          ref: "Language"
        },
        value: {
          type: String
        }
      }
    ],
    image:{
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", CategorySchema);

function validateCategory(category) {
  const schema = Joi.object({
    name: Joi.array().items({
      language_id: Joi.objectId(),
      value: Joi.string()
    }),
    description: Joi.array().items({
      language_id: Joi.objectId(),
      value: Joi.string()
    }),
    image: Joi.string()
  });
  return schema.validate(category);
}
exports.Category = Category;
exports.validate = validateCategory;
