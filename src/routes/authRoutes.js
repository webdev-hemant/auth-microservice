const express = require("express");
const {
  register,
  login,
  getAllUsers,
  registerUsingMobileNumber,
  sendOtpForLogin,
  verifyOtpForLogin,
} = require("../controllers/authController");
const { getUserDetails, getUsersByIds } = require("../controllers/getUserDetails");
const { isAuthenticated } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/getAllUsers", isAuthenticated, getAllUsers);

router.post("/register", register);
router.post('/registerUsingMobile', registerUsingMobileNumber); // Assuming the same register function handles mobile registration
router.post("/login", login);
router.get("/getUserDetails", isAuthenticated, getUserDetails);
router.post("/getUsersByIds", getUsersByIds);
router.post("/sendOtpForLogin", sendOtpForLogin);
router.post("/verifyOtpForLogin", verifyOtpForLogin);

module.exports = router;
