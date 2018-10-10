const mongoose = require("mongoose");
const graphql = require("graphql");

const index = require("./index");

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
  GraphQLFloat,
  GraphQLEnumType,
  GraphQLScalarType
} = graphql;

let transactionSchema = {};

transactionSchema.transactionTypes = Object.freeze({
  DEPOSIT: 1,
  WITHDRAWL: 2
});

transactionSchema.transactionTypesSchema = new GraphQLEnumType({
  name: 'TransactionTypes',
  values: {
    DEPOSIT: { value: 1 },
    WITHDRAWL: { value: 2 }
  }
})

transactionSchema.Transaction = mongoose.model(
  "Transaction",
  new mongoose.Schema({
    date: Date,
    notes: String,
    type: Number,
    amount: Number,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  })
);

transactionSchema.TransactionType = new GraphQLObjectType({
  name: "Transaction",
  fields: () => ({
    _id: { type: GraphQLID },
    date: {
      type: new GraphQLScalarType({
        name: 'date',
        parseValue(value) {
          return new Date(value); // value from the client
        },
        serialize(value) {
          return value.getTime(); // value sent to the client
        },
        parseLiteral(ast) {
          if (ast.kind === Kind.INT) {
            return new Date(ast.value) // ast value is always in string format
          }
          return null;
        }
      })
    },
    notes: { type: GraphQLString },
    amount: { type: GraphQLFloat },
    type: { type: transactionSchema.transactionTypesSchema }
  })
});

transactionSchema.transactionQuery = {
  type: transactionSchema.TransactionType,
  args: {
    token: { type: GraphQLNonNull(GraphQLString) },
    _id: { type: GraphQLNonNull(GraphQLID) }
  },
  resolve: async (parent, args) => {
    const decoded = await index.checkLogin(args.token);
    return transactionSchema.Transaction.find({
      _id: args._id,
      user: decoded._id
    });
  }
};

// create deposit
// create withdrawl
transactionSchema.createTransaction = {
  type: transactionSchema.TransactionType,
  args: {
    token: { type: GraphQLNonNull(GraphQLString) },
    amount: { type: GraphQLNonNull(GraphQLFloat) },
    type: { type: GraphQLNonNull(transactionSchema.transactionTypesSchema) },
    notes: { type: GraphQLString }
  },
  resolve: async (parent, args) => {
    const decoded = await index.checkLogin(args.token);

    return transactionSchema.Transaction.create({
      type: args.type,
      amount: args.amount,
      notes: args.notes || "",
      user: mongoose.Types.ObjectId(decoded._id),
      date: Date.now()
    });
  }
}

module.exports = transactionSchema;
