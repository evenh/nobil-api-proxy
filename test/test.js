var assert = require("assert")
var request = require("supertest");
var should = require("should");

// Nobils public API key
var API_KEY = "2048b60b804ac019155675421c0ddb13";
var auth = { 'X-Authorization': API_KEY };

describe('Nobil API Proxy tests', function() {
  var url = 'http://127.0.0.1:' + (process.env.PORT || 8080) + "/api";

  // First test suite
  describe('Single chargers', function() {
    it('should return a single charger', function(done) {
      request(url)
      .get('/chargers/id/NOR_00341')
      .set(auth)
      .end(function(err, res) {
        if (err) throw err;
        should(res.status).be.exactly(200);
        should(res.body.csmd).have.property('id');
        done();
      });
    });

    it('should provide an error searching for an invalid charger', function(done) {
      request(url)
      .get('/chargers/id/FOFOFOFOFO_42')
      .set(auth)
      .end(function(err, res) {
        if (err) throw err;
        should(res.status).be.exactly(400);
        should(res.body).have.property('error');
        done();
      });
    });

  });

  // Second test suite
  describe('Chargers by location', function() {
    it('should find chargers near vitaminveien', function(done) {
      request(url)
      .get('/chargers/place/vitaminveien,oslo')
      .set(auth)
      .end(function(err, res) {
        if (err) throw err;
        should(res.status).be.exactly(200);
        should(res.body).not.have.property('error');
        should(res.body[0].csmd).have.property('id');
        done();
      });
    });

    it('should not find chargers when place is not specified', function(done) {
      this.timeout(6000);
      request(url)
      .get('/chargers/place/0')
      .set(auth)
      .end(function(err, res) {
        if (err) throw err;
        should(res.status).be.exactly(400);
        should(res.body).have.property('error');
        done();
      });
    });

    it('should not find chargers in Hell', function(done) {
      request(url)
      .get('/chargers/place/Hell')
      .set(auth)
      .end(function(err, res) {
        if (err) throw err;
        should(res.status).be.exactly(400);
        should(res.body).have.property('error');
        done();
      });
    });


    it('should find chargers by map references', function(done) {
      this.timeout(6000);

      request(url)
      .get('/chargers/map/(59.943921193288915,10.826683044433594)/(59.883683240905256,10.650901794433594)')
      .set(auth)
      .end(function(err, res) {
        if (err) throw err;
        should(res.status).be.exactly(200);
        should(res.body).not.have.property('error');
        done();
      });
    });


    it('should not find chargers by invalid map references', function(done) {
      request(url)
      .get('/chargers/map/(foo,bar)/(baz,123)')
      .set(auth)
      .end(function(err, res) {
        if (err) throw err;
        should(res.status).be.exactly(400);
        should(res.body).have.property('error');
        done();
      });
    });

    it('should find chargers near coordinates', function(done) {
      request(url)
      .get('/chargers/near/59.91673/10.74782?distance=500&limit=10')
      .set(auth)
      .end(function(err, res) {
        if (err) throw err;
        should(res.status).be.exactly(200);
        should(res.body).not.have.property('error');
        done();
      });
    });

    it('should not find chargers near invalid coordinates', function(done) {
      request(url)
      .get('/chargers/near/2/3.14?distance=500&limit=10')
      .set(auth)
      .end(function(err, res) {
        if (err) throw err;
        should(res.status).be.exactly(400);
        should(res.body).have.property('error');
        done();
      });
    });

  });


});
