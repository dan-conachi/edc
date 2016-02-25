var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config');

//schema for internal urls
var expiredSchema = new Schema({url : String}, {collection : 'expireds'});
var ExpiredModel = mongoose.model('expired', expiredSchema);

//schema for expired domains
var internalUrlSchema = new Schema({url : {type : String, index : true}, crawled : {type : Boolean, default : false}}, {collection : 'internals'});
var InternalUrlModel = mongoose.model('internal', internalUrlSchema);

//schema for source domains
var sourceSchema = new Schema({url : {type : String, index : true}, crawled : {type : Boolean, default : false}}, {collection : 'sources'});
var SourceModel = mongoose.model('source', sourceSchema);

//mongoose.connect(config.mongoConnect);
mongoose.connect(process.env.MONGOLAB_URI.toString());
var conn = mongoose.connection;

var init = function(options, callback) {
    //start CRUD opperations once connected
    conn.once('open', function() {
        //insert the starting point for the crawl so we have a record in mongo
        insertInternalUrl(options.url, function() {
           callback(options);
        });
    });
};

//insert expired domain record to the expireds collection
var insertExpired = function(domain) {
    var expired = new ExpiredModel({url : domain});
    expired.save(function(err, res) {
        if(err) {
            console.log(err.message);
        }
    });
};

function insertInternalUrl(url, callback) {
    var internalUrl = new InternalUrlModel({url : url});
    if(!url) {
        callback();
        return;
    }
    internalUrl.save(function(err, res) {
        if(err) console.log(err.message);
        if(callback) {
            callback();
        }
    });
}

function rebuildInternalCollection(callback) {
  conn.collections['internals'].drop(function(err, res) {
    if(err) {
      console.log(err.message);
    }
    else {
      conn.db.createCollection(
        'internals',
        {url : String, crawled : {type : Boolean, default : false}},
        function(err, res) {
          conn.collections['internals'].createIndex({url : true}, {unique : true}, function() {
            callback();
          });
        }
      );
    }
  });
}

var lastCrawledUrl = function(model, callback) {
    model.find({'crawled' : true}).sort({_id : -1}).limit(1).exec(function(err, data) {
            if(err)  console.log(err.message);
            callback(err, data);
        });
};

var updateInternalCrawledUrl = function(crawledUrl, callBack) {
    InternalUrlModel.update({url : crawledUrl}, {$set : {crawled : true}}, callBack);
};

var updateSourceCrawledDomain = function(crawledUrl, callBack) {
    //use regexp to search only the domain name
    var domain = crawledUrl.substr(0, crawledUrl.indexOf('.'));
    var domainMatch = new RegExp(domain, 'g');
    SourceModel.update({url : domainMatch}, {$set : {crawled : true}}, callBack);
};

// this returns one document matching url
var urlQuery = function(model, url, callback) {
    model.findOne({url : url}, function(err, res) {
      callback(err, res);
    });
};

function urlInternalQuery(url, callback) {
  urlQuery(InternalUrlModel, url, function(err, res) {
    callback(err, res);
  });
}

function urlSourceQuery(url, callback) {
  urlQuery(SourceModel, url, function(err, res) {
    callback(err, res);
  });
}

var getNextRecord = function(model, search, callback) {
    var objectID;
    var serachMatch = new RegExp(search, 'g');
    urlQuery(model, serachMatch, function(err, res) {
      //first find the record with the url
      if(err) console.log(err.message);
      if(res) {
          objectID = res._id;
      }
      if(!objectID) {
          //no ID found, search for the last crawled url
          lastCrawledUrl(model, function(err, res) {
              callback(err, res);
          });
      }
      //if not NULL it will return a record object containing all fields
      model.findOne({_id : {$gt : objectID}}, function(err, res) {
          if(err) console.log(err.message);
          //if no record is returned that could mean the end of the url crawl stack
          callback(err, res);
      });
    });
};

//search internal urls by slug
function getNextInternalRecord(slug, callback) {
  getNextRecord(InternalUrlModel, slug, function(err, res) {
    callback(err, res);
  });
}

//get next domain to be crawled
function getNextSourceDomain(domain, callback) {
  //domain match should be a regexp not a string!
  var domainName = domain.substr(0, domain.indexOf('.'));
  var domainMatch = new RegExp(domainName, 'g');
  getNextRecord(SourceModel, domainName, function(err, res) {
    callback(err, res);
  });
}

module.exports = {
    init: init,
    insertExpired : insertExpired,
    insertInternalUrl : insertInternalUrl,
    getNextInternalRecord : getNextInternalRecord,
    updateInternalCrawledUrl : updateInternalCrawledUrl,
    updateSourceCrawledDomain : updateSourceCrawledDomain,
    rebuildInternalCollection : rebuildInternalCollection,
    getNextSourceDomain : getNextSourceDomain
};
