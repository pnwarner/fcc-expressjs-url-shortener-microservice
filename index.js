require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
var bodyParser = require("body-parser");
const cors = require('cors');
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI);
const Schema = mongoose.Schema;
const shortURLSchema = new Schema({
  url: { type: String, Required: true },
  url_id: Number
});

let ShortURL = mongoose.model("ShortURL", shortURLSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:number', async (req, res) => {
  const number = req.params.number;
  try {
    var query = await ShortURL.find({url_id: number});
    if (query.length === 0) {
      res.json({error: 'invalid record'});
    } else {
      res.redirect(query[0].url);
    }
  } catch(error) {
    res.json({error: 'error'});
  }
  
});

app.post('/api/shorturl', async (req, res) => {
  let {url: url} = req.body;
  try {
    var query = await ShortURL.find({url: url});
    if (query.length === 0) {
      // Record does not exist. Attempt to create a new record
      const urlRegex = /^(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;
      if (urlRegex.test(url)){
        //Check specifically for protocol:
        const protocolRegex =  /^https?:\/\//;
        if (!protocolRegex.test(url)) url = "https://" + url;
        var records = await ShortURL.find();
        var recordsLen = records.length;
        let newDocument = new ShortURL({ url: url, url_id: recordsLen + 1 });
        newDocument.save();
        res.json({ original_url: url, short_url: recordsLen + 1 }) 
      } else {
        //Improper URL was given
        res.json({error: 'invalid url'});
      }
    } else {
      //Record was located. Return existing record instead of creating a new one
      res.json({original_url: query[0].url, short_url: query[0].url_id})
    }
  } catch(error) {
    res.json({error: "error"});
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
