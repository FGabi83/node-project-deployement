const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser()); // User.serializeUser is a method provided by passportLocalMongoose
passport.deserializeUser(User.deserializeUser()); // User.deserializeUser is a method provided by passportLocalMongoose