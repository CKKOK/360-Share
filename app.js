var createError = require('http-errors');
var express = require('express');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/frappe');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){console.log('db connected')});
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var path = require('path');
var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

var logger = require('morgan');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


const user = require('./models/user');
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
  },
  function(email, password, done) {
    user.authenticate(email, password, function(err, user){
      done(err, user)
    })
  }
));
passport.serializeUser(function(user, done) {
  done(null, user._id);
})
passport.deserializeUser(function(id, done) {
  user.findById(id, function(err, user){
    done(err, user);
  })
})

app.use(passport.initialize());
app.use(passport.session());

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({
  secret: 'thenightisyoung',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}));

app.use(express.static(path.join(__dirname, 'public')));
const multer = require('multer');
const multerConfig = {
  storage: multer.diskStorage({
    destination: (req, file, next) => {
      next(null, './public/images');
    },
    filename: (req, file, next) => {
      console.log(file);
      const ext = file.mimetype.split('/')[1];
      next(null, file.fieldname + '-' + Date.now() + '.' + ext);
    }
  }),
  fileFilter: function(req, file, next) {
    if(!file){next();}
    const image = file.mimetype.startsWith('image/');
    if (image) {
      console.log('photo uploaded');
      next(null, true);
    } else {
      console.log('file not supported');
      return next();
    }
  }
};

var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

io.on('connection', function(socket) {
  socket.on('chatMsg', function(data){
    io.sockets.emit('chatMsg', data)
  });
});

app.post('/fileUpload', multer(multerConfig).single('photo'), function(req, res){
  if (!req.file) {
    console.log('No file received');
    return res.send({success: false});
  } else {
    console.log('file received');
    const host = req.hostname;
    const filePath = req.protocol + '://' + host + '/' + req.file.path;
    const fileToShare = '/images/' + req.file.path.split('/')[2];
    console.log(fileToShare);
    io.sockets.emit('newImg', {newImg: fileToShare});
    console.log('socket sent');
    return res.send({success: true});
  }
})

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = {app, server};
