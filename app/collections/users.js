var db = require('../config');
var User = require('../models/user');
var bcrypt = require('bcrypt-nodejs');

var Users = new db.Collection();

Users.model = User;
Users.fetch();

Users.authenticate = function(username, password, cb) {
  var matching = this.findWhere({'username': username});
  console.log("matching is " + matching);
  if (matching) {
    matching.auth(password, cb);
  } else {
    cb(false);
  }

}

Users.unique = function(username, password, cb) {
  if (this.where({'username': username})[0]) {
    cb(false);
  } else {
    var salt = bcrypt.genSaltSync();
    var collection = this;
    bcrypt.hash(password, salt, null, function(err, res) {
      collection.create({'username': username, 'password': res, 'salt': salt})
        .then(function() {
          cb(true);
        });
    });
  }
}

module.exports = Users;
