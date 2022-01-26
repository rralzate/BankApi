// UserController.js
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
const async = require('async');
const crypto = require('crypto');
const passport = require('passport');
const User = require('./User');
var jwt = require('jwt-simple');
const passportConfig = require('../config/passport');
var logger =require('../config/logger');


router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

function expiresIn(numDays) {
    var dateObj = new Date();
    return dateObj.setDate(dateObj.getDate() + numDays);
  }
  
  
  function genToken(user) {
    var timeExp=parseInt(process.env.EXPIRATION_TOKEN_DAYS);
    var expires = expiresIn(timeExp); // 7 days
    var token = jwt.encode({
      exp: expires
    }, require('../config/secret')());
  
    return {
      token: token,
      expires: expires,
      user: user
    };
  }


// CREATES A NEW USER
exports.insertUser= (req, res) =>{

    req.assert('email', 'Email is not valid').isEmail();
    // req.assert('password', 'Password must be at least 4 characters long').len(4);
     //req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
     req.sanitize('email').normalizeEmail({ remove_dots: false });
   
     const errors = req.validationErrors();
    //If error return 
     if (errors) {
   
         res.status(401);
        res.json({
         "status": 401,
         "message": "Some errors",
         "errors": errors
       });
      
       return;
     }
     //Create user obet
     var expires = expiresIn(7); // 7 days
     var token = jwt.encode({
       exp: expires
     }, require('../config/secret')());
   
   
   
  
        //Validate user existing (Control all functions)
    User.findOne({ email: req.body.email }, (err, existingUser) => {
    if (err) { return next(err); }
      
      if (existingUser) 
      {
       
       res.status(401);
       res.statusMessage="Ya existe una cuenta de usuario asociada a este email";
      
       res.json({
          "status": 401,
          "message": "Ya existe una cuenta de usuario asociada a este email",
          "errors": "Ya existe una cuenta de usuario asociada a este email"
        }
        
        );
       res.end();
      return;
     }//fin if existingUser
   
 
      const user = new User({
        name : req.body.name,
        email : req.body.email,
        password : req.body.password,
        publicKey:req.body.publicKey,
        privateKey:req.body.privateKey,
      

      });
    //Async generate tokenpassword, sendmail, save
      async.waterfall([
        //1. Create ramdom token
        function createRandomToken(done) {
          crypto.randomBytes(16, (err, buf) => {
            const token = buf.toString('hex');
           // console.log("Token:"+token);
            done(err, token);
          });
        },
        //2. setRandomToken to user
        function setRandomToken(token, done) {
      
            user.passwordResetToken = token;
            user.passwordResetExpires = Date.now() + 3600000; // 1 hour
          //  console.log("passwordResetExpires:"+ user.passwordResetExpires);
            done( null,token);
        
        },
        //3. Save user
        function saveUser(token,done)
        {
          user.save((err) => {
          
            //console.log("user create:"+user);
            done(err,token,user);
          });
        
        }

      ], 
      (err) => {
        if (err) 
        {  res.status(500);
          res.json({
                "status": 201,
                "message": "There was a problem adding the information to the database.",
                "errors": err
              });
              return; 
        }
        
        logger.info("USER CREATED!!");
        //if everything is ok, send user create.
        res.send(200,{"message": "User created OK"});  
        
      });

  });  //FIN IF findone user existin


   /* User.create({
            name : req.body.name,
            email : req.body.email,
            password : req.body.password,
            publicKey:req.body.publicKey
        }, 
        function (err, user) {
            if (err) return res.status(500).send("There was a problem adding the information to the database.");
            res.status(200).send(user);
        });*/
};


// RETURNS ALL THE USERS IN THE DATABASE
exports.getAllUsers= (req, res) => {
    User.find({}, function (err, users) {
        if (err) return res.status(500).send("There was a problem finding the users.");
        res.status(200).send(users);
    });
};


// DELETES A USER FROM THE DATABASE
exports.deleteUser= (req, res)=> {
    User.findByIdAndRemove(req.params.id, function (err, user) {
        if (err) return res.status(500).send("There was a problem deleting the user.");
        res.status(200).send("User "+ user.name +" was deleted.");
    });
};

// UPDATES A SINGLE USER IN THE DATABASE
exports.updateUser= (req, res) =>{
    
    User.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, user) {
        if (err) return res.status(500).send("There was a problem updating the user.");
        res.status(200).send(user);
    });
};
// LOGIN
exports.login= (req, res,next) =>{
   
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password cannot be blank').notEmpty();
    req.sanitize('email').normalizeEmail({ remove_dots: false });
    //console.log(req.body.email);
    const errors = req.validationErrors();
  
    if (errors) {
      res.status(401);
      res.json({
        "status": 401,
        "message": "Invalid credentials",
        "errors": errors
      });
      return;
    }
  
    passport.authenticate('local', (err, user, info) => {
      if (err) { return next(err); }
      if (!user )// || user.passwordResetToken)
       {
        res.status(401);
        res.json({
          "status": 401,
          "message": "Invalid credentials"
        });
        return;
  
      }
      res.json(genToken(user));
      /*req.logIn(user, (err) => {
        if (err) { return next(err); }
        //var userResult=validateuser(user.email)
        res.json(genToken(user));
      });*/
    })(req, res, next);

};


  
//module.exports = router;