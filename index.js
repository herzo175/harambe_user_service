const jwt = require("jsonwebtoken");

const config = require("./config");

module.exports = {
  checkLogin: function (token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, config.jwtKey, function(err, decoded) {
        if (err) {
          reject(err);
        } else if (decoded.exp < Date.now()) {
          reject("jwt expired");
        } else {
          resolve(decoded);
        }
      });
    });
  }
}