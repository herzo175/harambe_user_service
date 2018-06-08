const jwt = require('jsonwebtoken');
const crypto = require("crypto");

const index = require("./index");
const config = require('./config');

const jwtKey = config.jwtKey;
const passwordCipherAlg = config.passwordCipherAlg;
const passwordKey = config.passwordKey;

describe('register', () => {
  test ('should create a user and return a valid jwt', done => {
    const userObj = {
      email: 'testEmail',
      password: 'testPassword',
      firstName: 'testFirstName',
      lastName: 'testLastName'
    };

    index.register(userObj)
      .then(token => {
        const decipher = crypto.createDecipher(passwordCipherAlg, passwordKey);
        const user = jwt.verify(token, jwtKey).user;

        expect(user.email).toBe('testEmail');
        expect(
          decipher.update(user.password, "hex", "utf8") + decipher.final("utf8"))
          .toBe("testPassword");

        //test delete user
        index.deleteUser(user._id)
          .then(res => {
            expect(res).toBe('user successfully deleted');
            done();
          })
          .catch(err => {
            throw err;
          });
      })
      .catch(err => {
        throw err;
      });
  });

  test("should not work with incorrect username or password types", () => {
    const userObj = {
      email: null,
      password: 0,
      firstName: '1',
      lastName: undefined
    }

    const result = index.register(userObj);

    expect(result).rejects.toBe("first name, last name, email, and password must be strings");
  });
})

describe('checkLogin', () => {
  test('should return data for valid token', () => {
    const token = jwt.sign({
      exp: Math.floor(Date.now() / 1000) + (60 * 60),
      foo: 'bar'
    }, jwtKey)

    index.checkLogin(token, (err, result) => {
      expect(err).toBe(null);
      expect(result.foo).toBe('bar');
    });
  });

  test('should return false for an invalid', () => {
    const token = jwt.sign({
      exp: Math.floor(Date.now() / 1000) - (60 * 60)
    }, 'wrong-key')

    index.checkLogin(token, (err, result) => {
      expect(err.message).toBe('invalid signature');
      expect(result).toBe(null);
    });
  });

  test('should return false for an expired token', () => {
    const token = jwt.sign({
      exp: Math.floor(Date.now() / 1000) - (60 * 60)
    }, jwtKey)

    index.checkLogin(token, (err, result) => {
      expect(err.message).toBe('jwt expired');
      expect(result).toBe(null);
    });
  });
});

describe('login', () => {
  let id;

  beforeAll(done => {
    const userObj = {
      email: 'testEmail',
      password: 'testPassword',
      firstName: 'testFirstName',
      lastName: 'testLastName'
    }

    index.register(userObj)
      .then(token => {
        const user = jwt.verify(token, jwtKey).user;
        id = user._id;
        done();
      })
      .catch(err => {
        throw err;
      });
  });

  test('should return a valid token when given correct login information', done => {
    const username = 'testEmail';
    const password = 'testPassword';

    index.login(username, password)
      .then(token => {
        const decoded = jwt.verify(token, jwtKey).user;

        expect(decoded.email).toBe(username);
        done();
      })
      .catch(err => {
        expect(err).toBe(null);
        done();
      });
  });

  test('should not work with incorrect username or password types', () => {
    const username = null;
    const password = 0;

    const result = index.login(username, password);

    expect(result).rejects.toBe("email and password must be strings");
  });

  test("should not work with incorrect username or password", () => {
    const username = 'abc';
    const password = 'def';

    const result = index.login(username, password);

    expect(result).rejects.toMatch('incorrect username or password');
  });

  afterAll(done => {
    index.deleteUser(id)
      .then(() => done())
      .catch(err => {
        if (err) {
          throw err;
        }
      });
  });
});

describe('delete', () => {
  test('should not break when deleting imaginary ids', () => {
    const id = "555555555555555555555555";
    const result = index.deleteUser(id);

    expect(result).resolves.toBeDefined();
  });
})