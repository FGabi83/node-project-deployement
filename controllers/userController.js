const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
    res.render('login', { title: 'Login' });
};

exports.registerForm = (req, res) => {
    res.render('register', { title: 'Register' });
};

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name'); // sanitizeBody is a method provided by expressValidator
  req.checkBody('name', 'You must supply a name!').notEmpty(); // checkBody is a method provided by expressValidator
  req.checkBody('email', 'That email is not valid!').isEmail();
  req.sanitizeBody('email').normalizeEmail({ // sanitizeBody is a method provided by expressValidator
    remove_dots: false,
    gmail_remove_dots: false, // remove_dots: false didnt do the trick, so I added this line
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'Password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Confirmed password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Ooops! Your passwords do not match!').equals(req.body.password);

  const errors = req.validationErrors(); // validationErrors is a method provided by expressValidator
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
    return;
  }
  next(); // there were no errors!
};

exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  const register = promisify(User.register, User); // User.register is a method provided by passportLocalMongoose 
  await register(user, req.body.password);
  next(); // pass to authController.login
};

exports.account = (req,res) => {
  res.render('account', { title: 'Edit Your Account' });
}

exports.updateAccount = async (req,res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email
  }; 
  const user = await User.findOneAndUpdate(
    { _id: req.user._id }, // query
    { $set: updates }, // updates
    { new: true, runValidators: true, context: 'query' } // options
  ); 
  req.flash('success', 'Updated the profile!');
  res.redirect('back');
};