/**
 * NOTE: You will need to set environment variables
 * or configure a .env file with all of the config options below.
 * This file just puts all config options in one place
 */
require("dotenv").config();

module.exports = {
  jwtKey: process.env.JWT_KEY, // json web token signing key
  dbURL: process.env.DB_URL, // mongodb url
  dbName: process.env.DB_NAME, // mongodb database name
  port: process.env.PORT
};