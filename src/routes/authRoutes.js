const express = require("express");
const {
  register,
  login,
  getAllUsers,
} = require("../controllers/authController");
const { getUserDetails } = require("../controllers/getUserDetails");
const { isAuthenticated } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/getAllUsers", isAuthenticated, getAllUsers);

router.post("/register", register);
router.post("/login", login);
router.get("/getUserDetails", isAuthenticated, getUserDetails);

module.exports = router;
