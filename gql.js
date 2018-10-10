const graphql = require("graphql");

const userSchema = require("./userSchema");
const brokerAccountSchema = require("./brokerAccountSchema");
const transactionSchema = require("./transactionSchema");

const {
  GraphQLObjectType
} = graphql;

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    User: userSchema.userQuery,
    BrokerAccount: brokerAccountSchema.brokerAccountQuery,
    Transaction: transactionSchema.transactionQuery
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
    listBrokers: brokerAccountSchema.listBrokers,
    createBrokerLoginUrl: brokerAccountSchema.createBrokerLoginUrl,
    createBrokerAccount: brokerAccountSchema.createBrokerAccount,
    setBrokerAccountDefault: brokerAccountSchema.setBrokerAccountDefault,
    deleteBrokerAccount: brokerAccountSchema.deleteBrokerAccount,
    createTransaction: transactionSchema.createTransaction
  }
});

module.exports = {
  RootQuery,
  Mutation
};
