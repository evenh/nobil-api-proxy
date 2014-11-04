// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');    // call express
var app        = express();         // define our app using express
var bodyParser = require('body-parser');
var request    = require('request');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;
var router = express.Router();

// Nobil specific
nobil_api = 'http://nobil.no/api/server/search.php';
nobil_api_key = "";

// For every request recieved
router.use(function(req, res, next) {
  console.log('Recieved request from ' + req.ip + ' for ' + req.path);

  // Fetch API-key from headers
  nobil_api_key = req.get('X-Authorization');

  if(!nobil_api_key){
    console.log("\tClient is missing API key, rejecting");
    res.json({error: "API key is missing!"});
  } else {
    next();
  }
});

/* CHARGERS */

// A single charger
router.get('/chargers/id/:charger_id', function(req, res) {
  if(!req.params.charger_id) res.status(400).send({error: "Missing charger id"});

  request.post({
    url: nobil_api,
    form: {
      apikey: nobil_api_key,
      apiversion: 3,
      action: "search",
      type: "id",
      id: req.params.charger_id
    }
  }, function(err,httpResponse,body){
    if(err) res.status(406).send(err);

    var object = JSON.parse(body);

    if(object.error != undefined){
      res.status(400).send(object)
    } else {
      res.json(object.chargerstations[0]);
    }
  });
});

// A charger my map references
router.get('/chargers/map/:northeast/:southwest', function(req, res) {
  if(!req.params.northeast || !req.params.southwest) res.status(400).send({error: "Missing northeast and southwest map coordinates!"});

  request.post({
    url: nobil_api,
    form: {
      apikey: nobil_api_key,
      apiversion: 3,
      action: "search",
      type: "rectangle",
      northeast: req.params.northeast,
      southwest: req.params.southwest,
    }
  }, function(err,httpResponse,body){
    if(err) res.status(406).send(err);

    var object = JSON.parse(body);

    if(object.error != undefined){
      res.status(400).send(object)
    } else {
      res.json(object.chargerstations[0]);
    }

  });
});

// A charger near a map reference... TODO: POST + limit?
router.get('/chargers/near/:lat/:lon/:distance', function(req, res) {
  if(!req.params.lat || !req.params.lon || !req.params.distance) res.status(400).send({error: "Missing latitude and longitude coordinates and/or distance!"});

  request.post({
    url: nobil_api,
    form: {
      apikey: nobil_api_key,
      apiversion: 3,
      action: "search",
      type: "near",
      lat: req.params.lat,
      long: req.params.lon,
      distance: req.params.distance,
      limit: 10
    }
  }, function(err,httpResponse,body){
    if(err) res.status(406).send(err);

    var object = JSON.parse(body);

    if(object.error != undefined){
      res.status(400).send(object)
    } else {
      res.json(object.chargerstations);
    }

  });
});



/* STATS */

// Get stats for all counties
router.get('/stats/:country', function(req, res) {
  if(req.params.country == "NOR" || req.params.country == "SWE" || req.params.country == "DAN"){
    request.post({
      url: nobil_api,
      form: {
        apikey: nobil_api_key,
        apiversion: 3,
        action: "search",
        type: "stats_TotalsAllCounties",
        countrycode: req.params.country
      }
    }, function(err,httpResponse,body){
      if(err) res.status(406).send(err);

      var object = JSON.parse(body);

      if(object.error != undefined){
        res.status(400).send(object)
      } else {
        res.json(object.chargerstations);
      }
    });
  } else {
    res.status(400).send({ error: "Country code must be NOR, SWE or DAN"});
  }
});

// Get stats for a single county
router.get('/stats/:country/:county_id', function(req, res) {
  if(req.params.country == "NOR" || req.params.country == "SWE" || req.params.country == "DAN"){
    // If empty county id
    if(!req.params.county_id) res.status(400).send({error: "No county code specified"});

    request.post({
      url: nobil_api,
      form: {
        apikey: nobil_api_key,
        apiversion: 3,
        action: "search",
        type: "stats_TotalsByCountyId",
        countrycode: req.params.country,
        id: req.params.county_id
      }
    }, function(err,httpResponse,body){
      if(err) res.status(406).send(err);

      var object = JSON.parse(body);

      if(object.error != undefined){
        res.status(400).send(object)
      } else {
        res.json(object.chargerstations[0]);
      }
    });
  } else {
    res.status(400).send({ error: "Country code must be NOR, SWE or DAN"});
  }
});

// Get stats for a single county with municipalities
router.get('/stats/:country/:county_id/municipalities', function(req, res) {
  if(req.params.country == "NOR" || req.params.country == "SWE" || req.params.country == "DAN"){
    // If empty county id
    if(!req.params.county_id) res.status(400).send({error: "No county code specified"});

    request.post({
      url: nobil_api,
      form: {
        apikey: nobil_api_key,
        apiversion: 3,
        action: "search",
        type: "stats_DetailedTotalsByCountyId",
        countrycode: req.params.country,
        id: req.params.county_id
      }
    }, function(err,httpResponse,body){
      if(err) res.status(406).send(err);

      var object = JSON.parse(body);

      if(object.error != undefined){
        res.status(400).send(object)
      } else {
        res.json(object.chargerstations);
      }
    });
  } else {
    res.status(400).send({ error: "Country code must be NOR, SWE or DAN"});
  }
});

// Get stats for a single county with municipalities
router.get('/stats/:country/municipalities/:municipality', function(req, res) {
  if(req.params.country == "NOR" || req.params.country == "SWE" || req.params.country == "DAN"){
    // If empty municipality id
    if(!req.params.municipality) res.status(400).send({error: "No municipality id specified"});

    request.post({
      url: nobil_api,
      form: {
        apikey: nobil_api_key,
        apiversion: 3,
        action: "search",
        type: "stats_TotalsByMunicipalId",
        countrycode: req.params.country,
        id: req.params.municipality
      }
    }, function(err,httpResponse,body){
      if(err) res.status(406).send(err);

      var object = JSON.parse(body);

      if(object.error != undefined){
        res.status(400).send(object)
      } else {
        res.json(object.chargerstations[0]);
      }
    });
  } else {
    res.status(400).send({ error: "Country code must be NOR, SWE or DAN"});
  }
});

// Get detailed stats for a single county with municipalities
router.get('/stats/:country/municipalities/:municipality/detail', function(req, res) {
  if(req.params.country == "NOR" || req.params.country == "SWE" || req.params.country == "DAN"){
    // If empty municipality id
    if(!req.params.municipality) res.status(400).send({error: "No municipality id specified"});

    request.post({
      url: nobil_api,
      form: {
        apikey: nobil_api_key,
        apiversion: 3,
        action: "search",
        type: "stats_DetailTotalsByMunicipalId",
        countrycode: req.params.country,
        id: req.params.municipality
      }
    }, function(err,httpResponse,body){
      if(err) res.status(406).send(err);

      var object = JSON.parse(body);

      if(object.error != undefined){
        res.status(400).send(object)
      } else {
        res.json(object.chargerstations);
      }
    });
  } else {
    res.status(400).send({ error: "Country code must be NOR, SWE or DAN" });
  }
});


// Calls will go against root (/)
app.use('/', router);

// Start server
app.listen(port);
console.log('Charge your car @ port ' + port);