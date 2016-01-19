var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/domains-crawler-xugnad');
var db = mongoose.connection;

var expiredSchema = new Schema({url : String}, {collection : 'expireds'});
var expiredModel = mongoose.model('expired', expiredSchema);

//insert expired domain recort to the expireds collection
var insertExpired = function(domain) {
    var expired = new expiredModel({link : domain});
    expired.save(function(err, success) {
        if(err) console.log(err.message);
        console.log('inserted!');
    });
}

var init = function(callback) {
    db.once('open', callback);
};


module.exports = {
    insertExpired : insertExpired,
    init: init
}
