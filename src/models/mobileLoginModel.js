const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const RegisterUsingMobileNumber = sequelize.define(
  "RegisterUsingMobileNumber",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    countryCode: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: '+91' // default to India, can be changed
    },
    mobileNumber: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: true, // OTP is temporary, used during login
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  },
  {
    timestamps: true, // includes createdAt and updatedAt
  }
);

module.exports = RegisterUsingMobileNumber;
