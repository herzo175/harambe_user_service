const graphql = require("graphql");
const crypto = require("crypto");

const index = require("./index");
const config = require("./config");

const passwordCipherAlg = config.passwordCipherAlg;
const passwordKey = config.passwordKey;
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLID,
  GraphQLInt,
  GraphQLList
} = graphql;

const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    _id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    password: { type: GraphQLString }
  })
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    User: {
      type: UserType,
      args: { _id: { type: GraphQLID } },
      resolve: (parent, args) => {
        return index.User.findById(args._id);
      }
    }
  }
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    // TODO: split user mutations into multiple setters
    updateUser: {
      type: UserType,
      args: {
        _id: { type: GraphQLID },
        email: { type: GraphQLString },
        password: { type: GraphQLString }
      },
      resolve: (parent, args) => {
        // console.log(args);
        const cipher = crypto.createCipher(passwordCipherAlg, passwordKey);
        // const encrypted = cipher.update(args.password, "utf8", "hex") + cipher.final('hex');

        return new Promise(
          (resolve, reject) => {
            index.User.findById(args._id)
              .then(user => {
                user.save();
                user.password = args.password ? cipher.update(args.password, "utf8", "hex") + cipher.final('hex') : user.password;
                user.email = args.email || user.email
                resolve(user);
              })
              .catch(err => {
                reject(err);
              })
          }
        );
      }
    }
  }
});

module.exports = {
  UserType,
  RootQuery,
  Mutation
};