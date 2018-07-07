const mongoose = require("mongoose");
const graphql = require("graphql");

const index = require("./index");

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLSchema,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLBoolean
} = graphql;

let bankAccountSchema = {};

bankAccountSchema.BankAccount = mongoose.model(
  "BankAccount",
  new mongoose.Schema({
    accountNickname: String,
    default: { type: Boolean, default: false },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  })
);

bankAccountSchema.BankAccountType = new GraphQLObjectType({
  name: "BankAccount",
  fields: () => ({
    _id: { type: GraphQLID },
    accountNickname: { type: GraphQLString },
    default: { type: GraphQLBoolean }
  })
});

bankAccountSchema.bankAccountQuery = {
  type: bankAccountSchema.BankAccountType,
  args: {
    token: { type: GraphQLNonNull(GraphQLString) },
    _id: { type: GraphQLNonNull(GraphQLID) }
  },
  resolve: async (parent, args) => {
    const decoded = await user.checkLogin(args.token);
    return bankAccountSchema.BankAccount.find({_id: _id, user: decoded._id});
  }
}

bankAccountSchema.createBankAccount = {
  type: bankAccountSchema.BankAccountType,
  args: {
    accountNickname: { type: GraphQLNonNull(GraphQLString) },
    routingNumber: { type: GraphQLNonNull(GraphQLInt) },
    accountNumber: { type: GraphQLNonNull(GraphQLInt) },
    token: { type: GraphQLNonNull(GraphQLString) }
  },
  resolve: async (parent, args) => {
    const decoded = await index.checkLogin(args.token);

    return bankAccountSchema.BankAccount.create({
      accountNickname: args.accountNickname,
      user: mongoose.Types.ObjectId(decoded._id)
    });
  }
}

bankAccountSchema.setBankAccountDefault = {
  type: bankAccountSchema.BankAccountType,
  args: {
    token: { type: GraphQLNonNull(GraphQLString) },
    _id: { type: GraphQLNonNull(GraphQLID) },
    default: { type: GraphQLNonNull(GraphQLBoolean) }
  },
  resolve: async (parent, args) => {
    await index.checkLogin(args.token);

    return bankAccountSchema.BankAccount.findByIdAndUpdate(args._id, {
      default: args.default
    });
  }
}

bankAccountSchema.deleteBankAccount = {
  type: GraphQLBoolean,
  args: {
    token: { type: GraphQLNonNull(GraphQLString) },
    _id: { type: GraphQLNonNull(GraphQLID) }
  },
  resolve: async (parent, args) => {
    await index.checkLogin(args.token);

    bankAccountSchema.BankAccount.findByIdAndRemove(args._id)
      .then(() => {
        return true;
      })
      .catch(err => {
        reject(err);
      });
  }
}

module.exports = bankAccountSchema;