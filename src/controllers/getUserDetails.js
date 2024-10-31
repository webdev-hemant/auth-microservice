const User = require("../models/User");

exports.getUserDetails = async (req, res) => {
  const userDetails = req.user;
  try {
    res.send(userDetails);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Function to handle fetching multiple users by IDs
exports.getUsersByIds = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid request: 'ids' must be a non-empty array" });
    }

    const users = await User.findAll({
      where: { id: ids },
      attributes: { exclude: ["password"] }, // Exclude sensitive data like passwords
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: error.message });
  }
};
