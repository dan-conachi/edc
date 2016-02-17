var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config == require('./config');

//mongoose.connect('mongodb://localhost/domains-crawler-xugnad');
mongoose.connect(config.mongoConnect);
var db = mongoose.connection;

var init = function(options, callback) {
    //start CRUD opperations once connected
    db.once('open', function() {
        //insert the starting point for the crawl so we have a record in mongo
        insertInternalUrl(options.url, function() {
           callback(options);
        });
    });
};

var expiredSchema = new Schema({url : String}, {collection : 'expireds'});
var expiredModel = mongoose.model('expired', expiredSchema);

//insert expired domain record to the expireds collection
var insertExpired = function(domain) {
    var expired = new expiredModel({url : domain});
    expired.save(function(err, res) {
        if(err) {
            console.log(err.message);
        }
        else {
            console.log('external expired inserted!');
        }
    });
};

var internalUrlSchema = new Schema({url : String, crawled : {type : Boolean, default : false}}, {collection : 'internals'});
var internalUrlModel = mongoose.model('internal', internalUrlSchema);

function insertInternalUrl(url, callback) {
    var internalUrl = new internalUrlModel({url : url});
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
    internalUrlModel.update({url : crawledUrl}, {$set : {crawled : true}}, callBack);
};

// this returns a pointer - to be used with .exec(callback)
var urlQuery = function(url) {
    var urlRecord = internalUrlModel.findOne({url : url});
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
        internalUrlModel.findOne({_id : {$gt : objectID}}, function(err, res) {
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
    updateCrawledUrl : updateCrawledUrl
};
