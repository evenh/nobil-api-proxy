/*
 * Simple PoC Nobil API Proxy
 *
 * Coded by Even Holthe for use in a
 * Android project @ HiOA
 */

var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var request    = require('request');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

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
    baseRequest = request.defaults({
      headers: { 'X-Forwarded-For': req.ip }
    });

    next();
  }
});

/* CHARGERS */

// A single charger
router.get('/chargers/id/:charger_id', function(req, res) {
  if(!req.params.charger_id) res.status(400).send({error: "Missing charger id"});

  baseRequest.post({
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

  baseRequest.post({
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
router.get('/chargers/near/:lat/:lon', function(req, res) {
  if(!req.params.lat || !req.params.lon) res.status(400).send({error: "Missing latitude and longitude coordinates!"});

  baseRequest.post({
    url: nobil_api,
    form: {
      apikey: nobil_api_key,
      apiversion: 3,
      action: "search",
      type: "near",
      lat: req.params.lat,
      long: req.params.lon,
      distance: (!req.query.distance ? 500 : req.query.distance),
      limit: (!req.query.limit ? 10 : req.query.limit)
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
    baseRequest.post({
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
router.get('/stats/:country/county/:county_id', function(req, res) {
  if(req.params.country == "NOR" || req.params.country == "SWE" || req.params.country == "DAN"){
    // If empty county id
    if(!req.params.county_id) res.status(400).send({error: "No county code specified"});

    baseRequest.post({
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
router.get('/stats/:country/county/:county_id/municipalities', function(req, res) {
  if(req.params.country == "NOR" || req.params.country == "SWE" || req.params.country == "DAN"){
    // If empty county id
    if(!req.params.county_id) res.status(400).send({error: "No county code specified"});

    baseRequest.post({
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

    baseRequest.post({
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

    baseRequest.post({
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


// Path for API calls (/api)
app.use('/api', router);

// Start server
app.listen(port);
console.log('Charge your car @ port ' + port);
