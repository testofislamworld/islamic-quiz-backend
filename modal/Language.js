
const mongoose = require("mongoose");
const Joi = require("joi");

const LanguageSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true
        },
        direction: {
            type: String,
            required: true
        },
        directory: {
            type: String
        },
        is_default: {
            type: String,
            default: "0",
            enum: ["0", "1"]
        },
        language_name: {
            type: String,
            required: true
        },
        status: {
            type: String,
            default: "active",
            enum: ["active", "disabled"]
        }
    },
    { timestamps: true }
);

const Language = mongoose.model("Language", LanguageSchema);

function validateLanguage(language) {
    const schema = Joi.object({
        code: Joi.string(),
        direction: Joi.string(),
        directory: Joi.string().allow(null),
        is_default: Joi.string(),
        language_name: Joi.string(),
        status: Joi.string()
    });
    return schema.validate(language);
}
exports.Language = Language;
exports.validate = validateLanguage;