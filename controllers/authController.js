const passport = require("passport");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const promisify = require("es6-promisify");
const mail = require('../handlers/mail')

exports.login = passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: "failed Login",
  successRedirect: "/",
  successFlash: "You are now Logged In",
});

exports.logout = (req, res) => {
  req.logout();

  req.flash("success", "you are now logged out");

  res.redirect("/");
};

exports.isLoggedIn = (req, res, next) => {
  //chech if user is auth

  if (req.isAuthenticated()) {
    next();
    return;
  }
  req.flash("error", "Oops Must be logged in to do that!");
  res.redirect("/login");
};

exports.forgot = async (req, res) => {
  //1 see if email exists

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    req.flash("error", "You do Not Have an account please register");
    return res.redirect("/login");
  }

  //2 if email reset password token

  user.resetPasswordToken = crypto.randomBytes(20).toString("hex");
  user.resetPasswordTokenExpires = Date.now() + 3600000;

  await user.save();

  //3 send email with token

  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;

   await mail.send({
      user,
      subject: 'Password Reset',
      resetURL,
      filename: 'password-reset'

  })


  req.flash("success", `You have emailed password email reset link`);

  //4 redirect to login page

  res.redirect("/login");
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash("error", "Password reset token is invalid or has expired");
    return res.redirect("/login");
  }

  // if there is a user show the reset form

  res.render("reset", { title: "Reset Your Password" });

  // update new password
};

exports.confirmPasswords = (req, res, next) => {
  if (req.body.password === req.body["password-confirm"]) {
    next();
    return;
  }
  req.flash("error", "Passwords Do Not Match");
  res.redirect("back");
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash("error", "Password reset token is invalid or has expired");
    return res.redirect("/login");
  }

  const setPasword = promisify(user.setPassword, user);

  await setPasword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpires = undefined;

  const updatedUser = await user.save();

  await req.login(updatedUser);

  req.flash("success", "Your password has been reset");

  res.redirect("/");
};
