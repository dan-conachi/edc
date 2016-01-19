var URL = require('url');
var req = require('request');

//url type to be checked against the host domain that's beeing crawled / returns 'internal' or 'external'
var urlType = function(url, host) {
    var type = '';
    var parsedUrl = URL.parse(url); //parse the URL string into an object
    var hostUrl = URL.parse(host);
    if(parsedUrl.host && (parsedUrl.host !== hostUrl.host)) {
        //different domain from the host that has to be saved into collection
        type = 'external';
    }
    else { //internal url
        type = 'internal';
    }
    
    return type;
}

var getDomainName = function(url) {
    var parsedUrl = URL.parse(url); //parse the URL string into an object
    return parsedUrl.hostname;
}

var isExpired = function(url) {
    
}

var manageExternalUrl = function(url) {
    if(isExpired(url)) {
        //if expired insert into collection
    }
}

module.exports = {
     urlType : urlType
}