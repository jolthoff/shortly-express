var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var session = require('express-session');
// var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var db = require('./app/config');
var uid = require('uuid');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var checkUser = function(req, res, next){
  if (req.path === '/login' || req.path === '/signup') {
    next();
  } else if (!req.session.auth) {
    res.render('login')
  } else {
    next();
  }
};

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
app.use(session({
  genid: function(req) {
    return uid.v4() // use UUIDs for session IDs 
  },
  secret: 'keyboard cat',
  saveUninitialized: false,
  resave: false,
  cookie: {secure: false,
          maxAge: 10000000,
          auth: false
        }
}));

var createUser = function(username, req, res) {
  req.session['username'] = username;
  req.session['auth'] = true;
  res.render('index');
}

// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(checkUser);
app.use(function(req, _, next) {
  console.log("request session is " + req.session.auth);
  console.log("request session is " + req.session);

  next();
});

app.get('/', function(req, res) {
  // if (!req.session.cookie.authenticated) {
  //   res.render('login')
  // } else {
    res.render('index');
  // }
});

app.get('/create', 
function(req, res) {
  res.render('index');
});

app.get('/links', 
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          base_url: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/login', function(req, res) {
   res.render('login')
});

app.get('/signup', function(req, res) {
   res.render('signup')
});

app.post('/signup', function(req, res) {
  Users.unique(req.body.username, req.body.password, function(created) {
    if (created) {
      createUser(req.body.username, req, res);
    } else {
      res.render('signup');
    }
  });

});

app.post('/login', function(req, res) {
  Users.authenticate(req.body.username, req.body.password, function(real) {
    if (real) {
      req.session.regenerate(function(err) {
        createUser(req.body.username, req, res);
      })
    } else {
      res.render('login');
    }
  })
})

app.get('/logout',
function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  req.session.destroy(function(){
    res.redirect('login');
  });
 
})



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits')+1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
