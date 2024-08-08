const mongoose = require("mongoose");

const PdfSchema = new mongoose.Schema(
  {
    pdf: { type: String },
    title: { type: String },
    email: { type: String },
  },
  {
    collection: "PdfDetails",
  }
);

module.exports = mongoose.model("PdfDetails", PdfSchema);
