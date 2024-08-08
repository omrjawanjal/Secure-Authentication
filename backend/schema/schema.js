const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    password: { type: String },
    verified: { type: Boolean },
  },
  {
    collection: "User-Data",
  }
);

module.exports = mongoose.model("User-Data", Schema);
