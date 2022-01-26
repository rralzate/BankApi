//'use strict'
const winston = require('winston');
const fs = require('fs');
const env = process.env.NODE_ENV || 'development';
const logDir = 'log';
// Create the log directory if it does not exist
var logger=null;
function configureLog()
{
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  const tsFormat = () => (new Date()).toLocaleTimeString();
   logger = winston.createLogger({
    transports: [
      // colorize the output to the console
      new winston.transports.Console(),
      new winston.transports.File({
        filename: `${logDir}/results.log`,
        timestamp: tsFormat,
        level: env === 'development' ? 'debug' : 'info'
      })
    ] ,exitOnError: false, // do not exit on handled exceptions
  });
}
exports.debug= (msg)=> { 
    configureLog();
    logger.debug(msg);
};

exports.info= (msg)=>{
    configureLog();
    logger.debug(msg);
};

exports.warn= (msg)=>{
    configureLog();
    logger.debug(msg);
};