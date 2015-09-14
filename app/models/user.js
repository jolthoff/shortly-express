var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',

  initialize: function(username, password) {
    this.on('creating', function(model, attrs, options) {
      var hash = bcrypt.hash(password, null, null, function(err, res) {
        model.set('password', hash);
        model.set('username', username);
      })
    });
  }
});

module.exports = User;