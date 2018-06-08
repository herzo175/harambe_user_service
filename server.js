const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const index = require('./index');

const server = express();

server.use(bodyParser.json());
server.use(cors());

server.post('/register', (req, res) => {
  if (req.body && req.body.email && req.body.password) {
    index.register(req.body)
      .then(token => {
        res.send(token);
      })
      .catch(err => {
        console.error(err);
        // TODO: define error types, such as already exists user
        res.status(500).send('An error occured while registering the user');
      })
  } else {
    res.status(400).send('Missing form data');
  }
});

server.post('/login', (req, res) => {
  if (req.body && req.body.email && req.body.password) {
    index
      .login(req.body.email, req.body.password)
      .then(token => {
        res.send(token);
      })
      .catch(err => {
        console.error(err);
        res.status(500).send("An error occured while logging in user");
      });
  } else {
    res.status(400).send("Missing email or password");
  }
});

server.listen(8000, (err) => {
  if (err) {
    throw err;
  } else {
    console.log('listening on port', 8000);
  }
});