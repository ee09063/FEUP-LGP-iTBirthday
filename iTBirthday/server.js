var credentials = {
  clientID: "6b8183f7-0d61-4fa9-8909-6bc421331ce4",
  clientSecret: "ggMy0Y0HMjzUUZumTceGYDB",
  site: "https://login.microsoftonline.com/common",
  authorizationPath: "/oauth2/v2.0/authorize",
  tokenPath: "/oauth2/v2.0/token"
}

var application_root = __dirname,
    express = require("express"),
    path = require("path"),
    mongoose = require("mongoose"),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    nodemailer = require('nodemailer'),
    CronJob = require('cron').CronJob,
    fs = require('fs-extra'), // File System - for file manipulation
    busboy = require('connect-busboy'), //middleware for form/file upload
    clickatell = require('node-clickatell'), //SMS
    oauth2 = require("simple-oauth2")(credentials), // Outlook
    outlook = require("node-outlook");

var app = express();

//Config
app.use(bodyParser.json());

//require file with routes
require('./routes')(express, app, path);

//require file with methods/api, access to database
require('./method')(express, app, mongoose, path, nodemailer, CronJob, fs, busboy, clickatell, oauth2, outlook);

//Launch server
/*app.listen(4242, function(){
  console.log("Connected to server, port 4242.");
});*/

// launch server with ngrok
//https://e5230151.ngrok.io/
app.listen(8080, function(){
  console.log("Connected to server, port 8080.");
});

module.exports = app;
