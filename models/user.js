const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    require: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  inventory: {
    type: [String]
  }
});

UserSchema.pre('save', function(next){
  var user = this;
  bcrypt.hash(user.password, 10, function(err, hash){
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  })
});

UserSchema.statics.authenticate = function(email, password, callback) {
  console.log('in user.authenticate', email, password);
  User.findOne({email: email})
    .exec(function(err, user){
      if (err) {
        return callback(err)
      } else if (!user) {
        var err = new Error('No user found');
        err.status = 401;
        return callback(err);
      }
      bcrypt.compare(password, user.password, function(err, result){
        if (result === true) {
          console.log(user, 'authenticated');
          return callback(null, user);
        } else {
          return callback();
        }
      })
    })
}

const User = mongoose.model('User', UserSchema);

module.exports = User;
