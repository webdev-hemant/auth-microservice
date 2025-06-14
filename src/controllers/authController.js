const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RegisterUsingMobileNumber = require("../models/mobileLoginModel");
const { JWT_SECRET, ADMIN_EMAIL } = require("../config/allEnv");
const { Op } = require("sequelize");
const { generateOTP } = require("../utils");

exports.getAllUsers = async (req, res) => {
  try {
    if (req?.user?.email !== ADMIN_EMAIL) {
      return res.status(200).json({ message: "who the fuck are you?" });
    }

    // Fetch email-based users
    const emailUsers = await User.findAll({
      attributes: [
        "id",
        "username",
        "email",
        "firstName",
        "lastName",
        "birthdate",
        "createdAt",
        "updatedAt",
      ],
    });

    // Fetch mobile-based users
    const mobileUsers = await RegisterUsingMobileNumber.findAll({
      attributes: [
        "id",
        "countryCode",
        "mobileNumber",
        "firstName",
        "lastName",
        "isVerified",
        "lastLoginAt",
        "createdAt",
        "updatedAt",
      ],
    });

    res.status(200).json({
      total: emailUsers.length + mobileUsers.length,
      emailUsers,
      mobileUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.register = async (req, res) => {
  const { username, password, firstName, lastName, birthdate, email } =
    req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({
      username,
      password: hashedPassword,
      firstName,
      lastName,
      birthdate,
      email,
    });
    res.status(201).json({
      message: "User created",
      user: { id: user.id, username, firstName, lastName, birthdate, email },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Username or email already exists!" });
    }
    res.status(400).json({ error: error.message });
  }
};

exports.registerUsingMobileNumber = async (req, res) => {
  const { countryCode, mobileNumber, firstName, lastName } = req.body;

  try {
    const user = await RegisterUsingMobileNumber.create({
      countryCode,
      mobileNumber,
      firstName,
      lastName,
      isVerified: false,  // optional, can be defaulted in model
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        countryCode: user.countryCode,
        mobileNumber: user.mobileNumber,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Mobile number already exists!" });
    }
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: "24h",
    });
    res.json({
      message: "Logged in",
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        birthdate: user.birthdate,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendOtpForLogin = async (req, res) => {
  let { countryCode, mobileNumber } = req.body;
  countryCode = countryCode || "+91"; // Default to India if not provided
  mobileNumber = mobileNumber ? mobileNumber.toString().replace(/\D/g, "") : null; // Remove non-digit characters

  if (!mobileNumber) {
    return res.status(400).json({ error: "Country code and mobile number required" });
  }

  try {
    let mobileUser = await RegisterUsingMobileNumber.findOne({
      where: { countryCode, mobileNumber },
    });

    if (!mobileUser) {
      // If mobileUser not found, auto-register (optional behavior)
      mobileUser = await RegisterUsingMobileNumber.create({
        countryCode,
        mobileNumber,
        isVerified: false,
      });
    }

    const otp = generateOTP();

    // Save OTP to DB
    mobileUser.otp = otp;
    await mobileUser.save();

    // In real world, send OTP via SMS gateway
    console.log("OTP sent:", otp);

    res.json({
      message: "OTP sent successfully",
      otp,  // REMOVE this in production! Never send OTP in response.
    });
  } catch (error) {
    console.error("Error in sendOtpForLogin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.verifyOtpForLogin = async (req, res) => {
  let { countryCode, mobileNumber, otp } = req.body;
  countryCode = countryCode || "+91"; // Default to India if not provided
  mobileNumber = mobileNumber ? mobileNumber.toString().replace(/\D/g, "") : null; // Remove non-digit characters

  if (!mobileNumber || !otp) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const mobileUser = await RegisterUsingMobileNumber.findOne({
      where: { countryCode, mobileNumber },
    });

    if (!mobileUser) {
      return res.status(404).json({ error: "mobileUser not found" });
    }

    if (mobileUser.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // OTP valid — login success
    mobileUser.isVerified = true;
    mobileUser.lastLoginAt = new Date();
    mobileUser.otp = null;  // clear OTP after verification
    await mobileUser.save();

    const token = jwt.sign({ id: mobileUser.id }, JWT_SECRET, {
      expiresIn: "24h",
    });

    // In real world: generate JWT token here

    res.json({
      message: "OTP verified successfully. Login successful.",
      token,
      mobileUser: {
        id: mobileUser.id,
        countryCode: mobileUser.countryCode,
        mobileNumber: mobileUser.mobileNumber,
        firstName: mobileUser.firstName,
        lastName: mobileUser.lastName,
        isVerified: mobileUser.isVerified,
      },
    });
  } catch (error) {
    console.error("Error in verifyOtpForLogin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};