const express = require("express");
const expressGraphQL = require("express-graphql");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const { GraphQLSchema } = require('graphql');

const index = require("./index");
const config = require("./config");
const gql = require("./gql");

const server = express();
const port = config.port || 8000;

mongoose.connect(config.dbURL);

server.use(bodyParser.json());
server.use(cors());

server.use(
  "/graphql",
  expressGraphQL({
    schema: new GraphQLSchema({
      query: gql.RootQuery,
      mutation: gql.Mutation
    }),
    graphiql: true
  })
);

server.listen(port, err => {
  if (err) {
    throw err;
  } else {
    console.log("listening on port", port);
  }
});
