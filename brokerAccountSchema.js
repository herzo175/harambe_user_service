const mongoose = require("mongoose");
const graphql = require("graphql");
const axios = require("axios");

const index = require("./index");
const config = require("./config");

const tradeItEndpoint = "https://ems.qa.tradingticket.com/api/v2/";

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList
} = graphql;

let brokerAccountSchema = {};

brokerAccountSchema.BrokerAccount = mongoose.model(
  "BrokerAccount",
  new mongoose.Schema({
    brokerName: String,
    default: { type: Boolean, default: false },
    userId: { type: String },
    userToken: { type: String },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  })
);

brokerAccountSchema.BrokerAccountType = new GraphQLObjectType({
  name: "BrokerAccount",
  fields: () => ({
    _id: { type: GraphQLID },
    brokerName: { type: GraphQLString },
    default: { type: GraphQLBoolean },
    userId: { type: GraphQLString },
    userToken: { type: GraphQLString}
  })
});

brokerAccountSchema.brokerAccountQuery = {
  type: brokerAccountSchema.BrokerAccountType,
  args: {
    token: { type: GraphQLNonNull(GraphQLString) },
    _id: { type: GraphQLNonNull(GraphQLID) }
  },
  resolve: async (parent, args) => {
    const decoded = await index.checkLogin(args.token);
    return brokerAccountSchema.BrokerAccount.find({_id: args._id, user: decoded._id});
  }
}

brokerAccountSchema.createBrokerLoginUrl = {
  type: GraphQLString,
  args: {
    broker: { type: GraphQLNonNull(GraphQLString) }
  },
  resolve: (parent, args) => {
    return new Promise((resolve, reject) => {
      const url = tradeItEndpoint + "user/getOAuthLoginPopupUrlForWebApp";
      axios.post(url, {apiKey: config.tradeItApiKey, broker: args.broker})
        .then(response => {
          if (response.data.status === "SUCCESS") {
            resolve(response.data.oAuthURL);
          } else {
            reject(response);
          }
        })
        .catch(err => {
          reject(err);
        });
    })
  }
}

brokerAccountSchema.listBrokers = {
  type: new GraphQLList(GraphQLString),
  resolve: async () => {
    const url = tradeItEndpoint + "preference/getBrokerList";
    const brokers = await axios.post(url, {apiKey: config.tradeItApiKey});
    return brokers.data.brokerList.map(b => b.shortName);
  }
}

brokerAccountSchema.createBrokerAccount = {
  type: brokerAccountSchema.BrokerAccountType,
  args: {
    brokerName: { type: GraphQLNonNull(GraphQLString) },
    oAuthVerifier: { type: GraphQLNonNull(GraphQLString) },
    token: { type: GraphQLNonNull(GraphQLString) }
  },
  resolve: (parent, args) => {
    return new Promise((resolve, reject) => {
      index.checkLogin(args.token)
        .then(decoded => {
          const url = tradeItEndpoint + "user/getOAuthAccessToken";

          axios.post(url, {apiKey: config.tradeItApiKey, oAuthVerifier: args.oAuthVerifier})
            .then(res => {
              resolve(brokerAccountSchema.BrokerAccount.create({
                brokerName: args.brokerName,
                userId: res.data.userId,
                userToken: res.data.userToken,
                user: mongoose.Types.ObjectId(decoded._id)
              }));
            });
        })
        .catch(err => {
          reject(err)
        });
    });
  }
}

brokerAccountSchema.setBrokerAccountDefault = {
  type: brokerAccountSchema.BrokerAccountType,
  args: {
    token: { type: GraphQLNonNull(GraphQLString) },
    _id: { type: GraphQLNonNull(GraphQLID) },
    default: { type: GraphQLNonNull(GraphQLBoolean) }
  },
  resolve: async (parent, args) => {
    await index.checkLogin(args.token);

    return brokerAccountSchema.BrokerAccount.findByIdAndUpdate(args._id, {
      default: args.default
    });
  }
}

brokerAccountSchema.deleteBrokerAccount = {
  type: GraphQLBoolean,
  args: {
    token: { type: GraphQLNonNull(GraphQLString) },
    _id: { type: GraphQLNonNull(GraphQLID) }
  },
  resolve: async (parent, args) => {
    await index.checkLogin(args.token);

    brokerAccountSchema.BrokerAccount.findByIdAndRemove(args._id)
      .then(() => {
        return true;
      })
      .catch(err => {
        reject(err);
      });
  }
}

module.exports = brokerAccountSchema;