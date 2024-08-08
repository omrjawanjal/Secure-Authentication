const mongoose = require("mongoose");
const express = require("express");
const FL = require("./routes/userRoutes");
const OL = require("./routes/otpRoutes");
const PL = require("./routes/pdfRoutes");
const cors = require("cors");

const app = express();
app.use("/files", express.static("files"));

mongoose.set("strictQuery", true);
mongoose.connect(
  "mongodb+srv://chethannv:chethan@chethan.kjdlxwb.mongodb.net/googleData"
);
const db = mongoose.connection;
db.on("open", () => {
  console.log("Database Connected");
});
db.on("error", () => {
  console.log("Database not Connected");
});

app.use(express.json());
app.use(cors());
app.use("/User-Data", FL);
app.use("/Otp-Data", OL);
app.use("/PdfDetails", PL);

const port = 5500;
app.listen(port, () => {
  console.log("Server Started on " + port);
});
