//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const port = 3000;
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(express.static('public'));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done)=>{
  process.nextTick(function(){
    done(null, {id: user._id, username: user.username});
  });
})
passport.deserializeUser((user,done)=>{
  process.nextTick(()=>{
    return done(null,user);
  })
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOne({ googleId: profile.id }).then((foundUser) => {
        if (foundUser) {
          return foundUser;
        } else {
          const newUser = new User({
            googleId: profile.id
          });
          return newUser.save();
        }
      }).then((user) => {
        return cb(null, user);
      }).catch((err) => {
        return cb(err);
      });
  }
));

app.get("/", (req, res) => {
  res.render("home");
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

app.get("/login", (req, res) => {
  res.render("login", {
    errMsg: "",
    username: "",
    password: ""
  });
})

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
})

app.post("/register", (req, res) => {
  User.register({
    username: req.body.username
  }, req.body.password).then((user) => {
    passport.authenticate("local")(req, res, function() {
    res.redirect("/secrets")
    })
  }).catch((err) => {
    console.log(err);
    res.redirect("/register");
  });
});

app.post("/login", passport.authenticate("local", {failureRedirect: '/login'}), (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, (err) => {
		if (err) {
			console.log(err);
      res.render("login", {errMsg: "Email or password incorrect", username: "", password: ""});
		} else {
			passport.authenticate("local")(req, res, function() {
			res.redirect("/secrets");
			});
		}
	});
});

app.get("/logout", (req, res, next) => {
	req.logout(function(err) {
		if (err) {
			return next(err);
		}
		res.redirect('/');
	});
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
