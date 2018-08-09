var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

// Grabs models
var db = require("./models");

// Define Port
var PORT = 3000;

// Initialize Express
var app = express();

// Middleware Config

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/gooseScrape");

// ROUTES

// Home Route
app.get("/", function(req, res) {
  res.send("index.html");
});

// Scrape Route
app.get("/scrape", function(req, res) {
  console.log("The goose is scraping");
  // axios performs a similar function as either request/fetch
  axios.get("https://www.reddit.com/").then(function(response) {
    var $ = cheerio.load(response.data);
    // reddit span y8HYJ-y_lTUHkQIc1mdCq
    $("span h2").each(function(i, element) {
      var result = {};
      result.title = $(this)
        // .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      db.Article.create(result)
        .then(function(dbArticle) {
          console.log("Articles:" + dbArticle);
        })
        .catch(function(err) {
          return res.json(err);
        });
    });
    res.send("Scrape Successful!");
  });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Port Connection
var port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log("Scraper is listening on ", port);
});
