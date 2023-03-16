//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const port = 3000;
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});


userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields:["password"] });

const User = new mongoose.model("User", userSchema);

app.get("/", (req,res)=>{
  res.render("home");
})

app.get("/login", (req,res)=>{
  res.render("login", {errMsg: "", username: "", password:""});
})

app.get("/register", (req,res)=>{
  res.render("register");
})

app.post("/register",(req,res)=>{
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });

  newUser.save().then(function(){
    res.render("secrets");
  }).catch(function(err){
    console.log(err);
  });
})

app.post("/login", (req,res)=>{
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username}).then((foundUser)=>{
    if (foundUser){
      if (foundUser.password === password){
        res.render("secrets");
        console.log(`New login ${username}`);
      } else {
        res.render("login", {errMsg: "Email or password incorrect", username: "", password: ""});
      }
    } res.render("login", {errMsg: "Email or password incorrect", username: "", password: ""});
  }).catch((err)=>{
    console.log(err);
  });
})

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
