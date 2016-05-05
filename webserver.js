var express = require('express');
var app = express();
var path = require('path');
var db = require('./modules/CRUD');

var port = process.env.PORT || 8080;

//serve static files
app.use(express.static('client'));
app.use(express.static('node_modules'));
app.use(express.static('app'));

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
router.route('/domains/last/:num')
  .get(function(req, res) {
    var num = req.params.num || 50;
    db.getLastDomains(num, function(err, data) {
      res.send(data);
    });
  });

app.listen(port);
