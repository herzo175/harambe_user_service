const graphql = require("graphql");
const crypto = require("crypto");
const jwt = require('jsonwebtoken');

const gql = require('./gql');
const index = require("./index");
const config = require("./config");

const passwordCipherAlg = config.passwordCipherAlg;
const passwordKey = config.passwordKey;

describe('user tests', () => {
  let id;

  beforeAll(done => {
    const userObj = { email: "testGqlEmail", password: "testPassword", firstName: "testFirstName", lastName: "testLastName" };

    index
      .register(userObj)
      .then(token => {
        const user = jwt.decode(token).user;
        id = user._id;
        done();
      })
      .catch(err => {
        throw err;
      });
  });

  test('should find the user that was created', done => {
    const query = `
      query FetchSomeIDQuery($id: ID!) {
          User(_id: $id) {
            firstName
            lastName
          }
    }`;
    const params = { id: id }
    const result = graphql.graphql(
      new graphql.GraphQLSchema({query: gql.RootQuery}), query, null, null, params);

    expect(result).resolves.toBeDefined();

    result
      .then(response => {
        console.log(response);
        expect(response.data.User.firstName).toBe('testFirstName');
        expect(response.data.User.lastName).toBe("testLastName");
        done()
      })
  });

  test('should successfully modify the password if passed', done => {
    const query = `
      mutation UpdateUser($_id: ID!, $email: String, $password: String) {
        updateUser(_id: $_id, email: $email, password: $password) {
          email
          password
        }
      }
    `;

    const params = { _id: id, password: 'newPassword' };

    const result = graphql.graphql(
      new graphql.GraphQLSchema({ query: gql.RootQuery, mutation: gql.Mutation }),
      query,
      null,
      null,
      params);

    expect(result).resolves.toBeDefined();

    result.then(response => {
      console.log(response);
      const decipher = crypto.createDecipher(passwordCipherAlg, passwordKey);
      expect(response.data.updateUser.email).toBe("testGqlEmail");
      expect(
        decipher.update(response.data.updateUser.password, "hex", "utf8") + decipher.final("utf8"))
        .toBe("newPassword");
      done();
    });
  });

  afterAll(done => {
    index
      .deleteUser(id)
      .then(() => done())
      .catch(err => {
        if (err) {
          throw err;
        }
      });
  });
})