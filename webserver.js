var express = require('express');
var app = express();
var path = require('path');
var db = require('./modules/CRUD');
var seo = require('./modules/seoData');
var bodyParser = require('body-parser');

var port = process.env.PORT || 8080;

//serve static files
app.use(express.static('client'));
app.use(express.static('node_modules'));
app.use(express.static('app'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/client/index.html'));
});

//rest API
var router = express.Router();

app.use('/api/v1', router);
router.route('/domains')
  .get(function(req, res) {
    db.getDomainsData({}, function(err, data) {
      res.send(data);
    });
  });
router.route('/domains/last/')
  .get(function(req, res) {
    db.getLastDomains(100, function(err, data) {
      res.send(data);
    });
  });
router.route('/domains/checkAvailability/:domain')
  .get(function(req, res) {
    seo.checkDomainRegistration(req.params.domain, function(err, data) {
      //send object {isAvailable : false/true}
      res.send(data);
    });
  });
router.route('/domains/last/:num')
  .get(function(req, res) {
    var num = req.params.num || 50;
    db.getLastDomains(num, function(err, data) {
      res.send(data);
    });
  });
router.route('/domains/search/:term/:backlinks/:limit')
  .get(function(req, res) {
    db.searchDomains(req.params.term, req.params.backlinks, req.params.limit, function(err, data) {
      res.send(data);
    });
  });
router.route('/domains/selected/')
  .post(function(req, res) {
    db.insertSelected(req.body, function(err, response) {
      res.send(response);
    });
  })
  .get(function(req, res) {
    var query = req.params || {};
    db.getSelectedDomains(query, function(err, data) {
      res.send(data);
    });
  });
router.route('/domains/selected/:id')
.delete(function(req, res) {
  db.removeSavedDomain(req.params.id, function(err, response) {
    if(err) {
      res.send(err);
      return;
    }
    res.send(response);
  });
});

app.listen(port);
