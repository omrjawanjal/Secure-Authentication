const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: { type: String },
    otp: { type: String },
    createdAt: { type: Date },
    expiresAt: { type: Date },
  },
  {
    collection: "Otp-Data",
  }
);

module.exports = mongoose.model("Otp-Data", otpSchema);
