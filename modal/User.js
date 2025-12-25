const mongoose = require("mongoose");
const Joi = require("joi");

const UserSchema = new mongoose.Schema(
  {
    first_name: {
      type: String
    },
    last_name: {
      type: String
    },
    image: {
      type: String,
      default: null
    },
    email: {
      type: String
    },
    password: {
      type: String
    },
    phone_no: {
      type: String
    },
    dob: {
      type: String
    },
    gender: {
      type: String,
      enum: ["male", "female"]
    },
    address: {
      type: String
    },
    city: {
      type: String
    },
    state: {
      type: String
    },
    country: {
      type: String
    },
    status: {
      type: String,
      default: "active"
    },
    verification_code:{
      type: Number,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    }
  },

  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

function validateUser(user) {
  const schema = Joi.object({
    first_name: Joi.string(),
    last_name: Joi.string(),
    image: Joi.string(),
    email: Joi.string(),
    password: Joi.string(),
    phone_no: Joi.string(),
    dob: Joi.string(),
    address: Joi.string(),
    gender: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    country: Joi.string(),
    status: Joi.string(),
    role: Joi.string(),
    verification_code: Joi.number()
  });
  return schema.validate(user);
}
exports.User = User;
exports.validate = validateUser;
