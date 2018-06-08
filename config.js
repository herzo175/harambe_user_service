/**
 * NOTE: You will need to set environment variables
 * or configure a .env file with all of the config options below.
 * This file just puts all config options in one place
 */
require("dotenv").config();

module.exports = {
  jwtKey: process.env.JWT_KEY,
  dbURL: process.env.DB_URL,
  dbName: process.env.DB_NAME,
  passwordCipherAlg: process.env.PASSWORD_CIPHER_ALG,
  passwordKey: process.env.PASSWORD_KEY
};