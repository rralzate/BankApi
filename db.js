// db.js
var mongoose = require('mongoose');
const logger =require('./config/logger');
var options = {
    user: process.env.MONGOLAB_USER,
    pass: process.env.MONGOLAB_KEY,
    authMechanism:'SCRAM-SHA-1'
  }

mongoose.set('debug', function (collectionName, method, query, doc, options) {
    console.log("Query mongodb:"+ JSON.stringify(query));
   });
mongoose.connect(process.env.MONGODB_URI,options);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection Error with' + process.env.MONGODB_URI +":"));
db.once('open', function(){
   logger.info('Connection ok!');
});
    
