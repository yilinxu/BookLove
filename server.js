// =============================================================|
// Server.js - This file is the initial starting point for the Node/Express server.
// =============================================================|

var express = require("express");

// Sets up the Express App
// =============================================================|
var app = express();
var PORT = process.env.PORT || 8080;

// Dependencies
// =============================================================|
var bodyParser = require("body-parser");
var db = require("./models");

// Sets up the Express app to handle data parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

// Nexmo for SMS messaging 
var config = require("./app/config/config.js");

const Nexmo = require('nexmo');
const nexmo = new Nexmo({
  apiKey: config.apiKey,
  apiSecret: config.apiSecret
});


// Syncing our sequelize models and then starting our express app
db.sequelize.sync({ force: false }).then(function() {
    app.listen(PORT, function() {
        console.log(`Server running http://localhost:${PORT}, Ctrl + c to stop`);
    });
});






















