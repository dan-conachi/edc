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
var sourceSchema = new Schema({url : String}, {collection : 'sources'});
var SourceModel = mongoose.model('source', expiredSchema);

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
          conn.collections['internals'].createIndex({url : 1}, {unique : true}, function() {
            callback();
          });
        }
      );
    }
  });
}

var findLastCrawledUrl = function(callback) {
    var recordId;
    internalUrlModel
        .find({'crawled' : true})
        .sort({_id : -1})
        .limit(1)
        .exec(function(err, data) {
            if(err)  console.log(err.message);
            if(Array.isArray(data)) {
                recordId = data[0]._id;
            }
            else {
                console.log('no ID found - tuk: data=' + data._id);
                return;
            }
        });
    if(recordId) {
        callback(recordId);
    }
    else {
        callback(false);
    }
};

var updateCrawledUrl = function(crawledUrl, callBack) {
    InternalUrlModel.update({url : crawledUrl}, {$set : {crawled : true}}, callBack);
};

// this returns a pointer - to be used with .exec(callback)
var urlQuery = function(url) {
    var urlRecord = InternalUrlModel.findOne({url : url});
    return urlRecord;
};

var getNextRecord = function(url, callback) {
    var objectID;
    var urlInDb = urlQuery(url);
    //first find the record with the url
    urlInDb.exec(function(err, res) {
        if(err) console.log(err.message);
        if(res) {
            objectID = res._id;
        }
        if(!objectID) {
            //no ID found, search for the last crawled url
            findLastCrawledUrl(function(res) {
                callback(res);
            });
            return;
        }
        //if not NULL it will return a record object containing all fields
        InternalUrlModel.findOne({_id : {$gt : objectID}}, function(err, res) {
            if(err) console.log(err.message);
            //if no record is returned that could mean the end of the url crawl stack
            callback(res);
        });
    });
};

module.exports = {
    init: init,
    insertExpired : insertExpired,
    insertInternalUrl : insertInternalUrl,
    getNextRecord : getNextRecord,
    updateCrawledUrl : updateCrawledUrl,
    rebuildInternalCollection : rebuildInternalCollection
};
