const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: true })
const upload = require('multer')();
const passport = require('passport');

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
        req.session.userId = user._id;
        res.send({success: true})
      }
    })
  }
});

router.post('/login', upload.array(), function(req, res, next) {
  if (req.body.email && req.body.password) {
    User.authenticate(req.body.email, req.body.password, function(error,user){
      if (error || !user) {
        let err = new Error('Wrong email or password');
        err.status = 401;
        res.send({success: false, error: err})
      } else {
        req.session.userId = user._id;
        User.findOne({email: req.body.email}).select('username inventory').exec(function(err, user){
          res.send({success: true, name: user.username, inventory: user.inventory});
        })
      }
    })
    passport.authenticate('local', {});
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
