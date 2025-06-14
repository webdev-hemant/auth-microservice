const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/allEnv");
const User = require("../models/User");
const RegisterUsingMobileNumber = require("../models/mobileLoginModel");

const isAuthenticated = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findOne({
      where: { id: decoded.id },
    });

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

    // If not found in User model, check in mobile number model
    const mobileUser = await RegisterUsingMobileNumber.findOne({
      where: { id: decoded.id },
    });

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
  });
};

module.exports = { isAuthenticated };
