'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config.js');

//schema for internal urls
var expiredSchema = new Schema({url : String, backlinks : Number}, {collection : 'expireds'});
var ExpiredModel = mongoose.model('expired', expiredSchema);

//schema for expired domains
var internalUrlSchema = new Schema({url : {type : String, index : true, unique : true}, crawled : {type : Boolean, default : false}}, {collection : 'internals'});
var InternalUrlModel = mongoose.model('internal', internalUrlSchema);

//schema for source domains
var sourceSchema = new Schema({url : {type : String, index : true}, crawled : {type : Boolean, default : false}}, {collection : 'sources'});
var SourceModel = mongoose.model('source', sourceSchema);

//schema for internal urls
var selectedSchema = new Schema({url : String, backlinks : Number}, {collection : 'selecteds'});
var SelectedModel = mongoose.model('selected', selectedSchema);

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
          return;
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
function updateInternalCrawledUrl(id, callback) {
    InternalUrlModel.update({_id : id}, {$set : {crawled : true}}, callback);
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
        console.log(err);
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

/*API methods */

function getDomainsData(query, callback) {
  var q = query || {};
  //var expired = new ExpiredModel();
  ExpiredModel.find(q).exec(function(err, data) {
    callback(err, data);
  });
}

function getLastDomains(number, callback) {
  var num = number || 50;
  ExpiredModel.find().limit(num).sort({_id : -1}).exec(function(err, data) {
    callback(err, data);
  });
}

function searchDomains(term, minBacklinks, limit, callback) {
  var optionsArray = [];
  var regexp = term === 'undefined' ? /./g : new RegExp(term, 'g');
  optionsArray.push({url : regexp});
  var backlinks = minBacklinks === 'undefined' ? 0 : minBacklinks;
  optionsArray.push({backlinks : {$gt : backlinks}})
  var num = limit === 'undefined' ? 500 : limit;
  console.log('optionsArray url: ' + optionsArray[0].url);
  console.log('optionsArray backlinks: ' + optionsArray[1].backlinks);

  ExpiredModel.find({$and : optionsArray}).limit(num).exec(function(err, data) {
    console.log(data);
    callback(err, data);
  });
}

function insertSelected(record, callback) {
  //record must be an object with expired schema properties
    var selected = new SelectedModel(record);
    selected.save(function(err, res) {
        if(err) {
            console.log(err.message);
            callback(err, null);
            return;
        }
        callback(null, res);
    });
};

function getSelectedDomains(query, callback) {
  var q = query || {};
  SelectedModel.find(q).exec(function(err, data) {
    callback(err, data);
  });
}

function removeSavedDomain(id, callback) {
  if((id !== undefined) && (id.length > 0)) {
    SelectedModel.remove({_id : mongoose.Types.ObjectId(id)}, function(err, res) {
      if(err) {
        callback(err, null);
      } else {
        callback(null, res);
      }
    });
  } else {
    callback('no id provided', null);
  }
}

/*End API*/

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
    lastCrawledInternalUrl : lastCrawledInternalUrl,
    getDomainsData : getDomainsData,
    getLastDomains : getLastDomains,
    searchDomains : searchDomains,
    insertSelected : insertSelected,
    getSelectedDomains : getSelectedDomains,
    removeSavedDomain : removeSavedDomain
};
