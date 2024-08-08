const express = require("express");
const router = express.Router();
const Schema = require("../schema/schema");
const otpSchema = require("../schema/otpSchema");
const bcrypt = require("bcrypt");
require("dotenv").config();
const nodemailer = require("nodemailer");
const axios = require("axios");

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

router.post("/create", async (req, res, next) => {
  try {
    const { name, email, password, verified } = req.body;
    const existingEmail = await Schema.findOne({ email: email });
    if (existingEmail) {
      return res.status(400).json("Email already exists.");
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new Schema({
      name,
      email,
      password: hashedPassword,
      verified: verified,
    });
    await newUser.save();
    //await axios.post("http://localhost:5500/Otp-Data/otpstore", {
    if (newUser.verified === false) {
      await axios.post(
        "https://googledata-backend.onrender.com/Otp-Data/otpstore",
        {
          email: email,
          name: name,
        }
      );
    }
    return res.status(200).json("Successfull");
  } catch (error) {
    console.error("Error:", error);
    next(error);
  }
});

router.post("/data", (req, res, next) => {
  const { email } = req.body;
  Schema.findOne({ email: email }).then((login) => {
    if (login) {
      return res.status(200).json(login);
    } else {
      return res.status(400).json("No record exits");
    }
  });
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existingUser = await Schema.findOne({ email });

    if (existingUser) {
      const passwordMatch = await bcrypt.compare(
        password,
        existingUser.password
      );
      if (passwordMatch) {
        if (existingUser.verified) {
          return res
            .status(200)
            .json({ message: "Login successful", user: existingUser });
        } else {
          return res
            .status(202)
            .json({ message: "Email not verified. Please verify your email." });
        }
      } else {
        return res.status(401).json({ message: "Incorrect email or password" });
      }
    } else {
      return res.status(404).json({ message: "Incorrect email or password" });
    }
  } catch (error) {
    next(error);
  }
});

const welcome = async (email, name) => {
  const mailOptions = {
    from: `"Chethan N V" <${process.env.AUTH_EMAIL}>`,
    to: email,
    subject: "Welcome to OurPlatform!!!",
    html: `
        <p>Hello ${name},</p>
        <p>Welcome to OurPlatform! We're excited to have you on board!!!</p>
        <br />
        <p>Best regards,</p>
        <p>Chethan N V</p>
      `,
  };
  await transporter.sendMail(mailOptions);
};

router.post("/update", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const existingUser = await Schema.findOne({ email });

    if (existingUser) {
      if (existingUser.verified === true) {
        res.status(200).json({ message: "User already verified!" });
      } else {
        const response = await axios.post(
          // "http://localhost:5500/Otp-Data/otpcheck",
          "https://googledata-backend.onrender.com/Otp-Data/otpcheck",
          {
            email: email,
            otp: otp,
          }
        );
        if (response.status === 200) {
          existingUser.verified = true;
          await existingUser.save();
          await welcome(email, existingUser.name);
        } else {
          return existingUser.message;
        }
      }
      res.status(200).json({ message: "User verified successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: "Failed to save/update user data" });
  }
});

const passwordChanged = async (email, name) => {
  const mailOptions = {
    from: `"Chethan N V" <${process.env.AUTH_EMAIL}>`,
    to: email,
    subject: "Password Changed!!!",
    html: `
        <p>Hello ${name},</p>
        <p>Password has been updated successfully!!!</p>
        <br />
        <p>Best regards,</p>
        <p>Chethan N V</p>
      `,
  };
  await transporter.sendMail(mailOptions);
};

router.post("/updatePassword", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await Schema.findOne({ email });

    if (existingUser) {
      const hashedPassword = await bcrypt.hash(password, 10);
      existingUser.password = hashedPassword;
      await existingUser.save();
      res.status(200).json({ message: "Password updated successfully" });
      await passwordChanged(email, existingUser.name);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: "Failed to update password" });
  }
});

router.post("/otpForPasswordUpdate", async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await Schema.findOne({ email });
    if (existingUser) {
      const name = await existingUser.name;
      const response = await axios.post(
        // "http://localhost:5500/Otp-Data/otpreset",
        "https://googledata-backend.onrender.com/Otp-Data/otpreset",
        {
          email: email,
          name: name,
        }
      );
      if (response.status === 200) {
        existingUser.verified = false;
        existingUser.save();
        res.status(200).json({ message: "Otp sent successfully!!!" });
      } else {
        res.status(404).json({ message: response.message });
      }
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: "Failed to send OTP" });
  }
});

router.post("/verifyForPasswordUpdate", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const existingUser = await Schema.findOne({ email });

    if (existingUser) {
      if (existingUser.verified === true) {
        return res.status(200).json({ message: "User already verified!" });
      } else {
        try {
          const response = await axios.post(
            //"http://localhost:5500/Otp-Data/otpcheck",
            "https://googledata-backend.onrender.com/Otp-Data/otpcheck",
            {
              email: email,
              otp: otp,
            }
          );

          if (response.status === 200) {
            existingUser.verified = true;
            await existingUser.save();
            return res
              .status(200)
              .json({ message: "User verified successfully" });
          } else {
            return res.status(400).json({
              message: response.data.message || "OTP verification failed",
            });
          }
        } catch (error) {
          console.error(
            "Error during OTP verification:",
            error.response ? error.response.data : error.message
          );
          return res.status(400).json({
            message: error.response
              ? error.response.data
              : "OTP verification service error",
          });
        }
      }
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error finding user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
