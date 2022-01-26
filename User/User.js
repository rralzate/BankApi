// User.js
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');
var encrypt = require('mongoose-encryption');
//var autopopulate=require('mongoose-autopopulate');

const userSchema = new mongoose.Schema({  
  name: String,
  email: { type: String, unique: true },
  password: String,
  NombreEsquema:{ type: String, unique: true},
  IsAdmin: Boolean,
  passwordResetToken: String,
  passwordResetExpires: Date,

 
}, { timestamps: true });
//userSchema.plugin(autopopulate);
/*var encKey = process.env.HORNTAIL_ENCDB32;
var sigKey = process.env.HORNTAIL_ENCDB64;
userSchema.plugin(encrypt, { encryptionKey: encKey, signingKey: sigKey,decryptPostSave: false,    encryptedFields: ['publicKey','privateKey'],excludeFromEncryption: ['passwordResetToken','email'], additionalAuthenticatedFields: ['publicKey','privateKey','email'] });

*/
/**
 * Password hash middleware.
 */

userSchema.pre('save', function save(next) {
  const user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

const user=mongoose.model('User', userSchema);
module.exports =user;