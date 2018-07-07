const graphql = require("graphql");

const userSchema = require("./userSchema");
const bankAccountSchema = require("./bankAccountSchema");

const {
  GraphQLObjectType
} = graphql;

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    User: userSchema.userQuery,
    BankAccount: bankAccountSchema.bankAccountQuery
  }
});

// TODO: move resolvers to another file
const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    register: userSchema.register,
    login: userSchema.login,
    setNotificationMethodEmail: userSchema.setNotificationMethodEmail,
    setNotificationMethodSms: userSchema.setNotificationMethodSms,
    setNotificationTopicAnnouncements: userSchema.setNotificationTopicAnnouncements,
    setNotificationTopicAccount: userSchema.setNotificationTopicAccount,
    createBankAccount: bankAccountSchema.createBankAccount,
    setBankAccountDefault: bankAccountSchema.setBankAccountDefault,
    deleteBankAccount: bankAccountSchema.deleteBankAccount
  }
});

module.exports = {
  RootQuery,
  Mutation
};
