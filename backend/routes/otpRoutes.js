const express = require("express");
const router1 = express.Router();
const otpSchema = require("../schema/otpSchema");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
require("dotenv").config();

const getCurrentAndExpiryTime = () => {
  const now = new Date();
  const expiry = new Date(now.getTime() + 10 * 60 * 1000);
  return { createdAt: now, expiresAt: expiry };
};

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "chethannv23.csedvit@gmail.com",
    pass: "qosp hecn uhio rpns",
  },
  debug: true,
});

// transporter.verify((error, success) => {
//   if (error) {
//     console.log(error);
//   } else {
//     console.log("Ready for messages");
//     console.log(success);
//   }
// });

const sendOtpEmail = async (email, otp, name) => {
  const mailOptions = {
    from: `"Chethan N V" <chethannv23.csedvit@gmail.com>`,
    to: email,
    subject: "Verification Code for Account Activation!!!",
    html: `
      <p>Dear ${name},</p>
      <p>Please use the following verification code to activate your account:</p>
      <p><b>${otp}</b></p>
      <p>Otp expires in <b>10 minutes</b></p>
      <br />
      <p>Best regards,</p>
      <p>Chethan N V</p>
    `,
  };
  await transporter.sendMail(mailOptions);
};

router1.post("/otpstore", async (req, res, next) => {
  const { email, name } = req.body;
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }
  const hashedOtp = await bcrypt.hash(otp, 10);
  const { createdAt, expiresAt } = getCurrentAndExpiryTime();

  try {
    await otpSchema.deleteMany({ email });
    const newUser = new otpSchema({
      email,
      otp: hashedOtp,
      createdAt,
      expiresAt,
    });
    await newUser.save();
    await sendOtpEmail(email, otp, name);

    return res.status(200).json("Successful");
  } catch (error) {
    next(error);
  }
});

router1.post("/otpcheck", async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await otpSchema.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid email or OTP." });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or OTP." });
    }
    
    const currentTime = new Date();
    if (currentTime > otpRecord.expiresAt) {
      return res.status(400).json({ error: "OTP has expired." });
    }
    await otpSchema.deleteMany({ email });
    return res.status(200).json({ message: "OTP is valid." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router1.post("/otpreset", async (req, res, next) => {
  const { email, name } = req.body;
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }
  const hashedOtp = await bcrypt.hash(otp, 10);
  const { createdAt, expiresAt } = getCurrentAndExpiryTime();

  try {
    await otpSchema.deleteMany({ email });
    const newUser = new otpSchema({
      email,
      otp: hashedOtp,
      createdAt,
      expiresAt,
    });
    await newUser.save();
    await sendOtpForgotPassword(email, otp, name);
    return res.status(200).json("Successful");
  } catch (error) {
    next(error);
  }
});

const sendOtpForgotPassword = async (email, otp, name) => {
  const mailOptions = {
    from: `"Chethan N V" <${process.env.AUTH_EMAIL}>`,
    to: email,
    subject: "Password Change Requested!!!",
    html: `
        <p>Hello ${name},</p>
        <p>Please use the following verification code to change your password:</p>
        <p><b>${otp}</b></p>
        <p>Otp expires in <b>10 minutes</b></p>
        <br />
        <p>Best regards,</p>
        <p>Chethan N V</p>
      `,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = router1;
