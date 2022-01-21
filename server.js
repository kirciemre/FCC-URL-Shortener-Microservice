'use strict';

require('dotenv').config();
var mongoose = require('mongoose');
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var validUrl = require('valid-url'); //for URL checking operation
var shortId = require('shortid'); // for generate short url
var app = express();
require('dotenv').config();

// MongoDB Connection START
// States are: 0= Disconnected, 1=Connected, 2=-Connecting, 3= Disconnecting
mongoose.connect(process.env.MONGO_URI, function(err) {
  if (err) return console.log("Error:", err);
  console.log("MongoDB Connection -- State:", mongoose.connection.readyState);
});
// MongoDB Connection END


const port = process.env.PORT || 3000;

// Need for reading POST payload.
app.use(bodyParser.urlencoded({
  extended: false //classic encoding!
}));
app.use(bodyParser.json());


// All of the static files path implementation.
app.use('/public', express.static(`${process.cwd()}/public`));

app.use(cors());

//Loads default index.html
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//Create URL schema
const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
})
const URL = mongoose.model("URL", urlSchema);

//Make async function to handle CRUD operations.
app.post('/api/shorturl', async function (req, res) {
  const url = req.body.url
  const urlCode = shortId.generate()
  // check if the url is valid or not
  if (!validUrl.isWebUri(url)) { //use validUrl package to check urlIsValid?
    res.json({ error: 'invalid url' })
  } else {
    try {
      let findOne = await URL.findOne({
        original_url: url
      })
      if (findOne) { // If URL already in the database
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      } else { // If unique URL posted.
        findOne = new URL({
          original_url: url,
          short_url: urlCode
        })
        await findOne.save()
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      }
    } catch (err) { //error handling
      console.error(err)
      res.status(500).json('Server error occured :(')
    }
  }
})

app.get('/api/shorturl/:short_url?', async function (req, res) { //short to long url
  try {
    const urlParams = await URL.findOne({
      short_url: req.params.short_url
    })
    if (urlParams) {
      return res.redirect(urlParams.original_url)
    } else {
      return res.status(404).json('No URL found')
    }
  } catch (err) {
    console.log(err)
    res.status(500).json('Server error')
  }
})


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
