var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',

  // initialize: function() {
  //   this.on('creating', function(model, attrs, options) {
  //     var salt = bcrypt.genSaltSync();
  //     bcrypt.hash(attrs.password, salt, null, function(err, res) {
  //       model.set('password', res);
  //       model.set('username', attrs.username);
  //       model.set('salt', salt);
  //       model.save()
  //         .then(function() {console.log("success"); process.exit(0);})
  //         .catch(function(e){
  //           console.log('error is ' + e);
  //         });
  //     });
  //   });
  // },

  auth: function(password, cb) {
    var salt = this.get('salt');
    var model = this;
    console.log("this is " + this);
    bcrypt.hash(password, salt, null, function(err, res) {
      cb(model.get('password') === res)
    })
  }
});

module.exports = User;