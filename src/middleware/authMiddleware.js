const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/allEnv");
const User = require("../models/User");
const RegisterUsingMobileNumber = require("../models/mobileLoginModel");

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(403).json({ message: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    // Check both models in parallel
    const [user, mobileUser] = await Promise.all([
      User.findOne({ where: { id: userId } }),
      RegisterUsingMobileNumber.findOne({ where: { id: userId } }),
    ]);

    if (user) {
      req.user = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        birthdate: user.birthdate,
        email: user.email,
        type: "emailUser",
      };
      return next();
    }

    if (mobileUser) {
      req.user = {
        id: mobileUser.id,
        countryCode: mobileUser.countryCode,
        mobileNumber: mobileUser.mobileNumber,
        firstName: mobileUser.firstName,
        lastName: mobileUser.lastName,
        isVerified: mobileUser.isVerified,
        type: "mobileUser",
      };
      return next();
    }

    return res.status(404).json({ message: "User not found" });
  } catch (err) {
    console.error("Authentication error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = { isAuthenticated };
