const express = require('express');
const router = express.Router();
const User = require('../models/user');
const cookieParser = require('cookie-parser');
// const bodyParser = require('body-parser');
// const jsonParser = bodyParser.json();
// const urlencodedParser = bodyParser.urlencoded({ extended: true })
const upload = require('multer')();
// const passport = require('passport');
// const LocalStrategy = require('passport-local').Strategy;
// const user = require('../models/user');
// passport.use(new LocalStrategy(
//   function(email, password, done) {
//     console.log('in local strategy');
//     User.authenticate(email, password, function(err, user){
//       return done(err, user)
//     })
//   }
// ));

// passport.serializeUser(function(user, done) {
//   console.log('serializing', user._id);
//   done(null, user._id);
// })
// passport.deserializeUser(function(id, done) {
//   user.findById(id, function(err, user){
//     console.log('deserializing', user._id);
//     done(err, user);
//   })
// })

// const ppinit = passport.initialize();
// const ppsess = passport.session();

router.post('/create', upload.array(), function(req, res, next) {
  if (req.body.password !== req.body.passwordConf) {
    let err = new Error('Passwords must match');
    err.status = 400;
    res.send('Passwords must match');
    return next(err);
  }

  if (req.body.email && req.body.username && req.body.password && req.body.passwordConf) {
  
    const userData = {
      email: req.body.email,
      username: req.body.username,
      password: req.body.password
    }
    User.create(userData, function(err, user) {
      if (err) {
        return next(err);
      } else {
        req.session.user = user;
        res.send({success: true})
      }
    })
  }
});



router.post('/login', upload.array(), function(req, res, next) {
  // passport.authenticate('local', (err, user, info) => {
  //   console.log('inside passport.authenticate callback');
  //   console.log('req.session.passport:', JSON.stringify(req.session.passport));
  //   console.log('req.user:', JSON.stringify(req.user));
  //   req.login(user, (err) => {
  //     console.log('in req.login() callback');
  //     console.log('req.session.passport:', JSON.stringify(req.session.passport));
  //     console.log('req.user:', JSON.stringify(req.user));
  //     console.log('err', err)
  //     res.send({success: true, name: user.username, inventory: user.inventory});
  //   })
  // });
  if (req.body.email && req.body.password) {
    User.authenticate(req.body.email, req.body.password, function(error,user){
      if (error || !user) {
        let err = new Error('Wrong email or password');
        err.status = 401;
        res.send({success: false, error: err})
      } else {
        req.session.user = user;
        User.findOne({email: req.body.email}).select('username inventory').exec(function(err, user){
          res.send({success: true, name: user.username, inventory: user.inventory});
        })
      }
    })
    
  } else {
    let err = new Error('Email and password needed');
    err.status = 400;
    res.send({success: false, error: err})
  }
});

router.get('/logout', function(req, res, next) {
  if (req.session) {
    req.session.destroy(function(err) {
      if (err) {
        return next(err);
      } else {
        res.send({success: true});
      }
    });
  }
});

module.exports = router;