const mongoose = require("mongoose");
const graphql = require("graphql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const config = require("./config");
const index = require("./index");
const { BankAccount, BankAccountType } = require("./bankAccountSchema");

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
  GraphQLBoolean,
  GraphQLList
} = graphql;

let user = {};

user.User = mongoose.model(
  "User",
  new mongoose.Schema({
    email: String,
    password: String,
    firstName: String,
    lastName: String,
    notifications: {
      topics: {
        announcements: Boolean,
        account: Boolean
      },
      methods: {
        email: Boolean,
        sms: Boolean
      }
    }
  })
);

user.UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    _id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
    notifications: {
      type: new GraphQLObjectType({
        name: "Notifications",
        fields: () => ({
          topics: {
            type: new GraphQLObjectType({
              name: "Topics",
              fields: () => ({
                announcements: { type: GraphQLBoolean },
                account: { type: GraphQLBoolean }
              })
            })
          },
          methods: {
            type: new GraphQLObjectType({
              name: "Methods",
              fields: () => ({
                email: { type: GraphQLBoolean },
                sms: { type: GraphQLBoolean }
              })
            })
          }
        })
      })
    },
    bankAccounts: {
      type: new GraphQLList(BankAccountType),
      resolve: (user) => {
        return BankAccount.find({user: user._id})
      }
    }
  })
});

user.userQuery = {
  type: user.UserType,
  args: { token: { type: GraphQLNonNull(GraphQLString) } },
  resolve: async (parent, args) => {
    const decoded = await index.checkLogin(args.token);
    return user.User.findById(decoded._id);
  }
}

// mutations:
user.register = {
  type: GraphQLString,
  args: {
    email: { type: GraphQLNonNull(GraphQLString) },
    firstName: { type: GraphQLNonNull(GraphQLString) },
    lastName: { type: GraphQLNonNull(GraphQLString) },
    password: { type: GraphQLNonNull(GraphQLString) }
  },
  resolve: (parent, args) => {
    return new Promise((resolve, reject) => {
      const encrypted = bcrypt.hashSync(args.password, 16);

      const newUser = {
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        password: encrypted
      };

      user.User.create(newUser)
        .then(result => {
          // TODO: add redirect url to jwt object
          resolve(
            jwt.sign(
              {
                exp: Date.now() + 60 * 60 * 1000 * 24,
                _id: result._id
              },
              config.jwtKey
            )
          );
        })
        .catch(err => {
          reject(err);
        });
    });
  }
};

user.delete = function(userId) {
  return new Promise((resolve, reject) => {
    this.User.findByIdAndRemove(userId)
      .then(obj => {
        resolve("user successfully deleted");
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
  });
};

user.login = {
  type: GraphQLString,
  args: {
    email: { type: GraphQLNonNull(GraphQLString) },
    password: { type: GraphQLNonNull(GraphQLString) }
  },
  resolve: (parent, args) => {
    return new Promise((resolve, reject) => {
      user.User.findOne({
        email: args.email
      })
        .then(user => {
          if (!user || !bcrypt.compareSync(args.password, user.password)) {
            reject("incorrect username or password");
          } else {
            // TODO: add redirect url to jwt object
            resolve(
              jwt.sign(
                {
                  exp: Date.now() + 60 * 60 * 1000 * 24,
                  _id: user._id
                },
                config.jwtKey
              )
            );
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }
};

// TODO: password reset mutation

user.setNotification = function(type, method) {
  return {
    type: this.UserType,
    args: {
      token: { type: GraphQLNonNull(GraphQLString) },
      allow: { type: GraphQLNonNull(GraphQLBoolean) }
    },
    resolve: (parent, args) => {
      return new Promise((resolve, reject) => {
        index
          .checkLogin(args.token)
          .then(decoded => {
            this.User.findById(decoded._id).then(user => {
              user.notifications[type][method] = args.allow;
              user.save().then(savedUser => {
                resolve(savedUser);
              });
            });
          })
          .catch(err => {
            reject(err);
          });
      });
    }
  };
};

user.setNotificationMethodEmail = user.setNotification("methods", "email");

user.setNotificationMethodSms = user.setNotification("methods", "sms");

user.setNotificationTopicAnnouncements = user.setNotification(
  "topics",
  "announcements"
);

user.setNotificationTopicAccount = user.setNotification("topics", "account");

module.exports = user;
