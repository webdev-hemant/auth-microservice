const User = require("../models/User");
const RegisterUsingMobileNumber = require("../models/mobileLoginModel");

exports.getUserDetails = async (req, res) => {
  const userDetails = req.user;
  try {
    res.send(userDetails);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.getUsersByIds = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid request: 'ids' must be a non-empty array" });
    }

    // Fetch users from User model
    const emailUsers = await User.findAll({
      where: { id: ids },
      attributes: { exclude: ["password"] },
    });

    // Fetch users from LoginUsingMobileNumber model
    const mobileUsers = await RegisterUsingMobileNumber.findAll({
      where: { id: ids },
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

    res.json({
      total: emailUsers.length + mobileUsers.length,
      emailUsers,
      mobileUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: error.message });
  }
};
