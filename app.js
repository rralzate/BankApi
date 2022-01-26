// app.js
//'use strict';
var debug = require('debug')('FecurityAPI');
var express = require('express');
const compression = require('compression');
var cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
var bodyParser = require('body-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
const sslRedirect = require('heroku-ssl-redirect');
const passport = require('passport');
const lusca = require('lusca');
const logger =require('./config/logger');
/*
* Load environment variables from .env file, where API keys and passwords are configured.
*/
dotenv.load({ path: '.env.local' });

/**
* API keys and Passport configuration.
*/
const extendTimeoutMiddleware = (req, res, next) => {
  const space = ' ';
  let isFinished = false;
  let isDataSent = false;

  // Only extend the timeout for API requests
  if (!req.url.includes('/api')) {
    next();
    return;
  }

  res.once('finish', () => {
    isFinished = true;
  });

  res.once('end', () => {
    isFinished = true;
  });

  res.once('close', () => {
    isFinished = true;
  });

  res.on('data', (data) => {
    // Look for something other than our blank space to indicate that real
    // data is now being sent back to the client.
    if (data !== space) {
      isDataSent = true;
    }
  });

  const waitAndSend = () => {
    setTimeout(() => {
      // If the response hasn't finished and hasn't sent any data back....
      if (!isFinished && !isDataSent) {
        // Need to write the status code/headers if they haven't been sent yet.
        if (!res.headersSent) {
          res.writeHead(202);
        }

        res.write(space);

        // Wait another 15 seconds
        waitAndSend();
      }
    }, 15000);
  };

  waitAndSend();
  next();
};
var app = express();
app.use(bodyParser.json({limit:'100mb'}));



app.use(cookieParser());
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
//var db = require('./dbSQL');
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  //store: new MongoStore({  mongooseConnection: mongoose.connection })
}));
app.use(passport.initialize());
app.use(passport.session());
 
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
//app.use(extendTimeoutMiddleware);
app.all('/*', function(req, res, next) {
    // CORS headers
    res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    // Set custom headers for CORS
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
       
    if (req.method == 'OPTIONS') {
      res.status(200).end();
    } else {
      next();
    }
  });
// enable ssl redirect
app.use(sslRedirect());

  // Auth Middleware - This will check if the token is valid
// Only the requests that start with /api/v1/* will be checked for the token.
// Any URL's that do not follow the below pattern should be avoided unless you 
// are sure that authentication is not needed
app.all('/api/v1/*', [ require('./middlewares/validateRequest')]);
app.all('/api/auth/*', [ require('./middlewares/validateRequest')]);
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json( {
        message: err.message,
        error: {}
    });
});



app.set('port',  process.env.PORT || 3001); 
app.set('host',  process.env.HOST || "localhost"); 


//var UserController = require('./user/usercontroller');
app.use('/', require('./routes'));



// If no route is matched by now, it must be a 404
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  var server = app.listen(app.get('port'), function() {
    console.log('Bank server listening on port ' + server.address().port);
  });
  server.timeout = 240000;  
module.exports = app;
