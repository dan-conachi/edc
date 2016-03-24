var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config');

//schema for internal urls
var expiredSchema = new Schema({url : String, backlinks : Number}, {collection : 'expireds'});
var ExpiredModel = mongoose.model('expired', expiredSchema);

//schema for expired domains
var internalUrlSchema = new Schema({url : {type : String, index : true, unique : true}, crawled : {type : Boolean, default : false}}, {collection : 'internals'});
var InternalUrlModel = mongoose.model('internal', internalUrlSchema);

//schema for source domains
var sourceSchema = new Schema({url : {type : String, index : true}, crawled : {type : Boolean, default : false}}, {collection : 'sources'});
var SourceModel = mongoose.model('source', sourceSchema);

//mongoose.connect(config.mongoConnect);
mongoose.connect(process.env.MONGOLAB_URI.toString());
var conn = mongoose.connection;

//insert expired domain record to the expireds collection
var insertExpired = function(record, callback) {
  //record must be an object with expired schema properties
    var expired = new ExpiredModel(record);
    expired.save(function(err, res) {
        if(err) {
            console.log(err.message);
        }
        callback(err, res);
    });
};

function insertInternalUrl(url, callback) {
    var internalUrl = new InternalUrlModel({url : url});

    //build collection if not present
    if(!conn.collections['internals']) {
      rebuildInternalCollection(function() {
        internalUrl.save(function(err, res) {
            if(err) console.log(err.message);
            if(callback) {
                callback(err, res);
            }
        });
      });
    }
    else {
      internalUrl.save(function(err, res) {
          if(callback) {
              callback(err, res);
          }
      });
    }
}

function insertSource(domain, callback) {
  var source = new SourceModel({url : domain});
  source.save(function(err, res) {
    callback(err, res);
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
        {url : {type : String, index : true, unique : true}, crawled : {type : Boolean, default : false}},
        function(err, res) {
          conn.collections['internals'].createIndex({url : 1}, {unique : true}, function(err, res) {
            callback();
          });
        });
    }
  });
}

//this should return an object with data or null if no data returned
var lastCrawledUrl = function(model, callback) {
    model.find({crawled : true}).sort({_id : -1}).limit(1).exec(function(err, data) {
      if(Array.isArray(data)) {
        if(data.length === 0) {
          //no data returned
          callback(null, null);
        }
        callback(err, data[0]);
      }
      else {
        callback(err, data);
      }
    })
};

function lastCrawledDomain(callback) {
  lastCrawledUrl(SourceModel, function(err, data) {
    if(err) console.log(err.message);
    callback(err, data);
  });
}

function lastCrawledInternalUrl(callback) {
  lastCrawledUrl(InternalUrlModel, function(err, data) {
    callback(err, data);
  });
}

//use here objectId!
function updateInternalCrawledUrl(id, callBack) {
    InternalUrlModel.update({_id : id}, {$set : {crawled : true}}, callBack);
}

//use here objectId!
function updateSourceCrawledDomain(id, callBack) {
    //use regexp to search only the domain name
    //var domain = crawledUrl.substr(0, crawledUrl.indexOf('.'));
    //var domainMatch = new RegExp(domain, 'g');
    SourceModel.update({_id : id}, {$set : {crawled : true}}, callBack);
}

// this returns one document matching url
var urlQuery = function(model, url, callback) {
    if(!(url instanceof RegExp)) {
      url = new RegExp(url, 'g');
    }
    model.findOne({'url' : url}, function(err, res) {
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

//use here objectId!
var getNextRecord = function(model, id, callback) {
    //var objectID;
    //search = search.replace(/([.*%+?^=!:;${}()|\[\]\/\\])/g, "\\$1");
    //var searchMatch = new RegExp(search, 'g');
    model.findOne({_id : {$gt : mongoose.Types.ObjectId(id)}}, function(err, res) {
        if(err) console.log(err.message);
        //if we still didn't got any res check if there are documents with uncrawled urls
        if(!res) {
          model.find({crawled:false}).count(function(num) {
            if(num > 0) {
              //last
              console.log('not all crawled but ended!!!');
              model.findOne({crawled:false}, function(err, data) {
                callback(err, data);
              });
              return;
            }
            else {
              callback(err, null);
            }
          });
        }
        else {
          //if no record is returned that could mean the end of the url crawl stack
          callback(err, res);
        }
    });
};

//search internal urls by objectId
function getNextInternalRecord(id, callback) {
  getNextRecord(InternalUrlModel, id, function(err, res) {
    callback(err, res);
  });
}

//get next domain by objectId
function getNextSourceDomain(id, callback) {
  //domain match should be a regexp not a string!
  //var domainName = domain.substr(0, domain.indexOf('.'));
  //var domainMatch = new RegExp(domainName, 'g');
  getNextRecord(SourceModel, id, function(err, res) {
    callback(err, res);
  });
}

//crawl object
var crawlObj = {
  request : {
    method : 'GET',
    url : ''
  },
  internalUrlId : '',
  internalUrl : '',
  currentDomainId : '',
  domainName : ''
};

function init(callback) {
    //start CRUD opperations once connected
    conn.once('open', function() {
      lastCrawledDomain(function(err, data) {
        if(err) throw new Error(err.message);
        //no crawled domains in collection
        if(!data) {
          SourceModel.findOne({}, function(err, data) {
            crawlObj.domainName = data.url;
            crawlObj.currentDomainId = data._id;
          });
        }
        else {
          crawlObj.domainName = data.url;
          crawlObj.currentDomainId = data._id;
          getNextSourceDomain(crawlObj.currentDomainId, function(err, data) {
            crawlObj.domainName = data.url;
            crawlObj.currentDomainId = data._id;
          });
        }
        lastCrawledInternalUrl(function(err, data) {
          if(err) throw new Error(err.message);
          //if internals collection is empty
          if(!data) {
            InternalUrlModel.findOne({}, function(err, data) {
              //findone return an object or null!
              if(!data) {
                //this means no url in collection - insert domain start
                insertInternalUrl(crawlObj.domainName, function(err, data) {
                  if(!data) {
                    throw new Error('Init error : no id for internal url');
                  }
                  else {
                    crawlObj.internalUrlId = data._id;
                    crawlObj.internalUrl = crawlObj.domainName;
                    crawlObj.request.url = crawlObj.domainName;
                    callback(err, crawlObj.request);
                  }
                });
              }
              else {
                crawlObj.internalUrlId = data._id; //data id from lastCrawledUrl!
                crawlObj.internalUrl = data.url;
                crawlObj.request.url = data.url;
                callback(err, crawlObj.request);
              }
            });
          }
          else {
            crawlObj.internalUrlId = data._id; //data id from lastCrawledUrl!
            crawlObj.internalUrl = data.url;
            crawlObj.request.url = data.url;
            callback(err, crawlObj.request);
          }
        });
      });
    });
};

module.exports = {
    init: init,
    crawlObj: crawlObj,
    insertExpired : insertExpired,
    insertSource : insertSource,
    insertInternalUrl : insertInternalUrl,
    getNextInternalRecord : getNextInternalRecord,
    updateInternalCrawledUrl : updateInternalCrawledUrl,
    updateSourceCrawledDomain : updateSourceCrawledDomain,
    rebuildInternalCollection : rebuildInternalCollection,
    getNextSourceDomain : getNextSourceDomain,
    lastCrawledDomain : lastCrawledDomain,
    lastCrawledInternalUrl : lastCrawledInternalUrl
};
