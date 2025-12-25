const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CertificateSchema = new mongoose.Schema(
  {
    
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    score:{
        type: String,
    },
    quiz_category:{
      type: Schema.Types.ObjectId,
      ref: "Category" 
    },
    quiz_id:{
      type: Schema.Types.ObjectId,
      ref: "Quiz" 
    },
    certificate_id:{
      type: String,
    }

  },
  { timestamps: true }
);

const Certificate = mongoose.model("Certificate", CertificateSchema);

exports.Certificate = Certificate;
