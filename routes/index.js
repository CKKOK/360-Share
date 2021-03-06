var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const User = require('../models/user');
const cookieParser = require('cookie-parser');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: true })
const multer = require('multer');
// const upload = multer();
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './public/images')
  },
  filename: (req, file, callback) => {
    callback(null, file.fieldname + '-' + Date.now() + '-' + getExtension(file))
  }
});

function sessionChecker(req, res, next) {
  console.log('in session checker');
  console.log(req.session);
  console.log(req.cookies);
  if (req.session.user && req.cookies.user_sid) {
    req.session.loggedIn = true;
    next();
    // res.redirect('/');
  } else {
    next()
  }
}


function getExtension(file) {
  let res = '';
  if (file.mimetype === 'image/jpeg') {res = '.jpg'};
  if (file.mimetype === 'image/png') {res = '.png'};
  return res;
}

const upload = multer({
  storage: storage
})
// .fields([{
//   name: 'fileName',
//   maxCount: 1
// }]);

// const upload = multer({dest: '../public/images'});


/* GET home page. */
router.get('/', sessionChecker, function(req, res, next) {
  let loggedIn = false;
  console.log('in / now');
  if (req.session.user) {loggedIn = true};
  res.render('index', { title: 'Project Frappe', loggedIn: loggedIn });
});

router.post('/', upload.array(), function(req, res, next) {
  if (req.xhr || req.accepts('json', 'html')==='json'){
    console.log('worked');
    console.log(req.body);
  }
  res.send({success: true})
})

 

router.post('/fileUpload', function(req, res, next){
  console.log('trying to upload');
  if (!req.file) {
    console.log('No file received');
    return res.send({success: false});
  } else {
    console.log('file received');
    const host = req.host;
    const filePath = req.protocol + '://' + host + '/' + req.file.path;
    console.log(filePath);
    return res.send({success: true});
  }
})


module.exports = router;
