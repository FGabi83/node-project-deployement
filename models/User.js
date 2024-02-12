const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5'); //hashing function
const validator = require('validator'); //validate email
const mongodbErrorHandler = require('mongoose-mongodb-errors'); //better error handling
const passportLocalMongoose = require('passport-local-mongoose'); //handles password hashing and salting


const userSchema = new Schema({
  email: {
    type: String,
    unique: true, 
    lowercase: true, //converts email to lowercase
    trim: true, 
    validate: [validator.isEmail, 'Invalid Email Address'], 
    required: 'Please supply an email address'
  },
  name: {
    type: String,
    required: 'Please supply a name',
    trim: true 
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  hearts: [
    { type: mongoose.Schema.ObjectId, ref: 'Store' }
  ]
});

userSchema.virtual('gravatar').get(function() {
  const hash = md5(this.email); //this refers to the user
  return `https://gravatar.com/avatar/${hash}?s=200`;
}); //virtual field

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' }); //adds a username field to our schema
userSchema.plugin(mongodbErrorHandler); //handles errors better

module.exports = mongoose.model('User', userSchema);