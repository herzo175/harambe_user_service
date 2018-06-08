const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const mongoClient = mongo.MongoClient

const config = require('./config');

// in case we want to change the config locally
const jwtKey = config.jwtKey;
const dbURL = config.dbURL;
const dbName = config.dbName;
const passwordCipherAlg = config.passwordCipherAlg;
const passwordKey = config.passwordKey;

let index = {};

// TODO: make config file and env variables

const dbConn = mongoose.connect(dbURL);

index.User = mongoose.model('User', new mongoose.Schema({
  email: String,
  password: String,
  firstName: String,
  lastName: String
}));

index.getDB =  () => {
  return new Promise (
    (resolve, reject) => {
      mongoClient.connect(dbURL, { useNewUrlParser: true })
        .then(db => {
          resolve(db);
        })
        .catch(err => {
          reject(err);
        });
    }
  );
};

index.register = (userObj) => {
  return new Promise (
    (resolve, reject) => {
      if (
        typeof userObj.email !== 'string'
        || typeof userObj.firstName !== 'string'
        || typeof userObj.lastName !== 'string'
        || typeof userObj.password !== 'string') {
          reject("first name, last name, email, and password must be strings");
      } else {
        const cipher = crypto.createCipher(passwordCipherAlg, passwordKey);
        const encrypted = cipher.update(userObj.password, "utf8", "hex") + cipher.final('hex');

        const user = {
          firstName: userObj.firstName,
          lastName: userObj.lastName,
          email: userObj.email,
          password: encrypted
        }

        index.User.create(user)
          .then(result => {
            const email = result.email;
            const password = result.password;

            // TODO: add redirect url to jwt object
            resolve(jwt.sign({
              exp: Date.now() + (60 * 60 * 1000),
              user: result
            }, jwtKey));
          })
          .catch(err => {
            reject(err)
          });
      }
    }
  );
}

index.checkLogin = (token) => {
  return new Promise (
    (resolve, reject) => {
      jwt.verify(token, jwtKey, function (err, decoded) {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    }
  );
}

index.login = (email, password) => {
  return new Promise (
    (resolve, reject) => {
      if (typeof email !== 'string' || typeof password !== 'string') {
        reject('email and password must be strings');
      } else {
        const cipher = crypto.createCipher(passwordCipherAlg, passwordKey);

        index.User
          .findOne({
            email: email,
            password:
              cipher.update(password, "utf8", "hex") +
              cipher.final("hex")
          })
          .then(user => {
            if (!user) {
              reject('incorrect username or password');
            } else {
              // TODO: add redirect url to jwt object
              resolve(jwt.sign({
                exp: Date.now() + (60 * 60 * 1000),
                user: user
              }, jwtKey));
            }
          })
          .catch(err => {
            reject(err);
          });
      }
    }
  );
}

index.deleteUser = (userId) => {
  return new Promise (
    (resolve, reject) => {
      index.User.findByIdAndRemove(userId)
        .then(obj => {
          resolve("user successfully deleted");
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    }
  );
}

module.exports = index;