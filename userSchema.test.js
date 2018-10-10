const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const graphql = require("graphql");

const config = require("./config");
const userSchema = require("./userSchema");
const gql = require("./gql");

mongoose.connect(config.dbURL);

const userObj = {
  email: "testUserEmail",
  password: "testPassword",
  firstName: "abc",
  lastName: "def"
};

describe("userSchema tests", () => {
  let token = "";
  let _id = "";

  // test create user
  beforeAll(done => {
    const query = `
      mutation CreateUser($email: String!, $firstName: String!, $lastName: String!, $password: String!) {
          register(email: $email, firstName: $firstName, lastName: $lastName, password: $password) 
    }`;

    const params = {
      email: userObj.email,
      firstName: userObj.firstName,
      lastName: userObj.lastName,
      password: userObj.password
    };

    const result = graphql.graphql(
      new graphql.GraphQLSchema({
        query: gql.RootQuery,
        mutation: gql.Mutation
      }),
      query,
      null,
      null,
      params
    );

    result
      .then(response => {
        token = response.data.register;
        console.log(jwt.decode(token));
        _id = jwt.decode(token)._id;
        done();
      })
      .catch(err => {
        console.log(err);
      });
  });

  test("should find the user that was just created by token", async () => {
    const query = `
      query FindUser($token: String!) {
          User(token: $token) {
            email
            firstName
            lastName
          } 
    }`;

    const params = { token };

    const result = await graphql.graphql(
      new graphql.GraphQLSchema({
        query: gql.RootQuery,
        mutation: gql.Mutation
      }),
      query,
      null,
      null,
      params
    );

    expect(result.data.User.email).toEqual(userObj.email);
    expect(result.data.User.firstName).toEqual(userObj.firstName);
  });

  test("should be able to login as the user and recieve a valid token", async () => {
    const query = `
      mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) 
    }`;

    const params = { email: userObj.email, password: userObj.password };

    const result = await graphql.graphql(
      new graphql.GraphQLSchema({
        query: gql.RootQuery,
        mutation: gql.Mutation
      }),
      query,
      null,
      null,
      params
    );

    const decoded = jwt.decode(result.data.login);

    expect(decoded._id).toEqual(_id);
    expect(decoded.exp).toBeGreaterThanOrEqual(Date.now());
  });

  test("should be able to a notification", async () => {
    const query = `
      mutation SetNotification($token: String!, $allow: Boolean!) {
          setNotificationMethodEmail(token: $token, allow: $allow) {
            notifications {
              methods {
                email
              }
            }
          }
    }`;

    const params = { token: token, allow: true };

    const result = await graphql.graphql(
      new graphql.GraphQLSchema({
        query: gql.RootQuery,
        mutation: gql.Mutation
      }),
      query,
      null,
      null,
      params
    );

    expect(
      result.data.setNotificationMethodEmail.notifications.methods.email
    ).toBe(true);
  });

  afterAll(() => {
    userSchema
      .delete(_id)
      .then(result => {
        console.log("deleted sucessfully:", result);
      })
      .catch(err => {
        console.log("error deleting user:", err);
      });
  });
});
